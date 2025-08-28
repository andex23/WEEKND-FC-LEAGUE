"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter, usePathname } from "next/navigation"
import { AdminOverlayNav } from "@/components/admin/overlay-nav"

const LS_KEY = "admin_players"

function getLocalPlayers(): any[] {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function setLocalPlayers(rows: any[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(rows)) } catch {}
}
function mergePlayers(a: any[], b: any[]) {
  const byId = new Map<string, any>()
  ;[...a, ...b].forEach((p) => {
    const key = String(p.id || `${(p.name || "").toLowerCase()}-${(p.gamer_tag || "").toLowerCase()}`)
    byId.set(key, { ...byId.get(key), ...p })
  })
  return Array.from(byId.values())
}

export default function AdminPlayersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [players, setPlayers] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [edit, setEdit] = useState<any | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = async () => {
    try {
      const api = await fetch("/api/admin/players").then((x) => x.json()).catch(() => ({ players: [] }))
      const local = getLocalPlayers()
      setPlayers(mergePlayers(local, api.players || []))
    } catch {
      setPlayers(getLocalPlayers())
    }
  }
  useEffect(() => { load() }, [])

  const activeCount = useMemo(() => players.filter((p) => !!p.active).length, [players])
  const canCreateTournament = activeCount >= 6 && activeCount % 2 === 0

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return players
    return players.filter((p) => [p.name, p.gamer_tag, p.preferred_club, p.console, p.location].some((v) => String(v || "").toLowerCase().includes(query)))
  }, [players, q])

  const onAdded = () => load()

  const importCsv = async (file: File) => {
    const text = await file.text()
    await importFromText(text)
  }

  const importFromText = async (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return
    const header = lines[0].split(",").map((h) => h.replaceAll('"','').trim().toLowerCase())
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.replaceAll('"','').trim())
      const obj: any = {}
      header.forEach((h, i) => { obj[h] = cols[i] })
      return obj
    })
    const local = getLocalPlayers()
    const toAdd = rows.map((r) => ({
      id: r.id || (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      name: r.name || "Unnamed",
      gamer_tag: r.gamer_tag || r.gamertag || "",
      console: (r.console || "PS5").toUpperCase(),
      preferred_club: r.preferred_club || "",
      location: r.location || "",
      active: String(r.status || "active").toLowerCase() !== "inactive",
      created_at: new Date().toISOString(),
    }))
    setLocalPlayers(mergePlayers(local, toAdd))
    Promise.all(toAdd.map((p) => fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", ...p }) }).catch(() => {})))
      .finally(load)
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
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad">
        <div className="mb-3">
          <Button onClick={() => router.push("/admin")}>← Back to Admin</Button>
        </div>
        <div className="flex gap-6 lg:gap-8">
          <aside className="hidden md:block w-64 shrink-0">
            <nav className="space-y-1">
              {[
                { key: "overview", label: "Overview" },
                { key: "players", label: "Players" },
                { key: "fixtures", label: "Fixtures" },
                { key: "tournaments", label: "Tournaments" },
                { key: "stats", label: "Stats" },
                { key: "reports", label: "Reports" },
                { key: "messaging", label: "Messaging" },
                { key: "settings", label: "Settings" },
              ].map((item) => {
                const isActive = item.key === "players" || ((item.key === "fixtures" || item.key === "tournaments") && (pathname || "").startsWith(`/admin/${item.key}`))
                return (
                  <button
                    key={item.key}
                    onClick={() => (item.key === "fixtures" ? router.push("/admin/fixtures") : item.key === "tournaments" ? router.push("/admin/tournaments") : item.key === "players" ? router.push("/admin/players") : router.push("/admin"))}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm border ${
                      isActive ? "bg-[#141414] border-[#1E1E1E]" : "bg-transparent hover:bg-[#141414] border-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <section className="flex-1 space-y-6 min-w-0">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold">Players</h1>
                <p className="text-sm text-[#9E9E9E]">Add and manage players for tournaments</p>
              </div>
              <div className="flex items-center gap-2">
                <AdminOverlayNav />
                <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
                <Button variant="outline" onClick={async () => { await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seed6" }) }); const api = await fetch("/api/admin/players").then((x) => x.json()).catch(() => ({ players: [] })); setLocalPlayers(api.players || []); load() }}>Seed 6 demo players</Button>
                <Button variant="outline" onClick={async () => { setConfirmClear(true) }}>Clear Players</Button>
              </div>
            </header>

            <AddForm onAdded={onAdded} />

            <div className="rounded-2xl border p-4 bg-[#141414] space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Import Players</div>
                <Button variant="outline" onClick={downloadTemplate}>Download CSV template</Button>
              </div>
              <div>
                <input type="file" accept=".csv" onChange={async (e) => { const input = e.currentTarget; const f = input.files?.[0]; if (f) await importCsv(f); input.value = "" }} />
              </div>
              <div>
                <Label className="text-sm">Or paste CSV rows</Label>
                <textarea className="mt-1 w-full h-28 bg-transparent border rounded p-2 text-sm" placeholder="name,gamer_tag,console,preferred_club,location,status\nAlex,alex99,PS5,Arsenal,London,active" onBlur={async (e) => { const ta = e.currentTarget; const v = ta.value.trim(); if (v) { await importFromText(v); ta.value = "" } }} />
              </div>
            </div>

            <div className="rounded-2xl border p-4 bg-[#141414] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Next steps</div>
                <div className="text-xs text-[#9E9E9E]">Active players: {activeCount}. {activeCount < 6 ? "Need at least 6." : activeCount % 2 !== 0 ? "Even number required (no BYE)." : "Ready to create a tournament."}</div>
              </div>
              <Button variant="outline" onClick={() => router.push("/admin/tournaments") } disabled={!canCreateTournament}>Create Tournament</Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded border bg-[#141414] text-xs">Active: <span className="font-semibold">{activeCount}</span></div>
              <div className="px-3 py-1 rounded border bg-[#141414] text-xs">Total: <span className="font-semibold">{players.length}</span></div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-[#141414] w-full md:w-auto">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/gamer tag/club" className="h-7 border-0 focus-visible:ring-0 p-0 bg-transparent w-full" />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="text-[#9E9E9E]">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Gamer Tag</th>
                    <th className="text-left px-3 py-2">Club</th>
                    <th className="text-left px-3 py-2">Console</th>
                    <th className="text-left px-3 py-2">Location</th>
                    <th className="text-left px-3 py-2">Active</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-[#1E1E1E]">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2">{p.gamer_tag || "—"}</td>
                      <td className="px-3 py-2">{p.preferred_club || "—"}</td>
                      <td className="px-3 py-2">{p.console}</td>
                      <td className="px-3 py-2">{p.location || "—"}</td>
                      <td className="px-3 py-2">{p.active ? "Yes" : "No"}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEdit(p)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={async () => { const patch = { active: !p.active }; const locals = getLocalPlayers().map((x) => x.id === p.id ? { ...x, ...patch } : x); setLocalPlayers(locals); await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id: p.id, patch }) }); load() }}>{p.active ? "Deactivate" : "Activate"}</Button>
                          <Button size="sm" variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={async () => { setConfirmDeleteId(p.id) }}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td className="px-3 py-4 text-sm text-[#9E9E9E]" colSpan={7}>No players.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <EditDialog player={edit} onClose={() => setEdit(null)} onSaved={load} />
          </section>
        </div>
      </div>
      <PlayersConfirmDialogs
        confirmClear={confirmClear}
        setConfirmClear={setConfirmClear}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        onCleared={async () => { setLocalPlayers([]); await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear" }) }); load() }}
        onDeleted={async () => { if (confirmDeleteId) { const locals = getLocalPlayers().filter((x) => x.id !== confirmDeleteId); setLocalPlayers(locals); await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: confirmDeleteId }) }); load() } }}
      />
    </div>
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
    if (!name.trim()) return
    setLoading(true)
    const payload = { id: crypto?.randomUUID?.() || Math.random().toString(36).slice(2), name, gamer_tag: gamerTag, console: consoleType, preferred_club: club, location, active, created_at: new Date().toISOString() }
    try {
      const locals = getLocalPlayers()
      setLocalPlayers(mergePlayers(locals, [payload]))
      await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", ...payload }) })
      setName(""); setGamerTag(""); setClub(""); setLocation(""); setActive(true)
      onAdded()
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl border p-4 bg-[#141414]">
      <div className="text-sm font-semibold mb-2">Add Player</div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <Label className="text-sm">Name (required)</Label>
          <Input className="mt-1 bg-transparent" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
        </div>
        <div>
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
      <div className="flex justify-end mt-3">
        <Button onClick={submit} disabled={loading}>{loading ? "Adding…" : "Add Player"}</Button>
      </div>
    </div>
  )
}

function EditDialog({ player, onClose, onSaved }: { player: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(player)
  useEffect(() => { setForm(player) }, [player])
  if (!player) return null

  const save = async () => {
    const patch = { name: form.name, gamer_tag: form.gamer_tag, console: form.console, preferred_club: form.preferred_club, location: form.location, active: !!form.active }
    const locals = getLocalPlayers().map((x) => x.id === form.id ? { ...x, ...patch } : x)
    setLocalPlayers(locals)
    await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id: form.id, patch }) })
    onSaved(); onClose()
  }

  return (
    <Dialog open={!!player} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl bg-[#141414] text-white border">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div>
            <Label className="text-sm">Name</Label>
            <Input className="mt-1 bg-transparent" value={form?.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
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
        <div className="flex justify-end mt-3">
          <Button onClick={save}>Save</Button>
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
        <DialogContent className="sm:max-w-md bg-[#141414] text-white border">
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
        <DialogContent className="sm:max-w-md bg-[#141414] text-white border">
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
