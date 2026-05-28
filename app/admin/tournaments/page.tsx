"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AdminOverlayNav } from "@/components/admin/overlay-nav"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { downloadCSVFromObjects } from "@/lib/utils/csv"

// Local storage removed; persistence is via Supabase only.

type EntrySummary = {
  invited: number
  accepted: number
  declined: number
  total: number
}

const emptySummary: EntrySummary = { invited: 0, accepted: 0, declined: 0, total: 0 }

function tournamentType(t: any) {
  return String(t?.config?.type || t?.type || "DOUBLE").toUpperCase()
}

function tournamentPlayerCount(t: any) {
  return Number(t?.config?.players ?? t?.players ?? 0)
}

export default function AdminTournamentsPage() {
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [entryRows, setEntryRows] = useState<any[]>([])
  const [name, setName] = useState("")
  const [status, setStatus] = useState("DRAFT")
  const [season, setSeason] = useState("")
  const [type, setType] = useState("DOUBLE")
  const [players, setPlayers] = useState(0)
  const [rules, setRules] = useState("")
  const [overrideCount, setOverrideCount] = useState(false)
  const [activeCount, setActiveCount] = useState(0)
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({})
  const [confirmState, setConfirmState] = useState<{ type: "delete" | "regenerate" | null; id?: string; item?: any } | null>(null)

  const bumpRefresh = (id: string) => setRefreshKeys((m) => ({ ...m, [id]: Date.now() }))
  const load = async () => {
    const [tournamentsResult, entriesResult] = await Promise.all([
      fetch("/api/admin/tournaments").then((x) => x.json()).catch(() => ({ tournaments: [] })),
      fetch("/api/admin/tournament-entries").then((x) => x.json()).catch(() => ({ entries: [] })),
    ])
    setList(tournamentsResult.tournaments || [])
    setEntryRows(entriesResult.entries || [])
  }

  const entryStatsByTournament = useMemo(() => {
    const map = new Map<string, EntrySummary>()
    for (const entry of entryRows) {
      const tournamentId = String(entry.tournament_id)
      const summary = map.get(tournamentId) || { ...emptySummary }
      const status = String(entry.status || "invited").toLowerCase()
      summary.total += 1
      if (status === "accepted") summary.accepted += 1
      else if (status === "declined") summary.declined += 1
      else summary.invited += 1
      map.set(tournamentId, summary)
    }
    return map
  }, [entryRows])

  // Fetch active players from Supabase and compute active count
  async function fetchActivePlayers() {
    try {
      const api = await fetch("/api/admin/players").then((r) => r.json()).catch(() => ({ players: [] }))
      const act = (api.players || []).filter((p: any) => String(p.status) === "approved")
      setActiveCount(act.length)
      if (!overrideCount) setPlayers(act.length)
    } catch {}
  }
  useEffect(() => {
    load()
    ;(async () => { await fetchActivePlayers() })()
  }, [overrideCount])

  // Use effective player count even before async load completes
  const effectivePlayers = overrideCount ? players : (players || activeCount)

  const validEven = true // allow odd counts; BYE will be added automatically
  const validMin = effectivePlayers >= 1 // Allow any number of players
  // Dates required: both provided and end >= start
  const validDates = Boolean(startAt) && Boolean(endAt)
  const validRange = validDates ? new Date(endAt) >= new Date(startAt) : false
  const canCreate = name.trim().length > 0 && validEven && validMin && validDates && validRange

  const create = async () => {
    if (!canCreate) {
      let msg = !validMin
        ? "Need at least 1 player"
        : !validDates
        ? "Select start and end dates"
        : !validRange
        ? "End date must be after start date"
        : "Enter a league name"
      toast.error(msg)
      return
    }
    
    try {
      const res = await fetch("/api/admin/tournaments", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          action: "create", 
          name, 
          status, 
          season, 
          type, 
          players: effectivePlayers, 
          rules, 
          start_at: startAt || null, 
          end_at: endAt || null,
          is_active: status === "ACTIVE"
        }) 
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error || "Failed to create tournament")
        return
      }
      
      const data = await res.json().catch(() => null)
      toast.success(`Tournament created successfully!`)
      setName(""); setSeason(""); setRules(""); setStartAt(""); setEndAt("")
      load()
    } catch (error) {
      console.error("Error creating tournament:", error)
      toast.error("Failed to create tournament")
    }
  }
  const remove = async (id: string) => { setConfirmState({ type: "delete", id }) }
  const activate = async (t: any) => {
    await fetch("/api/admin/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "activate", id: t.id }) })
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ section:"tournament", data: { name: t.name, status: "ACTIVE", active_tournament_id: t.id, season: t.season || "", format: t.type, matchdays: ["Sat","Sun"], match_length: 8 } }) })
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ section:"branding", data: { league_name: t.name } }) })
    toast.success("Tournament activated")
    await load()
  }
  const openSettings = (t: any) => { router.push(`/admin/tournaments/${t.id}`) }
  const deactivateGlobal = async (t: any) => {
    await fetch("/api/admin/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deactivate", id: t.id }) })
    toast.success("Tournament deactivated")
    await load()
  }
  const inviteAll = async (t: any) => {
    const res = await fetch("/api/admin/tournament-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite_all_approved", tournamentId: t.id }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data?.error || "Failed to send invitations")
      return
    }
    toast.success(`Invitations ready for ${data?.summary?.total ?? 0} approved players`)
    await load()
  }
  const generateNow = async (t: any) => {
    const rounds = tournamentType(t) === "SINGLE" ? 1 : 2
    const res = await fetch("/api/admin/generate-fixtures", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ rounds, tournamentId: t.id, season: t.season || "2024/25" }) })
    if (!res.ok) { 
      const e = await res.json().catch(() => ({})); 
      toast.error(e?.message || e?.error || "Failed to generate fixtures");
      return 
    }
    const data = await res.json().catch(() => null)
    toast.success(`Fixtures generated: ${data?.totalFixtures ?? data?.count ?? "90"} fixtures`)
    await load()
    bumpRefresh(t.id)
  }
  const regenerate = async (t: any) => { setConfirmState({ type: "regenerate", item: t }) }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad">
        <div className="mb-3 flex items-center gap-2"><AdminOverlayNav /><Button onClick={() => router.push("/admin")}>← Back to Admin</Button></div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-extrabold">Tournaments</h1>
            <p className="text-sm text-[#9E9E9E]">Create and view tournaments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="space-y-4">
              {list.length === 0 ? (
                <div className="rounded-2xl border p-4 bg-[#141414] text-sm text-[#9E9E9E]">No tournaments yet</div>
              ) : list.map((t) => (
                <div key={t.id} className="rounded-2xl border bg-[#141414] overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-[#1E1E1E]">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-[#9E9E9E]">{t.season || "—"} · {t.status} · {tournamentType(t)} · {tournamentPlayerCount(t)} player pool</div>
                      {(t.start_at || t.end_at) && <div className="text-xs text-[#9E9E9E]">{t.start_at ? new Date(t.start_at).toLocaleDateString() : ""} {t.end_at ? `→ ${new Date(t.end_at).toLocaleDateString()}` : ""}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {t.status === "ACTIVE" ? (
                        <Button size="sm" variant="outline" onClick={() => deactivateGlobal(t)}>Deactivate</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => activate(t)}>Activate</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => inviteAll(t)}>Invite Approved</Button>
                      <Button size="sm" variant="outline" onClick={() => generateNow(t)}>Generate Fixtures</Button>
                      <Button size="sm" variant="outline" onClick={() => regenerate(t)}>Regenerate</Button>
                      <Button size="sm" variant="outline" onClick={() => openSettings(t)}>Settings</Button>
                      <Button size="sm" variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={() => remove(t.id)}>Delete</Button>
                    </div>
                  </div>
                  <EntryStrip summary={entryStatsByTournament.get(String(t.id)) || emptySummary} approvedCount={activeCount} />
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
                    <div className="lg:col-span-7">
                      <InlineFixtures tournamentId={t.id} refreshKey={refreshKeys[t.id]} />
                    </div>
                    <div className="lg:col-span-5">
                      <MiniStandings tournamentId={t.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-2xl border p-4 sticky top-4 space-y-3 bg-[#141414]">
              <div className="text-sm font-semibold">New Tournament</div>
              <div>
                <label className="text-sm">League Name</label>
                <Input className="mt-1 bg-transparent" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Approved Player Pool</label>
                <Input className="mt-1 bg-transparent" type="number" value={overrideCount ? players : (activeCount || players)} onChange={(e) => setPlayers(Number(e.target.value || 0))} readOnly={!overrideCount} aria-readonly={!overrideCount} />
                <div className="text-xs text-[#9E9E9E] mt-1">Approved players: {activeCount}. Invitations decide who enters each tournament.</div>
                <div className="mt-1 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={overrideCount} onChange={(e) => setOverrideCount(e.target.checked)} /> Override count</label></div>
              </div>
              <div>
                <label className="text-sm">League Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single Round Robin</SelectItem>
                    <SelectItem value="DOUBLE">Double Round Robin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Rules</label>
                <Input className="mt-1 bg-transparent" placeholder="Link or brief notes" value={rules} onChange={(e) => setRules(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Start date</label>
                  <DatePicker value={startAt} onChange={setStartAt} placeholder="Pick start date" />
                </div>
                <div>
                  <label className="text-sm">End date</label>
                  <DatePicker value={endAt} onChange={setEndAt} placeholder="Pick end date" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={create} disabled={!canCreate}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModals
        state={confirmState}
        onClose={() => setConfirmState(null)}
        onDelete={async (id) => { await fetch("/api/admin/tournaments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"delete", id }) }); toast.success("Deleted"); load() }}
        onRegen={async (t) => { await fetch("/api/fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear_for_tournament", tournamentId: t.id }) }); await generateNow(t); await load() }}
      />
    </div>
  )
}

function EntryStrip({ summary, approvedCount }: { summary: EntrySummary; approvedCount: number }) {
  const available = Math.max(approvedCount - summary.total, 0)
  const items = [
    { label: "Invited", value: summary.invited, tone: "border-amber-500/25 bg-amber-500/[0.08] text-amber-100" },
    { label: "Accepted", value: summary.accepted, tone: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-100" },
    { label: "Declined", value: summary.declined, tone: "border-rose-500/25 bg-rose-500/[0.08] text-rose-100" },
    { label: "Available", value: available, tone: "border-[#243026] bg-[#0B0E0C] text-[#DDE8D8]" },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 border-b border-[#1E1E1E] px-4 py-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={`rounded-md border px-3 py-2 ${item.tone}`}>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{item.label}</div>
          <div className="mt-1 text-lg font-extrabold tabular-nums">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

function InlineFixtures({ tournamentId, refreshKey }: { tournamentId?: string; refreshKey?: number }) {
  const [rows, setRows] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  useEffect(() => {
    ;(async () => {
      try {
        const qs = tournamentId ? `?tournamentId=${encodeURIComponent(String(tournamentId))}` : ""
        const r = await fetch(`/api/fixtures${qs}`).then((x) => x.json())
        setRows(r.fixtures || [])
      } catch {}
      try {
        const p = await fetch("/api/admin/players").then((x) => x.json())
        setPlayers(p.players || [])
      } catch {}
    })()
  }, [tournamentId, refreshKey])
  if (rows.length === 0) return null
  const byId = new Map(players.map((p: any) => [String(p.id), p]))

  const exportCSV = () => {
    const shaped = rows.map((f: any) => {
      const hp: any = byId.get(String(f.homePlayer))
      const ap: any = byId.get(String(f.awayPlayer))
      return {
        id: f.id,
        matchday: f.matchday,
        date: f.kickoff_at || f.scheduledDate || "",
        status: f.status,
        home_name: f.homeName || hp?.name || "",
        home_team: f.homeTeam || hp?.preferred_club || "",
        away_name: f.awayName || ap?.name || "",
        away_team: f.awayTeam || ap?.preferred_club || "",
        home_score: f.homeScore ?? "",
        away_score: f.awayScore ?? "",
      }
    })
    downloadCSVFromObjects("fixtures.csv", shaped)
  }

  return (
    <div className="rounded-2xl border">
      <div className="px-3 py-2 border-b border-[#1E1E1E] text-sm font-semibold flex items-center justify-between">
        <span>Generated Fixtures</span>
        <Button size="sm" variant="outline" onClick={exportCSV}>Export CSV</Button>
      </div>
      <div className="divide-y divide-[#1E1E1E]">
        {rows.map((f) => {
          const hp: any = byId.get(String(f.homePlayer))
          const ap: any = byId.get(String(f.awayPlayer))
          const hName = f.homeName || hp?.name || "—"
          const aName = f.awayName || ap?.name || "—"
          const hTeam = f.homeTeam || hp?.preferred_club || ""
          const aTeam = f.awayTeam || ap?.preferred_club || ""
          return (
            <div key={f.id} className="px-3 py-2 flex items-center justify-between">
              <div className="text-sm">MD{f.matchday} • {hName}{hTeam ? ` (${hTeam})` : ""} vs {aName}{aTeam ? ` (${aTeam})` : ""}</div>
              <a className="text-xs underline" href="/admin/fixtures">Edit</a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniStandings({ tournamentId }: { tournamentId: string }) {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`/api/standings?tournamentId=${encodeURIComponent(String(tournamentId))}`).then((x) => x.json())
        setRows(r.standings || [])
      } catch { setRows([]) }
    })()
  }, [tournamentId])
  return (
    <div className="rounded-2xl border">
      <div className="px-3 py-2 border-b border-[#1E1E1E] text-sm font-semibold">League Table</div>
      <div className="divide-y divide-[#1E1E1E]">
        {rows.length === 0 ? (
          <div className="p-3 text-xs text-[#9E9E9E]">No standings yet.</div>
        ) : rows.map((r: any, i: number) => (
          <div key={r.playerId || i} className="px-3 py-2 text-sm flex items-center justify-between">
            <div>
              <span className="text-[#9E9E9E] mr-2">{i + 1}</span>
              <span className="font-medium">{r.name || r.playerName || r.player_id || "Player"}</span>
            </div>
            <div className="text-xs text-[#9E9E9E]">Pts {r.points ?? 0} · GD {r.goalDifference ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfirmModals({ state, onClose, onDelete, onRegen }: { state: { type: "delete" | "regenerate" | null; id?: string; item?: any } | null; onClose: () => void; onDelete: (id: string) => void; onRegen: (t: any) => void }) {
  if (!state?.type) return null
  return (
    <Dialog open={!!state} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md bg-[#141414] text-white border">
        <DialogHeader>
          <DialogTitle>{state.type === "delete" ? "Delete tournament?" : "Regenerate fixtures?"}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {state.type === "delete" ? (
            <Button className="text-rose-400 border-rose-900 hover:bg-rose-900/20" variant="outline" onClick={() => { if (state.id) onDelete(state.id); onClose() }}>Delete</Button>
          ) : (
            <Button onClick={() => { if (state.item) onRegen(state.item); onClose() }}>Regenerate</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
