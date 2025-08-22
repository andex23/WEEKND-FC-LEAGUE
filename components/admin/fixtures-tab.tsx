"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, Plus, RefreshCw, Wand2, Upload, Download, Filter, Trash2, ArrowLeftRight, Lock, Unlock } from "lucide-react"

// Types
type FixtureStatus = "SCHEDULED" | "PLAYED" | "FORFEIT"

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
  edited_at?: string
  created_by?: string
}

// Utilities
const newId = () => Math.random().toString(36).slice(2, 10)
const statusClass = (s: FixtureStatus) =>
  s === "PLAYED"
    ? "bg-green-100 text-green-800 border-green-200"
    : s === "FORFEIT"
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-blue-100 text-blue-800 border-blue-200"

const initialMock: FixtureRow[] = [
  { id: newId(), matchday: 1, homePlayer: "Arsenal / John", awayPlayer: "Chelsea / Jane", homeScore: null, awayScore: null, status: "SCHEDULED", weekendLabel: "Week 1", note: "", is_locked: false },
  { id: newId(), matchday: 1, homePlayer: "Liverpool / Mike", awayPlayer: "Man City / Sarah", homeScore: 2, awayScore: 1, status: "PLAYED", weekendLabel: "Week 1", note: "", is_locked: true },
  { id: newId(), matchday: 2, homePlayer: "Spurs / Tom", awayPlayer: "West Ham / Jake", homeScore: null, awayScore: null, status: "SCHEDULED", weekendLabel: "Week 2", note: "", is_locked: false },
]

export function FixturesTab() {
  const [loading, setLoading] = useState(false)
  const [fixtures, setFixtures] = useState<FixtureRow[]>(initialMock)
  const [filterMatchday, setFilterMatchday] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterLabel, setFilterLabel] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedMatchdays, setSelectedMatchdays] = useState<Set<number>>(new Set())

  // Manual add dialog state
  const [openAdd, setOpenAdd] = useState(false)
  const [addForm, setAddForm] = useState({ matchday: 1, homePlayer: "", awayPlayer: "", weekendLabel: "", note: "" })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // In real app, fetch fixtures from Supabase here
  }, [])

  const matchdays = useMemo(() => {
    const m = Array.from(new Set(fixtures.map((f) => f.matchday))).sort((a, b) => a - b)
    return m
  }, [fixtures])

  const grouped = useMemo(() => {
    let list = fixtures
    if (filterMatchday !== "all") list = list.filter((f) => String(f.matchday) === filterMatchday)
    if (filterStatus !== "all") list = list.filter((f) => f.status === (filterStatus as FixtureStatus))
    if (filterLabel !== "all") list = list.filter((f) => (f.weekendLabel || "").toLowerCase() === filterLabel.toLowerCase())
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter((f) =>
        [f.homePlayer, f.awayPlayer, f.homeTeam, f.awayTeam, f.weekendLabel, f.note].some((v) =>
          (v || "").toLowerCase().includes(s),
        ),
      )
    }
    const map = new Map<number, FixtureRow[]>()
    for (const f of list) {
      if (!map.has(f.matchday)) map.set(f.matchday, [])
      map.get(f.matchday)!.push(f)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [fixtures, filterMatchday, filterStatus, filterLabel, search])

  const conflictsByMatchday = useMemo(() => {
    const map = new Map<number, Set<string>>()
    for (const f of fixtures) {
      const k = f.matchday
      if (!map.has(k)) map.set(k, new Set())
      const seen = map.get(k)!
      const players = [f.homePlayer, f.awayPlayer]
      for (const p of players) {
        if (seen.has(p)) {
          // conflict marker stored as player name already in set
        }
        seen.add(p)
      }
    }
    return map
  }, [fixtures])

  // Actions
  const generate = async (rounds: 1 | 2) => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/generate-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds }),
      })
      if (res.ok) {
        const data = await res.json()
        // Expecting { fixtures } with matchday numbers
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
        }))
        setFixtures(built)
      }
    } finally {
      setLoading(false)
    }
  }

  const addFixture = () => {
    if (!addForm.homePlayer || !addForm.awayPlayer) return
    if (addForm.homePlayer === addForm.awayPlayer) {
      alert("A player cannot play themselves.")
      return
    }
    const newFx: FixtureRow = {
      id: newId(),
      matchday: addForm.matchday,
      homePlayer: addForm.homePlayer,
      awayPlayer: addForm.awayPlayer,
      homeScore: null,
      awayScore: null,
      status: "SCHEDULED",
      weekendLabel: addForm.weekendLabel || undefined,
      note: addForm.note || undefined,
      is_locked: false,
    }
    setFixtures((prev) => [...prev, newFx])
    setOpenAdd(false)
  }

  const saveFixture = (id: string) => {
    setFixtures((prev) => prev.map((f) => (f.id === id ? { ...f, edited_at: new Date().toISOString() } : f)))
  }

  const swapTeams = (id: string) => {
    setFixtures((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, homePlayer: f.awayPlayer, awayPlayer: f.homePlayer, homeTeam: f.awayTeam, awayTeam: f.homeTeam }
          : f,
      ),
    )
  }

  const toggleLock = (id: string) => {
    setFixtures((prev) => prev.map((f) => (f.id === id ? { ...f, is_locked: !f.is_locked } : f)))
  }

  const removeFixture = (id: string) => setFixtures((prev) => prev.filter((f) => f.id !== id))

  const applyWeekendLabel = (label: string) => {
    if (selected.size === 0) return
    setFixtures((prev) => prev.map((f) => (selected.has(f.id) ? { ...f, weekendLabel: label } : f)))
  }

  const bulkSwap = () => {
    setFixtures((prev) => prev.map((f) => (selected.has(f.id) ? { ...f, homePlayer: f.awayPlayer, awayPlayer: f.homePlayer } : f)))
  }

  const bulkDelete = () => {
    if (!confirm("Delete selected fixtures?")) return
    setFixtures((prev) => prev.filter((f) => !selected.has(f.id)))
    setSelected(new Set())
  }

  const regenerateSelectedMatchdays = async () => {
    if (selectedMatchdays.size === 0) return
    // Remove scheduled in selected matchdays, keep played
    setFixtures((prev) =>
      prev.filter((f) => !(selectedMatchdays.has(f.matchday) && f.status !== "PLAYED")),
    )
    // In a real implementation, call backend to auto-fill missing pairings here
  }

  const exportCsv = () => {
    const headers = [
      "id",
      "matchday",
      "homePlayer",
      "awayPlayer",
      "homeScore",
      "awayScore",
      "status",
      "weekendLabel",
      "note",
      "is_locked",
    ]
    const rows = fixtures.map((f) =>
      [f.id, f.matchday, f.homePlayer, f.awayPlayer, f.homeScore ?? "", f.awayScore ?? "", f.status, f.weekendLabel || "", f.note || "", f.is_locked ? 1 : 0].join(","),
    )
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fixtures.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importCsv = async (file: File) => {
    const text = await file.text()
    const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
    const cols = header.split(",")
    const reqCols = ["matchday", "homePlayer", "awayPlayer"]
    const ok = reqCols.every((c) => cols.includes(c))
    if (!ok) {
      alert("CSV missing required columns: matchday, homePlayer, awayPlayer")
      return
    }
    const mdayIdx = cols.indexOf("matchday")
    const hpIdx = cols.indexOf("homePlayer")
    const apIdx = cols.indexOf("awayPlayer")
    const hsIdx = cols.indexOf("homeScore")
    const asIdx = cols.indexOf("awayScore")
    const stIdx = cols.indexOf("status")
    const wlIdx = cols.indexOf("weekendLabel")
    const noteIdx = cols.indexOf("note")

    const parsed: FixtureRow[] = lines.map((line) => {
      const parts = line.split(",")
      return {
        id: newId(),
        matchday: Number(parts[mdayIdx] || 1),
        homePlayer: parts[hpIdx] || "",
        awayPlayer: parts[apIdx] || "",
        homeScore: parts[hsIdx] ? Number(parts[hsIdx]) : null,
        awayScore: parts[asIdx] ? Number(parts[asIdx]) : null,
        status: (parts[stIdx] as FixtureStatus) || "SCHEDULED",
        weekendLabel: parts[wlIdx] || "",
        note: parts[noteIdx] || "",
        is_locked: false,
      }
    })
    setFixtures((prev) => [...prev, ...parsed])
  }

  // Drag & drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id)
  }
  const onDropOnMatchday = (e: React.DragEvent, matchday: number) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/plain")
    setFixtures((prev) => prev.map((f) => (f.id === id ? { ...f, matchday } : f)))
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectMatchday = (md: number) => {
    setSelectedMatchdays((prev) => {
      const next = new Set(prev)
      if (next.has(md)) next.delete(md)
      else next.add(md)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header tools */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Fixtures</CardTitle>
              <CardDescription>Generate schedules or manage manually</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="bg-primary hover:bg-primary/90" onClick={() => generate(1)}>
                <Wand2 className="h-4 w-4 mr-2" /> Generate (Single Round)
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => generate(2)}>
                <RefreshCw className="h-4 w-4 mr-2" /> Generate (Double Round)
              </Button>
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Fixture
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Fixture</DialogTitle>
                    <DialogDescription>Manual single fixture</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">Matchday</label>
                      <Input
                        type="number"
                        value={addForm.matchday}
                        onChange={(e) => setAddForm({ ...addForm, matchday: Number(e.target.value || 1) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Weekend label</label>
                      <Input value={addForm.weekendLabel} onChange={(e) => setAddForm({ ...addForm, weekendLabel: e.target.value })} className="mt-1" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-sm">Home (player / team)</label>
                      <Input value={addForm.homePlayer} onChange={(e) => setAddForm({ ...addForm, homePlayer: e.target.value })} className="mt-1" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-sm">Away (player / team)</label>
                      <Input value={addForm.awayPlayer} onChange={(e) => setAddForm({ ...addForm, awayPlayer: e.target.value })} className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm">Note</label>
                      <Input value={addForm.note} onChange={(e) => setAddForm({ ...addForm, note: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={addFixture} className="bg-primary hover:bg-primary/90">Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => applyWeekendLabel(prompt("Weekend label", "Week 1") || "")}>Apply Label</Button>
                <Button variant="outline" onClick={bulkSwap}><ArrowLeftRight className="h-4 w-4 mr-2" /> Swap</Button>
                <Button variant="outline" onClick={bulkDelete}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                <Button variant="outline" onClick={regenerateSelectedMatchdays}>Regenerate Selected</Button>
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files && importCsv(e.target.files[0])} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" /> Import CSV</Button>
                <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search team/player" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
            <Select value={filterMatchday} onValueChange={setFilterMatchday}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Matchday" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matchdays</SelectItem>
                {matchdays.map((md) => (
                  <SelectItem key={md} value={String(md)}>Matchday {md}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="PLAYED">Played</SelectItem>
                <SelectItem value="FORFEIT">Forfeit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLabel} onValueChange={setFilterLabel}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Weekend label" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labels</SelectItem>
                {Array.from(new Set(fixtures.map((f) => f.weekendLabel).filter(Boolean) as string[])).map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Generating fixtures...</div>
          ) : grouped.length === 0 ? (
            <div className="p-12 text-center text-gray-500 border rounded-md">No fixtures. Generate or add fixtures to get started.</div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([md, rows]) => (
                <div key={md} className="border rounded-md" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropOnMatchday(e, md)}>
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Matchday {md}</Badge>
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input type="checkbox" checked={selectedMatchdays.has(md)} onChange={() => toggleSelectMatchday(md)} /> Select MD
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">{rows.length} fixtures</div>
                  </div>

                  <div className="divide-y">
                    {rows.map((f) => (
                      <div key={f.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center" draggable onDragStart={(e) => onDragStart(e, f.id)}>
                        <div className="md:col-span-1">
                          <label className="flex items-center gap-2 text-xs text-gray-600">
                            <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleSelect(f.id)} />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${statusClass(f.status)}`}>{f.status}</span>
                          </label>
                        </div>
                        <div className="md:col-span-3">
                          <div className="font-medium">{f.homePlayer}</div>
                          {f.homeTeam && <div className="text-xs text-gray-500">{f.homeTeam}</div>}
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-center gap-2 tabular-nums">
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="w-16 text-right"
                              value={f.homeScore ?? ""}
                              onChange={(e) =>
                                setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, homeScore: e.target.value === "" ? null : Number(e.target.value) } : x)))
                              }
                              disabled={f.is_locked && f.status !== "PLAYED"}
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="w-16 text-right"
                              value={f.awayScore ?? ""}
                              onChange={(e) =>
                                setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, awayScore: e.target.value === "" ? null : Number(e.target.value) } : x)))
                              }
                              disabled={f.is_locked && f.status !== "PLAYED"}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-3">
                          <div className="font-medium">{f.awayPlayer}</div>
                          {f.awayTeam && <div className="text-xs text-gray-500">{f.awayTeam}</div>}
                        </div>
                        <div className="md:col-span-1">
                          <Input
                            placeholder="Weekend"
                            value={f.weekendLabel || ""}
                            onChange={(e) => setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, weekendLabel: e.target.value } : x)))}
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <Input
                            placeholder="Note"
                            value={f.note || ""}
                            onChange={(e) => setFixtures((prev) => prev.map((x) => (x.id === f.id ? { ...x, note: e.target.value } : x)))}
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => saveFixture(f.id)}><Save className="h-4 w-4 mr-1" /> Save</Button>
                          <Button size="sm" variant="outline" onClick={() => swapTeams(f.id)}><ArrowLeftRight className="h-4 w-4 mr-1" /> Swap</Button>
                          <Button size="sm" variant="outline" onClick={() => toggleLock(f.id)}>
                            {f.is_locked ? (<><Unlock className="h-4 w-4 mr-1" /> Unlock</>) : (<><Lock className="h-4 w-4 mr-1" /> Lock</>)}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeFixture(f.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
