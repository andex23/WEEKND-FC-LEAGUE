"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter, usePathname } from "next/navigation"
import { AdminOverlayNav } from "@/components/admin/overlay-nav"
import { toast } from "sonner"
import { AlertTriangle, CalendarDays, CheckCircle2, Download, Search, ShieldCheck, Trash2, Trophy, type LucideIcon, Users } from "lucide-react"

// All persistence is via Supabase. Remove local storage to avoid duplicates.

export default function AdminPlayersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [players, setPlayers] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [edit, setEdit] = useState<any | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const load = async () => {
    const api = await fetch("/api/admin/players").then((x) => x.json()).catch(() => ({ players: [] }))
    setPlayers(api.players || [])
  }
  useEffect(() => { load() }, [])

  const activeCount = useMemo(() => players.filter((p) => String(p.status) === "approved").length, [players])
  const pendingCount = useMemo(() => players.filter((p) => String(p.status || "pending").toLowerCase() === "pending").length, [players])
  const rejectedCount = useMemo(() => players.filter((p) => String(p.status || "").toLowerCase() === "rejected").length, [players])
  const canCreateTournament = activeCount >= 6 && activeCount % 2 === 0

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return players.filter((p) => {
      const status = String(p.status || "pending").toLowerCase()
      if (statusFilter !== "all" && status !== statusFilter) return false
      if (!query) return true
      return [p.name, p.username, p.email, (p as any).gamer_tag, p.psn_name, p.preferred_club, p.console, p.location].some((v) => String(v || "").toLowerCase().includes(query))
    })
  }, [players, q, statusFilter])

  const onAdded = () => load()

  const updatePlayerStatus = async (player: any, nextStatus: "approved" | "pending" | "rejected") => {
    const previousStatus = String(player.status || "pending").toLowerCase()
    const response = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: player.id, status: nextStatus }),
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok || !result.success) {
      throw new Error(result?.error || "Failed to update player status")
    }

    if (nextStatus === "approved") {
      toast.success(result.emailSent ? "Player approved and confirmation email sent." : "Player approved successfully")
    } else if (nextStatus === "rejected") {
      toast.success("Player rejected")
    } else if (previousStatus === "approved") {
      toast.success("Player moved back to pending. Fixtures and standings were recalculated.")
    } else {
      toast.success("Player moved back to pending")
    }

    await load()
  }

  const importCsv = async (file: File) => {
    const text = await file.text()
    await importFromText(text)
  }

  const importFromText = async (text: string) => {
    setImporting(true)
    try {
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length === 0) {
        console.log("No data to import")
        return
      }
      
      const header = lines[0].split(",").map((h) => h.replaceAll('"','').trim().toLowerCase())
      console.log("CSV Header:", header)
      
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.replaceAll('"','').trim())
        const obj: any = {}
        header.forEach((h, i) => { obj[h] = cols[i] })
        return obj
      })
      console.log("CSV Rows:", rows)
      
      const toAdd = rows.map((r) => ({
        name: r.name || "Unnamed",
        gamer_tag: r.gamer_tag || r.gamertag || "",
        console: (r.console || "PS5").toUpperCase(),
        preferred_club: r.preferred_club || "",
        location: r.location || "",
        active: String(r.status || "active").toLowerCase() !== "inactive",
      })).filter(p => p.name && p.name !== "Unnamed") // Filter out rows without names
      console.log("Players to add:", toAdd)
      
      const results = await Promise.allSettled(toAdd.map(async (p) => {
        const response = await fetch("/api/admin/players", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({
            action: "add",
            name: p.name,
            username: p.gamer_tag || null,
            psn_name: p.gamer_tag || null,
            console: p.console,
            preferred_club: p.preferred_club,
            location: p.location,
            status: p.active ? "approved" : "pending"
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Unknown error')
        }
        
        return result
      }))
      
      console.log("Import results:", results)
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success)).length
      
      if (successful > 0) {
        console.log(`Successfully imported ${successful} players`)
        toast.success(`Successfully imported ${successful} players`)
      }
      if (failed > 0) {
        console.error(`Failed to import ${failed} players`)
        const failedResults = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
        console.error("Failed results:", failedResults)
        toast.error(`Failed to import ${failed} players. Check console for details.`)
      }
      
      await load()
    } catch (error) {
      console.error("Error importing CSV:", error)
      toast.error("Error importing CSV. Please check the format and try again.")
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csv = [
      ["name","gamer_tag","console","preferred_club","location","status"].join(","),
      ["Alex","alex99","PS5","Arsenal","London","active"].join(","),
    ].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a"); a.href = url; a.download = "players_template.csv"; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#080A08] text-white">
      <div className="mx-auto flex w-full max-w-[1500px] gap-5 px-4 py-5 lg:px-6">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-72 shrink-0 rounded-lg border border-[#243026] bg-[#0E120F] p-4 lg:block">
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Roster control</div>
            <div className="mt-2 text-xl font-extrabold">Players</div>
            <div className="mt-1 text-xs text-[#8A9A8D]">Approvals, clubs, and imports</div>
          </div>
          <nav className="space-y-1" aria-label="Admin navigation">
              {[
                { key: "overview", label: "Overview", icon: Trophy },
                { key: "players", label: "Players", icon: Users },
                { key: "fixtures", label: "Fixtures", icon: CalendarDays },
                { key: "tournaments", label: "Tournaments", icon: Trophy },
                { key: "stats", label: "Stats", icon: ShieldCheck },
                { key: "reports", label: "Reports", icon: AlertTriangle },
                { key: "messaging", label: "Messaging", icon: CheckCircle2 },
                { key: "settings", label: "Settings", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon
                const isActive = item.key === "players" || ((item.key === "fixtures" || item.key === "tournaments") && (pathname || "").startsWith(`/admin/${item.key}`))
                return (
                  <button
                    key={item.key}
                    onClick={() => (item.key === "fixtures" ? router.push("/admin/fixtures") : item.key === "tournaments" ? router.push("/admin/tournaments") : item.key === "players" ? router.push("/admin/players") : router.push("/admin"))}
                    className={`flex h-11 w-full items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
                      isActive ? "border-[#D6F66A] bg-[#D6F66A] text-[#10130D]" : "border-transparent text-[#DDE8D8] hover:border-[#273529] hover:bg-[#151B16]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 space-y-5">
            <header className="rounded-lg border border-[#243026] bg-[#0E120F] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Roster operations</div>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-4xl">Players</h1>
                <p className="mt-1 text-sm text-[#A7B2A2]">Approve registrations, import rosters, and keep tournament eligibility clean.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminOverlayNav />
                <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
                <Button variant="outline" onClick={async () => { 
                  try {
                    const response = await fetch("/api/admin/players", { 
                      method: "POST", 
                      headers: { "Content-Type": "application/json" }, 
                      body: JSON.stringify({ action: "cleanup_deactivated_fixtures" }) 
                    })
                    const result = await response.json()
                    if (result.success) {
                      toast.success(result.message)
                    } else {
                      toast.error(result.error || "Cleanup failed")
                    }
                  } catch (error) {
                    console.error("Error cleaning up fixtures:", error)
                    toast.error("Failed to cleanup fixtures")
                  }
                }}>Cleanup Deactivated Fixtures</Button>
                <Button variant="outline" onClick={async () => { setConfirmClear(true) }}>Clear Players</Button>
              </div>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <RosterMetric icon={Users} label="Total" value={players.length} detail="All players" />
              <RosterMetric icon={CheckCircle2} label="Approved" value={activeCount} detail="Can play" />
              <RosterMetric icon={AlertTriangle} label="Pending" value={pendingCount} detail="Need approval" warning={pendingCount > 0} />
              <RosterMetric icon={Trash2} label="Rejected" value={rejectedCount} detail="Declined" warning={rejectedCount > 0} />
            </div>

            <AddForm onAdded={onAdded} />

            <div className="rounded-lg border border-[#243026] bg-[#0E120F] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm font-semibold">Import Players {importing && "(Importing...)"}</div>
                <Button variant="outline" onClick={downloadTemplate} disabled={importing}><Download className="h-4 w-4" /> CSV template</Button>
              </div>
              <div>
                <input type="file" accept=".csv" disabled={importing} onChange={async (e) => { const input = e.currentTarget; const f = input.files?.[0]; if (f) await importCsv(f); input.value = "" }} />
              </div>
              <div>
                <Label className="text-sm">Or paste CSV rows</Label>
                <textarea 
                  className="mt-1 w-full h-28 bg-transparent border rounded p-2 text-sm" 
                  placeholder="name,gamer_tag,console,preferred_club,location,status\nAlex,alex99,PS5,Arsenal,London,active" 
                  disabled={importing}
                  onBlur={async (e) => { const ta = e.currentTarget; const v = ta.value.trim(); if (v) { await importFromText(v); ta.value = "" } }} 
                />
              </div>
            </div>

            <div className="rounded-lg border border-[#243026] bg-[#0E120F] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Next steps</div>
                <div className="text-xs text-[#9E9E9E]">Active players: {activeCount}. {activeCount < 6 ? "Need at least 6." : activeCount % 2 !== 0 ? "Even number required (no BYE)." : "Ready to create a tournament."}</div>
              </div>
              <Button variant="outline" onClick={() => router.push("/admin/tournaments") } disabled={!canCreateTournament}>Create Tournament</Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#A7B2A2]">Showing {filtered.length} of {players.length} players</div>
              <div className="text-xs text-[#8A9A8D]">Approving a pending player confirms their email and sends the approval notice.</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-[#243026] bg-[#0E120F] px-3 py-2 w-full sm:w-[360px]">
                <Search className="h-4 w-4 text-[#8A9A8D]" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/email/club" className="h-7 border-0 focus-visible:ring-0 p-0 bg-transparent w-full" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[170px] border-[#243026] bg-[#0E120F]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#243026] bg-[#0E120F]">
              <table className="w-full text-sm min-w-[1040px]">
                <thead className="text-[#9E9E9E]">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Gamer Tag</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Club</th>
                    <th className="text-left px-3 py-2">Console</th>
                    <th className="text-left px-3 py-2">Location</th>
                    <th className="text-left px-3 py-2">Connection</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-[#1E1E1E]">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2">{p.username || p.psn_name || "—"}</td>
                      <td className="px-3 py-2">{p.email || "—"}</td>
                      <td className="px-3 py-2">{p.preferred_club || "—"}</td>
                      <td className="px-3 py-2">{p.console}</td>
                      <td className="px-3 py-2">{p.location || "—"}</td>
                      <td className="px-3 py-2">
                        {p.download_mbps != null || p.upload_mbps != null ? (
                          <span className="whitespace-nowrap text-xs">
                            ↓ {p.download_mbps ?? "—"} / ↑ {p.upload_mbps ?? "—"} Mbps
                            {p.speed_test_screenshot_url ? (
                              <a
                                href={p.speed_test_screenshot_url}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 text-emerald-400 underline"
                              >
                                shot
                              </a>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-[#6C6C6C]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2"><RosterStatusPill status={p.status} /></td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex flex-wrap gap-1 sm:gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEdit(p)} className="text-xs sm:text-sm">Edit</Button>
                          <Button size="sm" variant="outline" onClick={async () => { 
                            try {
                              await updatePlayerStatus(p, String(p.status) === "approved" ? "pending" : "approved")
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Failed to update player status")
                            }
                          }} className="text-xs sm:text-sm">{String(p.status) === "approved" ? "Move Pending" : "Approve"}</Button>
                          <Button size="sm" variant="outline" disabled={String(p.status || "").toLowerCase() === "rejected"} className="text-amber-300 border-amber-900 hover:bg-amber-900/20 text-xs sm:text-sm" onClick={async () => {
                            try {
                              await updatePlayerStatus(p, "rejected")
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Failed to reject player")
                            }
                          }}>Reject</Button>
                          <Button size="sm" variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20 text-xs sm:text-sm" onClick={async () => { setConfirmDeleteId(p.id) }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td className="px-3 py-4 text-sm text-[#9E9E9E]" colSpan={9}>No players.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <EditDialog player={edit} onClose={() => setEdit(null)} onSaved={load} />
          </main>
      </div>
      <PlayersConfirmDialogs
        confirmClear={confirmClear}
        setConfirmClear={setConfirmClear}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        onCleared={async () => { await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear" }) }); load() }}
        onDeleted={async () => {
          if (confirmDeleteId) {
            const target = players.find((x: any) => String(x.id) === String(confirmDeleteId))
            await fetch("/api/admin/players", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "delete",
                id: confirmDeleteId,
                name: target?.name,
                username: target?.username || target?.psn_name || null,
                psn_name: target?.psn_name || target?.username || null,
              })
            })
            load()
          }
        }}
      />
    </div>
  )
}

function RosterMetric({ icon: Icon, label, value, detail, warning = false }: { icon: LucideIcon; label: string; value: number; detail: string; warning?: boolean }) {
  return (
    <div className={`min-h-[108px] rounded-lg border p-4 ${warning ? "border-amber-500/25 bg-amber-500/[0.06]" : "border-[#243026] bg-[#0E120F]"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A9A8D]">{label}</div>
        <Icon className={warning ? "h-4 w-4 text-amber-300" : "h-4 w-4 text-[#D6F66A]"} />
      </div>
      <div className="mt-4 text-2xl font-extrabold tabular-nums text-white">{value}</div>
      <div className="mt-1 text-xs text-[#A7B2A2]">{detail}</div>
    </div>
  )
}

function RosterStatusPill({ status }: { status: string | null | undefined }) {
  const normalized = String(status || "pending").toLowerCase()
  const classes = normalized === "approved"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : normalized === "rejected"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-200"

  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-bold uppercase tracking-[0.12em] ${classes}`}>
      {normalized}
    </span>
  )
}

function AddForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("")
  const [gamerTag, setGamerTag] = useState("")
  const [consoleType, setConsoleType] = useState("PS5")
  const [club, setClub] = useState("")
  const [location, setLocation] = useState("")
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/admin/players", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({
          action: "add",
          name: name,
          username: gamerTag || null,
          psn_name: gamerTag || null,
          console: consoleType,
          preferred_club: club,
          location: location,
          status: active ? "approved" : "pending"
        }) 
      })
      
      if (!response.ok) {
        throw new Error(`Failed to add player: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        toast.success("Player added successfully")
        setName(""); setGamerTag(""); setClub(""); setLocation(""); setActive(true)
        onAdded()
      } else {
        throw new Error(result.error || "Failed to add player")
      }
    } catch (error) {
      console.error("Error adding player:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add player")
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="rounded-lg border border-[#243026] bg-[#0E120F] p-4">
      <div className="mb-4">
        <div className="text-sm font-semibold">Add Player</div>
        <div className="mt-1 text-xs text-[#8A9A8D]">Manual adds are useful for seeded league rosters and late replacements.</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
        <div className="sm:col-span-2 lg:col-span-1">
          <Label className="text-sm">Name (required)</Label>
          <Input className="mt-1 bg-transparent" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Label className="text-sm">Gamer Tag</Label>
          <Input className="mt-1 bg-transparent" value={gamerTag} onChange={(e) => setGamerTag(e.target.value)} placeholder="PSN/Xbox handle" />
        </div>
        <div>
          <Label className="text-sm">Console</Label>
          <Select value={consoleType} onValueChange={setConsoleType}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PS5">PS5</SelectItem>
              <SelectItem value="XBOX">Xbox</SelectItem>
              <SelectItem value="PC">PC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Club</Label>
          <Input className="mt-1 bg-transparent" value={club} onChange={(e) => setClub(e.target.value)} placeholder="Arsenal" />
        </div>
        <div>
          <Label className="text-sm">Location</Label>
          <Input className="mt-1 bg-transparent" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
        </div>
        <div>
          <Label className="text-sm">Active</Label>
          <div className="mt-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active</label></div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={submit} disabled={loading}>{loading ? "Adding…" : "Add Player"}</Button>
      </div>
    </div>
  )
}

function EditDialog({ player, onClose, onSaved }: { player: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => { 
    if (player) {
      setForm({
        ...player,
        gamer_tag: player.username || player.psn_name || "",
        active: String(player.status) === "approved",
      })
    }
  }, [player])
  
  if (!player) return null

  const save = async () => {
    if (!form?.name?.trim()) {
      toast.error("Name is required")
      return
    }
    
    setSaving(true)
    try {
      const patch = { 
        name: form.name, 
        psn_name: form.gamer_tag, 
        console: form.console, 
        preferred_club: form.preferred_club, 
        location: form.location, 
        status: form.active ? "approved" : "pending" 
      }
      const response = await fetch("/api/admin/players", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "update", id: form.id, ...patch }) 
      })
      const result = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        throw new Error(result?.error || `Failed to update player: ${response.statusText}`)
      }
      
      if (result.success) {
        toast.success(result.emailSent ? "Player updated and confirmation email sent." : "Player updated successfully")
        onSaved()
        onClose()
      } else {
        throw new Error(result.error || "Failed to update player")
      }
    } catch (error) {
      console.error("Error updating player:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update player")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!player} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl border-[#243026] bg-[#0E120F] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            <Label className="text-sm">Name</Label>
            <Input className="mt-1 bg-transparent" value={form?.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Label className="text-sm">Gamer Tag</Label>
            <Input className="mt-1 bg-transparent" value={form?.gamer_tag || ""} onChange={(e) => setForm({ ...form, gamer_tag: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">Console</Label>
            <Select value={form?.console || "PS5"} onValueChange={(v) => setForm({ ...form, console: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PS5">PS5</SelectItem>
                <SelectItem value="XBOX">Xbox</SelectItem>
                <SelectItem value="PC">PC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Club</Label>
            <Input className="mt-1 bg-transparent" value={form?.preferred_club || ""} onChange={(e) => setForm({ ...form, preferred_club: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">Location</Label>
            <Input className="mt-1 bg-transparent" value={form?.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">Active</Label>
            <div className="mt-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form?.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Confirm dialogs
function PlayersConfirmDialogs({ confirmClear, setConfirmClear, confirmDeleteId, setConfirmDeleteId, onCleared, onDeleted }: { confirmClear: boolean; setConfirmClear: (v: boolean) => void; confirmDeleteId: string | null; setConfirmDeleteId: (v: string | null) => void; onCleared: () => void; onDeleted: () => void }) {
  return (
    <>
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="sm:max-w-md border-[#243026] bg-[#0E120F] text-white">
          <DialogHeader>
            <DialogTitle>Clear all players?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={async () => { onCleared(); setConfirmClear(false) }}>Clear</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!confirmDeleteId} onOpenChange={(o) => setConfirmDeleteId(o ? (confirmDeleteId || "") : null)}>
        <DialogContent className="sm:max-w-md border-[#243026] bg-[#0E120F] text-white">
          <DialogHeader>
            <DialogTitle>Delete player?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={async () => { onDeleted(); setConfirmDeleteId(null) }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
