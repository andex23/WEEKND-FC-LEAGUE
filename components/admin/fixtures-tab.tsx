"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Plus, RefreshCw, Wand2, Upload, Download, Filter, Trash2, ArrowLeftRight, Lock, Unlock, CalendarClock } from "lucide-react"

// Status values and row type

type FixtureStatus = "SCHEDULED" | "LIVE" | "PLAYED" | "FORFEIT" | "POSTPONED"

interface FixtureRow {
  id: string
  matchday: number
  homePlayer: string
  awayPlayer: string
  homeTeam?: string
  awayTeam?: string
  homeScore: number | null
  awayScore: number | null
  status: FixtureStatus
  weekendLabel?: string
  note?: string
  is_locked?: boolean
  kickoff_at?: string
  played_at?: string
}

const newId = () => Math.random().toString(36).slice(2, 10)
const statusClass = (s: FixtureStatus) =>
  s === "PLAYED"
    ? "bg-green-100 text-green-800 border-green-200"
    : s === "FORFEIT"
    ? "bg-red-100 text-red-800 border-red-200"
    : s === "LIVE"
    ? "bg-amber-100 text-amber-800 border-amber-200"
    : s === "POSTPONED"
    ? "bg-gray-100 text-gray-800 border-gray-200"
    : "bg-blue-100 text-blue-800 border-blue-200"

// Admin result modal
function ResultModal({ fixture, onApprove }: { fixture: FixtureRow; onApprove: (hs: number, as: number) => void }) {
  const [home, setHome] = useState<string>(fixture.homeScore?.toString() ?? "")
  const [away, setAway] = useState<string>(fixture.awayScore?.toString() ?? "")
  const [open, setOpen] = useState(false)
  const canSubmit = home !== "" && away !== "" && Number(home) >= 0 && Number(away) >= 0
  const submit = async () => {
    if (!canSubmit) return
    try {
      await fetch("/api/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId: fixture.id, homeScore: Number(home), awayScore: Number(away) }) })
      await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "recompute" }) })
    } catch {}
    onApprove(Number(home), Number(away))
    setOpen(false)
  }
  const cta = fixture.status === "LIVE" ? "End & Enter" : fixture.status === "SCHEDULED" || fixture.status === "POSTPONED" ? "Enter Result" : "Edit Result"
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={fixture.status === "PLAYED" ? "outline" : "default"}>{cta}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Result Entry</DialogTitle>
          <DialogDescription>Matchday {fixture.matchday}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 tabular-nums">
          <Input type="number" className="w-20 text-right" min="0" value={home} onChange={(e) => setHome(e.target.value)} />
          <span>-</span>
          <Input type="number" className="w-20 text-right" min="0" value={away} onChange={(e) => setAway(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={submit} disabled={!canSubmit}>Approve</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FixturesTab() {
  const [loading, setLoading] = useState(true)
  const [fixtures, setFixtures] = useState<FixtureRow[]>([])
  const [filterMatchday, setFilterMatchday] = useState<string>("all")
  const [filterLabel, setFilterLabel] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"live" | "upcoming" | "finished">("upcoming")

  const [openAdd, setOpenAdd] = useState(false)
  const [addForm, setAddForm] = useState({ matchday: 1, homePlayer: "", awayPlayer: "", weekendLabel: "", note: "", kickoff_at: "" })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Tournament awareness
  const [tournamentActive, setTournamentActive] = useState(false)
  const [tournamentStatus, setTournamentStatus] = useState<"DRAFT" | "ACTIVE" | "COMPLETE">("DRAFT")

  useEffect(() => {
    ;(async () => {
      try {
        const cfg = await fetch("/api/tournament/config").then((r) => r.json())
        const isActive = Boolean(cfg?.config?.basics?.is_active)
        setTournamentActive(isActive)
        setTournamentStatus((cfg?.config?.basics?.status as any) || "DRAFT")
        if (isActive) {
          const res = await fetch("/api/fixtures")
          const data = await res.json()
          const rows: FixtureRow[] = (data.fixtures || []).map((f: any) => ({
            id: f.id,
            matchday: f.matchday,
            homePlayer: f.homePlayer || f.home_team || "Home",
            awayPlayer: f.awayPlayer || f.away_team || "Away",
            homeScore: f.homeScore ?? null,
            awayScore: f.awayScore ?? null,
            status: (f.status || "SCHEDULED").toUpperCase() as FixtureStatus,
            weekendLabel: f.weekendLabel || "",
            note: f.note || "",
            is_locked: Boolean(f.is_locked),
            kickoff_at: f.kickoff_at || f.scheduledDate || undefined,
            played_at: f.played_at || undefined,
          }))
          setFixtures(rows)
        }
      } catch {
        setFixtures([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const readOnly = tournamentStatus === "COMPLETE"
  const goSetup = () => (window.location.href = "/admin/setup")

  const generate = async (rounds: 1 | 2) => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/generate-fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rounds }) })
      if (res.ok) {
        const data = await res.json()
        const built: FixtureRow[] = (data.fixtures || []).map((x: any) => ({
          id: newId(),
          matchday: x.matchday,
          homePlayer: x.home?.name || x.home || "Home",
          awayPlayer: x.away?.name || x.away || "Away",
          homeTeam: x.homeTeam,
          awayTeam: x.awayTeam,
          homeScore: null,
          awayScore: null,
          status: "SCHEDULED",
          weekendLabel: x.weekendLabel || "",
          note: "",
          is_locked: false,
          kickoff_at: new Date().toISOString(),
        }))
        setFixtures(built)
      }
    } finally {
      setLoading(false)
    }
  }

  const saveFixture = (id: string) => !readOnly && setFixtures((prev) => prev.map((f) => (f.id === id ? { ...f } : f)))
  const swapTeams = (id: string) => !readOnly && setFixtures((prev) => prev.map((f) => (f.id === id ? { ...f, homePlayer: f.awayPlayer, awayPlayer: f.homePlayer, homeTeam: f.awayTeam, awayTeam: f.homeTeam } : f)))
  const toggleLock = (id: string) => !readOnly && setFixtures((prev) => prev.map((f) => (f.id === id ? { ...f, is_locked: !f.is_locked } : f)))
  const removeFixture = (id: string, status: FixtureStatus) => { if (readOnly || status === "PLAYED" || status === "LIVE") return; setFixtures((prev) => prev.filter((f) => f.id !== id)) }

  const approveResult = (id: string, hs: number, as: number) => {
    setFixtures((prev) => prev.map((f) => (f.id === id ? { ...f, homeScore: hs, awayScore: as, status: "PLAYED", played_at: new Date().toISOString() } : f)))
  }

  // Filters and segments
  const matchdayOptions = useMemo(() => Array.from(new Set(fixtures.map((f) => f.matchday))).sort((a, b) => a - b), [fixtures])
  const byTab = (fx: FixtureRow[]) => {
    if (tab === "live") return fx.filter((f) => f.status === "LIVE")
    if (tab === "upcoming") return fx.filter((f) => f.status === "SCHEDULED" || f.status === "POSTPONED")
    return fx.filter((f) => f.status === "PLAYED" || f.status === "FORFEIT")
  }
  const filtered = useMemo(() => {
    let list = byTab(fixtures)
    if (filterMatchday !== "all") list = list.filter((f) => String(f.matchday) === filterMatchday)
    if (filterLabel !== "all") list = list.filter((f) => (f.weekendLabel || "").toLowerCase() === filterLabel.toLowerCase())
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter((f) => [f.homePlayer, f.awayPlayer, f.homeTeam, f.awayTeam, f.weekendLabel, f.note].some((v) => (v || "").toLowerCase().includes(s)))
    }
    const map = new Map<number, FixtureRow[]>()
    for (const f of list) {
      if (!map.has(f.matchday)) map.set(f.matchday, [])
      map.get(f.matchday)!.push(f)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [fixtures, tab, filterMatchday, filterLabel, search])

  // Empty and loading states
  if (loading) return <div className="p-12 text-center text-gray-500">Loading fixtures…</div>
  if (!tournamentActive) return (
    <div className="border rounded-md p-8 text-center text-gray-600">
      <div className="mb-2 text-lg font-semibold">No tournaments yet</div>
      <div className="mb-4 text-sm">Create a tournament to begin scheduling fixtures.</div>
      <Button className="bg-primary hover:bg-primary/90" onClick={goSetup}>Create Tournament</Button>
    </div>
  )
  if (fixtures.length === 0) return (
    <div className="border rounded-md p-8 text-center text-gray-600">
      <div className="mb-2 text-lg font-semibold">No fixtures yet</div>
      <div className="mb-4 text-sm">Generate fixtures or adjust tournament settings.</div>
      <div className="flex items-center justify-center gap-2">
        <Button className="bg-primary hover:bg-primary/90" onClick={() => generate(2)}>Generate Fixtures</Button>
        <Button variant="outline" onClick={goSetup}>Open Tournament Setup</Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Fixtures</CardTitle>
              <CardDescription>Live, upcoming and finished matches</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={goSetup}>Tournament Setup</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => generate(2)} disabled={tournamentStatus === "COMPLETE"}><RefreshCw className="h-4 w-4 mr-2" /> Generate Fixtures</Button>
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={tournamentStatus === "COMPLETE"}><Plus className="h-4 w-4 mr-2" /> Add Fixture</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader><DialogTitle>Add Fixture</DialogTitle><DialogDescription>Manual single fixture</DialogDescription></DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="text-sm">Matchday</label><Input type="number" value={addForm.matchday} onChange={(e) => setAddForm({ ...addForm, matchday: Number(e.target.value || 1) })} className="mt-1" /></div>
                    <div><label className="text-sm">Weekend label</label><Input value={addForm.weekendLabel} onChange={(e) => setAddForm({ ...addForm, weekendLabel: e.target.value })} className="mt-1" /></div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className="text-sm">Home (player / team)</label><Input value={addForm.homePlayer} onChange={(e) => setAddForm({ ...addForm, homePlayer: e.target.value })} className="mt-1" /></div>
                      <div><label className="text-sm">Away (player / team)</label><Input value={addForm.awayPlayer} onChange={(e) => setAddForm({ ...addForm, awayPlayer: e.target.value })} className="mt-1" /></div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className="text-sm">Kickoff</label><Input type="datetime-local" value={addForm.kickoff_at} onChange={(e) => setAddForm({ ...addForm, kickoff_at: e.target.value })} className="mt-1" /></div>
                      <div><label className="text-sm">Note</label><Input value={addForm.note} onChange={(e) => setAddForm({ ...addForm, note: e.target.value })} className="mt-1" /></div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => { if (tournamentStatus !== "COMPLETE") { setFixtures((prev) => [...prev, { id: newId(), matchday: addForm.matchday, homePlayer: addForm.homePlayer, awayPlayer: addForm.awayPlayer, homeScore: null, awayScore: null, status: "SCHEDULED", weekendLabel: addForm.weekendLabel || undefined, note: addForm.note || undefined, is_locked: false, kickoff_at: addForm.kickoff_at }]); setOpenAdd(false) } }} className="bg-primary hover:bg-primary/90" disabled={tournamentStatus === "COMPLETE"}>Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="finished">Finished</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 flex-wrap mt-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search team/player" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
              <Select value={filterMatchday} onValueChange={setFilterMatchday}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Matchday" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matchdays</SelectItem>
                  {matchdayOptions.map((md) => (<SelectItem key={md} value={String(md)}>Matchday {md}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterLabel} onValueChange={setFilterLabel}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Weekend label" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labels</SelectItem>
                  {Array.from(new Set(fixtures.map((f) => f.weekendLabel).filter(Boolean) as string[])).map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="live" className="mt-4 space-y-6">
              {filtered.length === 0 ? (<div className="border rounded-md p-6 text-center text-gray-600">No live matches</div>) : (
                filtered.map(([md, rows]) => (
                  <div key={md} className="border rounded-md">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                      <div className="flex items-center gap-3"><Badge variant="outline">Matchday {md}</Badge></div>
                      <div className="text-xs text-gray-500">{rows.length} fixtures</div>
                    </div>
                    <div className="divide-y">
                      {rows.map((f) => (
                        <div key={f.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-1"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${statusClass(f.status)}`}>{f.status}</span></div>
                          <div className="md:col-span-3"><div className="font-medium">{f.homePlayer}</div>{f.homeTeam && <div className="text-xs text-gray-500">{f.homeTeam}</div>}</div>
                          <div className="md:col-span-2 text-xs text-gray-600 flex items-center gap-2"><CalendarClock className="h-4 w-4" />{f.kickoff_at ? new Date(f.kickoff_at).toLocaleString() : "—"}</div>
                          <div className="md:col-span-3"><div className="font-medium">{f.awayPlayer}</div>{f.awayTeam && <div className="text-xs text-gray-500">{f.awayTeam}</div>}</div>
                          <div className="md:col-span-3 flex items-center justify-end gap-2">
                            <ResultModal fixture={f} onApprove={(hs, as) => approveResult(f.id, hs, as)} />
                            <Button size="sm" variant="outline" onClick={() => toggleLock(f.id)} disabled={readOnly}>{f.is_locked ? (<><Unlock className="h-4 w-4 mr-1" /> Unlock</>) : (<><Lock className="h-4 w-4 mr-1" /> Lock</>)}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-4 space-y-6">
              {filtered.length === 0 ? (<div className="border rounded-md p-6 text-center text-gray-600">No upcoming matches</div>) : (
                filtered.map(([md, rows]) => (
                  <div key={md} className="border rounded-md">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                      <div className="flex items-center gap-3"><Badge variant="outline">Matchday {md}</Badge></div>
                      <div className="text-xs text-gray-500">{rows.length} fixtures</div>
                    </div>
                    <div className="divide-y">
                      {rows.map((f) => (
                        <div key={f.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-1"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${statusClass(f.status)}`}>{f.status}</span></div>
                          <div className="md:col-span-3"><div className="font-medium">{f.homePlayer}</div>{f.homeTeam && <div className="text-xs text-gray-500">{f.homeTeam}</div>}</div>
                          <div className="md:col-span-2 text-xs text-gray-600 flex items-center gap-2"><CalendarClock className="h-4 w-4" />{f.kickoff_at ? new Date(f.kickoff_at).toLocaleString() : "—"}</div>
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-center gap-2 tabular-nums">
                              <Input type="number" min="0" max="20" className="w-16 text-right" value={f.homeScore ?? ""} onChange={(e) => setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, homeScore: e.target.value === "" ? null : Number(e.target.value) } : x)))} disabled={f.is_locked || readOnly} />
                              <span>-</span>
                              <Input type="number" min="0" max="20" className="w-16 text-right" value={f.awayScore ?? ""} onChange={(e) => setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, awayScore: e.target.value === "" ? null : Number(e.target.value) } : x)))} disabled={f.is_locked || readOnly} />
                            </div>
                          </div>
                          <div className="md:col-span-2"><div className="font-medium">{f.awayPlayer}</div>{f.awayTeam && <div className="text-xs text-gray-500">{f.awayTeam}</div>}</div>
                          <div className="md:col-span-2 flex items-center justify-end gap-2">
                            <ResultModal fixture={f} onApprove={(hs, as) => approveResult(f.id, hs, as)} />
                            <Button size="sm" variant="outline" onClick={() => swapTeams(f.id)} disabled={readOnly}><ArrowLeftRight className="h-4 w-4 mr-1" /> Swap</Button>
                            <Button size="sm" variant="outline" onClick={() => toggleLock(f.id)} disabled={readOnly}>{f.is_locked ? (<><Unlock className="h-4 w-4 mr-1" /> Unlock</>) : (<><Lock className="h-4 w-4 mr-1" /> Lock</>)}</Button>
                            <Button size="sm" variant="outline" onClick={() => removeFixture(f.id, f.status)} disabled={readOnly}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="finished" className="mt-4 space-y-6">
              {filtered.length === 0 ? (<div className="border rounded-md p-6 text-center text-gray-600">No finished matches</div>) : (
                filtered.map(([md, rows]) => (
                  <div key={md} className="border rounded-md">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                      <div className="flex items-center gap-3"><Badge variant="outline">Matchday {md}</Badge></div>
                      <div className="text-xs text-gray-500">{rows.length} fixtures</div>
                    </div>
                    <div className="divide-y">
                      {rows.map((f) => (
                        <div key={f.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-1"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${statusClass(f.status)}`}>{f.status}</span></div>
                          <div className="md:col-span-3"><div className="font-medium">{f.homePlayer}</div>{f.homeTeam && <div className="text-xs text-gray-500">{f.homeTeam}</div>}</div>
                          <div className="md:col-span-2 text-xs text-gray-600 flex items-center gap-2"><CalendarClock className="h-4 w-4" />{f.played_at ? new Date(f.played_at).toLocaleString() : "—"}</div>
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-center gap-2 tabular-nums">
                              <Input type="number" min="0" max="20" className="w-16 text-right" value={f.homeScore ?? ""} onChange={(e) => setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, homeScore: e.target.value === "" ? null : Number(e.target.value) } : x)))} disabled={readOnly} />
                              <span>-</span>
                              <Input type="number" min="0" max="20" className="w-16 text-right" value={f.awayScore ?? ""} onChange={(e) => setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, awayScore: e.target.value === "" ? null : Number(e.target.value) } : x)))} disabled={readOnly} />
                            </div>
                          </div>
                          <div className="md:col-span-2"><div className="font-medium">{f.awayPlayer}</div>{f.awayTeam && <div className="text-xs text-gray-500">{f.awayTeam}</div>}</div>
                          <div className="md:col-span-2 flex items-center justify-end gap-2">
                            <ResultModal fixture={f} onApprove={(hs, as) => approveResult(f.id, hs, as)} />
                            <Button size="sm" onClick={() => saveFixture(f.id)} disabled={readOnly}><Save className="h-4 w-4 mr-1" /> Save</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
