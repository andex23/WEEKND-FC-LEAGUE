"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AdminOverlayNav } from "@/components/admin/overlay-nav"

interface Player { id: string; name: string; gamer_tag?: string; preferred_club?: string }
interface Row { id: string; season: string; matchday: number; homeId: string; awayId: string; homeScore: number | null; awayScore: number | null; status: string }

export default function AdminStatsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [fixtures, setFixtures] = useState<Row[]>([])
  const [mdFilter, setMdFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTournamentId, setActiveTournamentId] = useState<string>("")
  const [activeTournamentName, setActiveTournamentName] = useState<string>("")
  const tournamentId = activeTournamentId

  // New: editable tables
  const [tableStandings, setTableStandings] = useState<any[]>([])
  const [leadersScorers, setLeadersScorers] = useState<any[]>([])
  const [leadersAssists, setLeadersAssists] = useState<any[]>([])
  const [leadersDiscipline, setLeadersDiscipline] = useState<any[]>([])
  const [scorersEditMode, setScorersEditMode] = useState(false)

  const load = async () => {
    const s = await fetch("/api/admin/settings").then((r) => r.json()).catch(() => ({}))
    setSettings(s)
    const playersRes = await fetch("/api/admin/players").then((r) => r.json()).catch(() => ({ players: [] }))
    setPlayers(playersRes.players || [])
    
    // Get active tournament directly from tournaments API
    let tournamentId = s?.tournament?.active_tournament_id
    let tournamentName = ""
    if (!tournamentId) {
      try {
        const tournamentsRes = await fetch("/api/admin/tournaments").then((r) => r.json()).catch(() => ({ tournaments: [] }))
        const activeTournament = tournamentsRes.tournaments?.find((t: any) => t.status === "ACTIVE")
        tournamentId = activeTournament?.id
        tournamentName = activeTournament?.name || ""
        console.log("Stats page: Found active tournament:", tournamentId, tournamentName)
      } catch (e) {
        console.error("Error fetching active tournament:", e)
      }
    } else {
      // If we have tournamentId from settings, get the name
      try {
        const tournamentsRes = await fetch("/api/admin/tournaments").then((r) => r.json()).catch(() => ({ tournaments: [] }))
        const tournament = tournamentsRes.tournaments?.find((t: any) => t.id === tournamentId)
        tournamentName = tournament?.name || ""
      } catch (e) {
        console.error("Error fetching tournament name:", e)
      }
    }
    setActiveTournamentId(tournamentId || "")
    setActiveTournamentName(tournamentName)
    console.log("Stats page: Using tournament ID:", tournamentId, "Name:", tournamentName)
    
    let fxRows: Row[] = []
    if (tournamentId) {
      const qs = `?tournamentId=${encodeURIComponent(String(tournamentId))}`
      const fx = await fetch(`/api/fixtures${qs}`).then((r) => r.json()).catch(() => ({ fixtures: [] }))
      fxRows = (fx.fixtures || []).map((f: any) => ({ id: String(f.id), season: f.season || "", matchday: Number(f.matchday || 1), homeId: String(f.homePlayer || f.homeId), awayId: String(f.awayPlayer || f.awayId), homeScore: f.homeScore ?? null, awayScore: f.awayScore ?? null, status: String(f.status || "SCHEDULED") }))
      setFixtures(fxRows)
      console.log("Stats page: Loaded", fxRows.length, "fixtures")
      try {
        const st = await fetch(`/api/standings${qs}`).then((r) => r.json())
        const mapped = (st.standings || []).map((r: any) => ({ id: String(r.playerId), name: r.playerName, team: r.team || "-", P: r.played || 0, W: r.won || 0, D: r.drawn || 0, L: r.lost || 0, GF: r.goalsFor || 0, GA: r.goalsAgainst || 0, GD: r.goalDifference || 0, Pts: r.points || 0 }))
        setTableStandings(mapped)
      } catch { setTableStandings([]) }
      // Leaders from API
      try {
        const leaders = await fetch(`/api/player-stats${qs}`).then((r) => r.json())
        console.log("Stats page: Leaders data:", leaders)
        
        // Map top scorers from API response
        const topScorersData = (leaders.topScorers || []).map((r: any, index: number) => ({
          id: String(r.player_id || r.id || `scorer-${index}`),
          name: r.name || r.player_name || "Unknown",
          team: r.team || "-",
          G: r.goals || 0
        }))
        setLeadersScorers(topScorersData)
        
        // Map top assists from API response
        const topAssistsData = (leaders.topAssists || []).map((r: any, index: number) => ({
          id: String(r.player_id || r.id || `assist-${index}`),
          name: r.name || r.player_name || "Unknown",
          team: r.team || "-",
          A: r.assists || 0
        }))
        setLeadersAssists(topAssistsData)
        
        // Map discipline from API response
        const disciplineData = (leaders.discipline || []).map((r: any, index: number) => ({
          id: String(r.player_id || r.id || `discipline-${index}`),
          name: r.name || r.player_name || "Unknown",
          team: r.team || "-",
          YC: r.yellow_cards || 0,
          RC: r.red_cards || 0
        }))
        setLeadersDiscipline(disciplineData)
        
        console.log("Stats page: Mapped scorers:", topScorersData.length, "assists:", topAssistsData.length, "discipline:", disciplineData.length)
      } catch (e) {
        console.error("Error loading leaders:", e)
        setLeadersScorers([]); setLeadersAssists([]); setLeadersDiscipline([])
      }
    } else {
      setFixtures([])
      setTableStandings([])
      setLeadersScorers([])
      setLeadersAssists([])
    }

    // Prepopulate leaders with all players if empty
    if (leadersScorers.length === 0 && (playersRes.players || []).length) {
      setLeadersScorers((playersRes.players || []).map((p: any) => ({ id: String(p.id), name: p.name, team: p.preferred_club || "-", G: 0 })))
    }
    if (leadersAssists.length === 0 && (playersRes.players || []).length) {
      setLeadersAssists((playersRes.players || []).map((p: any) => ({ id: String(p.id), name: p.name, team: p.preferred_club || "-", A: 0 })))
    }
    if (leadersDiscipline.length === 0 && (playersRes.players || []).length) {
      setLeadersDiscipline((playersRes.players || []).map((p: any) => ({ id: String(p.id), name: p.name, team: p.preferred_club || "-", YC: 0, RC: 0 })))
    }
  }

  useEffect(() => { load() }, [])

  const byId = useMemo(() => new Map(players.map((p) => [String(p.id), p])), [players])
  const filtered = useMemo(() => fixtures.filter((f) => (mdFilter === "all" || String(f.matchday) === mdFilter) && (statusFilter === "all" || String(f.status) === statusFilter)), [fixtures, mdFilter, statusFilter])

  const saveFixture = async (row: Row) => {
    try {
      await fetch("/api/fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, tournamentId, season: row.season, matchday: row.matchday, homeId: row.homeId, awayId: row.awayId, homeScore: row.homeScore, awayScore: row.awayScore, status: row.status }) })
      if (tournamentId) {
        await refreshFromTournament()
      }
      toast.success("Saved")
    } catch { toast.error("Failed to save") }
  }

  const overrideNumber = async (table: string, id: string, field: string, val: number) => {
    const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "override", table, id, field, value: val }) })
    if (!res.ok) toast.error("Failed to update")
  }
  const updateMeta = async (table: string, id: string, patch: { name?: string; team?: string }) => {
    const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_meta", table, id, ...patch }) })
    if (!res.ok) toast.error("Failed to update")
  }
  const addRow = async (table: string, name: string, team?: string) => {
    // If no name provided, add a new empty row locally first
    if (!name) {
      const newId = `new-${table}-${Date.now()}`
      const newRow = {
        id: newId,
        name: "",
        team: team || "",
        ...(table === "scorers" ? { G: 0 } : {}),
        ...(table === "assists" ? { A: 0 } : {}),
        ...(table === "discipline" ? { YC: 0, RC: 0 } : {})
      }
      
      if (table === "scorers") {
        setLeadersScorers(prev => [...prev, newRow])
      } else if (table === "assists") {
        setLeadersAssists(prev => [...prev, newRow])
      } else if (table === "discipline") {
        setLeadersDiscipline(prev => [...prev, newRow])
      }
      return
    }
    
    // If name is provided, save to server
    const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_row", table, name, team }) })
    if (!res.ok) toast.error("Failed to add")
    else toast.success("Added")
    load()
  }
  const deleteRow = async (table: string, id: string) => {
    const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_row", table, id }) })
    if (!res.ok) toast.error("Failed to delete")
    else toast.success("Deleted")
    load()
  }

  const addPlayerFromList = (table: string, playerId: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return
    
    const newId = `new-${table}-${Date.now()}`
    const newRow = {
      id: newId,
      name: player.name,
      team: player.preferred_club || "-",
      ...(table === "scorers" ? { G: 0 } : {}),
      ...(table === "assists" ? { A: 0 } : {}),
      ...(table === "discipline" ? { YC: 0, RC: 0 } : {})
    }
    
    if (table === "scorers") {
      setLeadersScorers(prev => [...prev, newRow])
    } else if (table === "assists") {
      setLeadersAssists(prev => [...prev, newRow])
    } else if (table === "discipline") {
      setLeadersDiscipline(prev => [...prev, newRow])
    }
  }

  const refreshFromTournament = async () => {
    if (!tournamentId) return
    const qs = `?tournamentId=${encodeURIComponent(String(tournamentId))}`
    const fx = await fetch(`/api/fixtures${qs}`).then((r) => r.json()).catch(() => ({ fixtures: [] }))
    const fxRows: Row[] = (fx.fixtures || []).map((f: any) => ({ id: String(f.id), season: f.season || "", matchday: Number(f.matchday || 1), homeId: String(f.homePlayer || f.homeId), awayId: String(f.awayPlayer || f.awayId), homeScore: f.homeScore ?? null, awayScore: f.awayScore ?? null, status: String(f.status || "SCHEDULED") }))
    setFixtures(fxRows)
    const st = await fetch(`/api/standings${qs}`).then((r) => r.json()).catch(() => ({ standings: [] }))
    const mapped = (st.standings || []).map((r: any) => ({ id: String(r.playerId), name: r.playerName, team: r.team || "-", P: r.played || 0, W: r.won || 0, D: r.drawn || 0, L: r.lost || 0, GF: r.goalsFor || 0, GA: r.goalsAgainst || 0, GD: r.goalDifference || 0, Pts: r.points || 0 }))
    setTableStandings(mapped)

    // Re-fetch leaders
    const leaders = await fetch(`/api/player-stats${qs}`).then((r) => r.json()).catch(() => ({}))
    setLeadersScorers((leaders.topScorers || []).map((r: any) => ({ id: String(r.id || r.player_id || Math.random()), name: r.name, team: r.team || "-", G: r.goals || r.G || 0 })))
    setLeadersAssists((leaders.topAssists || []).map((r: any) => ({ id: String(r.id || r.player_id || Math.random()), name: r.name, team: r.team || "-", A: r.assists || r.A || 0 })))
    setLeadersDiscipline((leaders.discipline || []).map((r: any) => ({ id: String(r.id || r.player_id || Math.random()), name: r.name, team: r.team || "-", YC: r.yellow_cards || r.YC || 0, RC: r.red_cards || r.RC || 0 })))
  }

  const publishStandings = async () => {
    await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "recompute" }) }).catch(() => null)
    await fetch("/api/standings").catch(() => null)
    await refreshFromTournament()
    toast.success("Standings published")
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push("/admin")}>← Back to Admin</Button>
          <div className="flex items-center gap-2">
            <AdminOverlayNav />
            <Button variant="outline" onClick={load}>🔄 Refresh Data</Button>
            <div className="text-right">
              <div className="text-xs text-[#9E9E9E]">Active Tournament</div>
              <div className="text-sm">{activeTournamentName || (tournamentId ? "Tournament Active" : "No Active Tournament")}</div>
            </div>
          </div>
        </div>

        {!tournamentId && (
          <div className="rounded-2xl border p-3 bg-[#141414] text-sm">No active tournament. Activate a tournament first.</div>
        )}

        {tournamentId && (
          <div className="rounded-2xl border overflow-hidden bg-[#141414]">
            <div className="px-4 py-2 border-b border-[#1E1E1E] flex items-center gap-3">
              <div className="text-sm">Season: <span className="font-semibold">{fixtures[0]?.season || settings?.tournament?.season || "—"}</span></div>
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#9E9E9E]">Matchday</span>
                  <Select value={mdFilter} onValueChange={setMdFilter}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {Array.from({ length: 38 }).map((_, i) => (<SelectItem key={i+1} value={String(i + 1)}>{i + 1}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#9E9E9E]">Status</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="PLAYED">Played</SelectItem>
                      <SelectItem value="FORFEIT">Forfeit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#1E1E1E]">
              {filtered.map((r) => {
                const h = byId.get(r.homeId)
                const a = byId.get(r.awayId)
                return (
                  <div key={r.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-1"><span className="px-2 py-0.5 text-xs rounded border bg-[#141414] border-[#1E1E1E]">MD {r.matchday}</span></div>
                    <div className="md:col-span-3 min-w-0">
                      <div className="font-medium truncate">{h?.name || r.homeId}</div>
                      <div className="text-xs text-[#9E9E9E] truncate">{h?.gamer_tag || ""}{h?.preferred_club ? ` · ${h.preferred_club}` : ""}</div>
                    </div>
                    <div className="md:col-span-1"><Input type="number" min="0" value={r.homeScore ?? ""} onChange={(e) => setFixtures((prev) => prev.map((x) => x.id === r.id ? { ...x, homeScore: e.target.value === "" ? null : Number(e.target.value) } : x))} className="bg-transparent h-8 text-right w-full max-w-[64px]" /></div>
                    <div className="md:col-span-1 text-center text-[#9E9E9E]">vs</div>
                    <div className="md:col-span-1"><Input type="number" min="0" value={r.awayScore ?? ""} onChange={(e) => setFixtures((prev) => prev.map((x) => x.id === r.id ? { ...x, awayScore: e.target.value === "" ? null : Number(e.target.value) } : x))} className="bg-transparent h-8 text-right w-full max-w-[64px]" /></div>
                    <div className="md:col-span-3 min-w-0">
                      <div className="font-medium truncate">{a?.name || r.awayId}</div>
                      <div className="text-xs text-[#9E9E9E] truncate">{a?.gamer_tag || ""}{a?.preferred_club ? ` · ${a.preferred_club}` : ""}</div>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-2 flex-wrap">
                      <div className="min-w-[10rem]">
                        <Select value={r.status} onValueChange={(v) => setFixtures((prev) => prev.map((x) => x.id === r.id ? { ...x, status: v } : x))}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="PLAYED">Played</SelectItem>
                            <SelectItem value="FORFEIT">Forfeit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" onClick={() => saveFixture(r)}>Save</Button>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="p-4 text-sm text-[#9E9E9E]">No fixtures match the current filters.</div>
              )}
            </div>
          </div>
        )}

        {/* Editable League Table */}
        <div className="rounded-2xl border bg-[#141414] overflow-hidden">
          <div className="px-4 py-2 border-b border-[#1E1E1E] flex items-center justify-between">
            <div className="text-sm font-semibold">League Table (manual overrides)</div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={refreshFromTournament}>Refresh Table</Button>
              <Button size="sm" variant="outline" onClick={() => addRow("standings", "", "")}>Add Row</Button>
              <Button size="sm" onClick={publishStandings}>Save & Publish</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[#9E9E9E]">
                <tr>
                  <th className="text-left px-3 py-2 w-64">Player</th>
                  <th className="text-left px-3 py-2 w-56">Team</th>
                  {"P W D L GF GA GD Pts".split(" ").map((h) => (<th key={h} className="text-right px-3 py-2 w-16">{h}</th>))}
                  <th className="text-right px-3 py-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableStandings.map((r) => (
                  <tr key={r.id} className="border-t border-[#1E1E1E]">
                    <td className="px-3 py-2"><Input className="bg-transparent h-8 w-full" value={r.name} onChange={(e) => setTableStandings((prev) => prev.map((x) => x.id === r.id ? { ...x, name: e.target.value } : x))} onBlur={() => updateMeta("standings", r.id, { name: r.name })} /></td>
                    <td className="px-3 py-2"><Input className="bg-transparent h-8 w-full" value={r.team} onChange={(e) => setTableStandings((prev) => prev.map((x) => x.id === r.id ? { ...x, team: e.target.value } : x))} onBlur={() => updateMeta("standings", r.id, { team: r.team })} /></td>
                    {["P","W","D","L","GF","GA","GD","Pts"].map((f) => (
                      <td key={f} className="px-3 py-2 text-right">
                        <Input className="bg-transparent h-8 text-right w-16" type="number" value={r[f] ?? 0} onChange={(e) => setTableStandings((prev) => prev.map((x) => x.id === r.id ? { ...x, [f]: e.target.value === "" ? 0 : Number(e.target.value) } : x))} onBlur={() => overrideNumber("standings", r.id, f, Number(r[f] ?? 0))} />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={() => deleteRow("standings", r.id)}>Delete</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaders */}
        <div className="rounded-2xl border p-3 bg-[#141414] text-sm text-[#9E9E9E] mb-4">
          💡 <strong>Manual Stats Management:</strong> Top Scorers are automatically calculated from fixture data (click "Edit Mode" to manually override). Top Assists and Discipline can be manually managed. Use the "Add Player" dropdown to select from existing players, or "Add Empty" to create a new entry. All changes are saved when you click "Save".
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <LeadersCard title="Top Scorers (Auto)" table="scorers" fieldLabel="G" rows={leadersScorers} setRows={setLeadersScorers} addRow={addRow} deleteRow={deleteRow} overrideNumber={overrideNumber} updateMeta={updateMeta} onSave={publishStandings} addPlayerFromList={addPlayerFromList} players={players} readOnly={!scorersEditMode} editMode={scorersEditMode} setEditMode={setScorersEditMode} />
          <LeadersCard title="Top Assists" table="assists" fieldLabel="A" rows={leadersAssists} setRows={setLeadersAssists} addRow={addRow} deleteRow={deleteRow} overrideNumber={overrideNumber} updateMeta={updateMeta} onSave={publishStandings} addPlayerFromList={addPlayerFromList} players={players} />
          <LeadersCard title="Discipline" table="discipline" fieldLabel="YC/RC" rows={leadersDiscipline} setRows={setLeadersDiscipline} addRow={addRow} deleteRow={deleteRow} overrideNumber={overrideNumber} updateMeta={updateMeta} isDiscipline onSave={publishStandings} addPlayerFromList={addPlayerFromList} players={players} />
        </div>
      </div>
    </div>
  )
}

function LeadersCard({ title, table, fieldLabel, rows, setRows, addRow, deleteRow, overrideNumber, updateMeta, isDiscipline, onSave, addPlayerFromList, players, readOnly = false, editMode = false, setEditMode }: { title: string; table: string; fieldLabel: string; rows: any[]; setRows: (v: any[]) => void; addRow: (t: string, n: string, tm?: string) => void; deleteRow: (t: string, id: string) => void; overrideNumber: (t: string, id: string, f: string, v: number) => void; updateMeta: (t: string, id: string, patch: { name?: string; team?: string }) => void; isDiscipline?: boolean; onSave: () => void; addPlayerFromList: (table: string, playerId: string) => void; players: any[]; readOnly?: boolean; editMode?: boolean; setEditMode?: (mode: boolean) => void }) {
  return (
    <div className="rounded-2xl border bg-[#141414] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1E1E1E] flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          {setEditMode && (
            <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
              {editMode ? "View Only" : "Edit Mode"}
            </Button>
          )}
          {!readOnly && (
            <>
              <Select onValueChange={(value) => addPlayerFromList(table, value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Add Player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({player.preferred_club || "No Team"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => addRow(table, "", "")}>Add Empty</Button>
            </>
          )}
          <Button size="sm" onClick={onSave}>Save</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[#9E9E9E]">
            <tr>
              <th className="text-left px-3 py-2 w-64">Player</th>
              <th className="text-left px-3 py-2 w-56">Team</th>
              <th className="text-right px-3 py-2 w-20">{fieldLabel}</th>
              <th className="text-right px-3 py-2 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#1E1E1E]">
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="text-sm">{r.name || ""}</span>
                  ) : (
                    <Input className="bg-transparent h-8 w-full" value={r.name || ""} onChange={(e) => setRows(rows.map((x) => x.id === r.id ? { ...x, name: e.target.value } : x))} onBlur={() => updateMeta(table, r.id, { name: r.name })} placeholder="Player" />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="text-sm">{r.team || ""}</span>
                  ) : (
                    <Input className="bg-transparent h-8 w-full" value={r.team || ""} onChange={(e) => setRows(rows.map((x) => x.id === r.id ? { ...x, team: e.target.value } : x))} onBlur={() => updateMeta(table, r.id, { team: r.team })} placeholder="Team" />
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {isDiscipline ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-[#9E9E9E]">YC</span>
                      {readOnly ? (
                        <span className="text-sm w-16 text-right">{r.YC ?? 0}</span>
                      ) : (
                        <Input className="bg-transparent h-8 w-16 text-right" type="number" value={r.YC ?? 0} onChange={(e) => setRows(rows.map((x) => x.id === r.id ? { ...x, YC: e.target.value === "" ? 0 : Number(e.target.value) } : x))} onBlur={() => overrideNumber(table, r.id, "YC", Number(r.YC ?? 0))} />
                      )}
                      <span className="text-xs text-[#9E9E9E]">RC</span>
                      {readOnly ? (
                        <span className="text-sm w-16 text-right">{r.RC ?? 0}</span>
                      ) : (
                        <Input className="bg-transparent h-8 w-16 text-right" type="number" value={r.RC ?? 0} onChange={(e) => setRows(rows.map((x) => x.id === r.id ? { ...x, RC: e.target.value === "" ? 0 : Number(e.target.value) } : x))} onBlur={() => overrideNumber(table, r.id, "RC", Number(r.RC ?? 0))} />
                      )}
                    </div>
                  ) : (
                    readOnly ? (
                      <span className="text-sm w-16 text-right inline-block">{(table === "scorers" ? r.G : r.A) ?? 0}</span>
                    ) : (
                      <Input className="bg-transparent h-8 w-16 text-right inline-block" type="number" value={(table === "scorers" ? r.G : r.A) ?? 0} onChange={(e) => setRows(rows.map((x) => x.id === r.id ? { ...x, ...(table === "scorers" ? { G: e.target.value === "" ? 0 : Number(e.target.value) } : { A: e.target.value === "" ? 0 : Number(e.target.value) }) } : x))} onBlur={() => overrideNumber(table, r.id, table === "scorers" ? "G" : "A", Number(table === "scorers" ? (r.G ?? 0) : (r.A ?? 0)))} />
                    )
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {!readOnly && (
                    <Button size="sm" variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={() => deleteRow(table, r.id)}>Delete</Button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-3 py-3 text-sm text-[#9E9E9E]" colSpan={4}>No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
