"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Copy, Save, Trash2 } from "lucide-react"

interface Player { id: string; name: string; username?: string; preferred_team?: string; preferred_club?: string; avatar_url?: string }
interface Fixture { id: string; season: string; matchday: number; date?: string | null; status: "SCHEDULED" | "LIVE" | "PLAYED" | "FORFEIT" | "CANCELLED"; homeId: string; awayId: string; homeScore?: number | null; awayScore?: number | null; forfeitWinnerId?: string | null; notes?: string }

const newId = () => Math.random().toString(36).slice(2, 10)

export default function AdminFixturesPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [activeSeason, setActiveSeason] = useState<string>("2024/25")
  const [seasons, setSeasons] = useState<string[]>(["2024/25", "2023/24", "2022/23"]) // mock seasons

  const [editorOpen, setEditorOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Fixture>({ id: newId(), season: "2024/25", matchday: 1, status: "SCHEDULED", homeId: "", awayId: "", date: "", homeScore: null, awayScore: null, forfeitWinnerId: null, notes: "" })
  const [tbd, setTbd] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
            id: String(f.id || newId()),
            season: f.season || "2024/25",
            matchday: Number(f.matchday || 1),
            date: f.kickoff_at || f.scheduledDate || null,
            status: String((f.status || "SCHEDULED")).toUpperCase(),
            homeId: String(f.homeId || f.home_id || f.homePlayerId || f.homePlayer || ""),
            awayId: String(f.awayId || f.away_id || f.awayPlayerId || f.awayPlayer || ""),
            homeScore: f.homeScore ?? null,
            awayScore: f.awayScore ?? null,
            forfeitWinnerId: f.forfeitWinnerId ?? null,
            notes: f.note || f.notes || ""
          }))
          setFixtures(rows)
        }
      } catch {
        setFixtures([])
      } finally {
        setLoading(false)
      }
    })()
    fetch("/api/admin/settings").then((r) => r.json()).then((s) => setSettings(s)).catch(() => null)
  }, [])

  // Matchday counts for current season
  const mdCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const f of fixtures.filter((x) => x.season === activeSeason)) {
      map.set(f.matchday, (map.get(f.matchday) || 0) + 1)
    }
    return map
  }, [fixtures, activeSeason])

  const openCreate = () => {
    setEditId(null)
    setTbd(false)
    setForm({ id: newId(), season: activeSeason, matchday: 1, status: "SCHEDULED", homeId: "", awayId: "", date: "", homeScore: null, awayScore: null, forfeitWinnerId: null, notes: "" })
    setEditorOpen(true)
  }

  const openEdit = (row: Fixture) => {
    setEditId(row.id)
    setTbd(!row.date)
    setForm({ ...row, date: row.date || "" })
    setEditorOpen(true)
  }

  const duplicate = () => {
    setEditId(null)
    setForm((f) => ({ ...f, id: newId() }))
  }

  const del = async () => {
    if (!editId) return
    if (!confirm("Delete this fixture? This is a soft delete.")) return
    // Optimistic
    setFixtures((prev) => prev.filter((x) => x.id !== editId))
    try {
      await fetch("/api/fixtures", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId }) })
    } catch {}
    setEditorOpen(false)
  }

  const save = async () => {
    // Validation
    if (!form.season || !form.matchday || !form.homeId || !form.awayId) { alert("Season, Matchday, Home, and Away are required."); return }
    if (form.homeId === form.awayId) { alert("Home and Away cannot be the same player."); return }
    if (form.status === "PLAYED") {
      if (form.homeScore == null || form.awayScore == null || form.homeScore < 0 || form.awayScore < 0) { alert("Scores are required for Played status."); return }
    }
    if (form.status === "FORFEIT" && !form.forfeitWinnerId) { alert("Select a forfeit winner."); return }

    // Clash checks (same day by player)
    if (!tbd && form.date) {
      const sameDay = (d: string) => new Date(d).toDateString()
      const clashes = fixtures.filter((f) => f.id !== form.id && f.season === form.season && f.date && sameDay(f.date) === sameDay(form.date!) && (f.homeId === form.homeId || f.awayId === form.homeId || f.homeId === form.awayId || f.awayId === form.awayId))
      if (clashes.length > 0) {
        const ok = confirm("One or both players already have a fixture that day. Proceed?")
        if (!ok) return
      }
    }

    // Optimistic upsert
    const payload = { ...form, date: tbd ? null : form.date }
    setFixtures((prev) => {
      const exists = prev.some((x) => x.id === form.id)
      const next = exists ? prev.map((x) => (x.id === form.id ? { ...payload } : x)) : [{ ...payload }, ...prev]
      return next
    })

    // Persist
    try {
      await fetch("/api/fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    } catch {}

    setEditorOpen(false)
    setToast("Fixture saved")
    setHighlightId(form.id)
    setTimeout(() => setToast(null), 2000)
  }

  const playerById = (id?: string) => players.find((p) => String(p.id) === String(id))
  const playerLabel = (p?: Player) => p ? `${p.name}${p.username ? " · " + p.username : ""}${p.preferred_team ? " · " + p.preferred_team : ""}` : "—"

  const home = playerById(form.homeId)
  const away = playerById(form.awayId)

  // UI
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-extrabold">Fixtures</h1>
            <p className="text-sm text-[#9E9E9E]">Create and manage fixtures</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
            <Button className="bg-[#00C853] text-black hover:bg-[#00C853]/90" onClick={openCreate} disabled={String(settings?.tournament?.status || "").toUpperCase() === "COMPLETED"}>Add Fixture</Button>
          </div>
        </div>
        {String(settings?.tournament?.status || "").toUpperCase() === "COMPLETED" && (
          <div className="mb-6 rounded-2xl p-3 border bg-[#141414] text-[#D1D1D1] text-sm">Tournament is completed. Adding or editing fixtures is disabled.</div>
        )}

        {toast && (<div className="mb-4 px-4 py-2 rounded-2xl border bg-emerald-900/20 text-emerald-300 text-sm">{toast}</div>)}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <div className="rounded-2xl border overflow-hidden bg-[#141414]">
              <div className="px-4 py-2 border-b border-[#1E1E1E] flex items-center gap-3">
                <Label className="text-sm">Season</Label>
                <Select value={activeSeason} onValueChange={(v) => { setActiveSeason(v); }}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="divide-y divide-[#1E1E1E]">
                {fixtures.filter((f) => f.season === activeSeason).map((f) => {
                  const h = playerById(f.homeId)
                  const a = playerById(f.awayId)
                  return (
                    <div key={f.id} className={`px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center ${highlightId === f.id ? "bg-emerald-900/10" : ""}`}
                         onAnimationEnd={() => setHighlightId(null)}>
                      <div className="md:col-span-1"><span className="px-2 py-0.5 text-xs rounded border bg-[#141414] border-[#1E1E1E]">MD {f.matchday}</span></div>
                      <div className="md:col-span-3">
                        <div className="font-medium">{playerLabel(h)}</div>
                      </div>
                      <div className="md:col-span-2 text-xs text-[#9E9E9E] flex items-center gap-2"><CalendarClock className="h-4 w-4" />{f.date ? new Date(f.date).toLocaleString() : "TBD"}</div>
                      <div className="md:col-span-3">
                        <div className="font-medium">{playerLabel(a)}</div>
                      </div>
                      <div className="md:col-span-3 flex items-center justify-end gap-2">
                        <Badge variant="outline">{f.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => openEdit(f)} disabled={String(settings?.tournament?.status || "").toUpperCase() === "COMPLETED"}>Edit</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-2xl border p-4 sticky top-4 bg-[#141414]">
              <div className="text-sm font-semibold mb-2">Tips</div>
              <div className="text-xs text-[#9E9E9E]">Use Add Fixture to schedule quickly. CMD/CTRL+K in the modal to search players. After save, we highlight the updated row.</div>
            </div>
          </div>
        </div>

        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="sm:max-w-2xl bg-[#141414] text-white border">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Fixture" : "Add Fixture"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Season</Label>
                <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Matchday</Label>
                <Select value={String(form.matchday)} onValueChange={(v) => setForm({ ...form, matchday: Number(v) })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 38 }).map((_, i) => {
                      const md = i + 1
                      const count = mdCounts.get(md) || 0
                      return (<SelectItem key={md} value={String(md)}>MD {md} · {count} scheduled</SelectItem>)
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Home Club/Player</Label>
                  <PlayerSearch players={players} value={form.homeId} onChange={(id) => setForm({ ...form, homeId: id, /* autofill via preferred team if needed */ })} />
                  {home && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#9E9E9E]">
                      <Image src={home.avatar_url || "/placeholder-user.jpg"} alt="avatar" width={20} height={20} className="rounded-full" />
                      <span>{home.username || ""}</span>
                      {home.preferred_team && <span className="px-2 py-0.5 rounded border bg-[#141414] text-[#D1D1D1] border-[#1E1E1E]">{home.preferred_team}</span>}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm">Away Club/Player</Label>
                  <PlayerSearch players={players} value={form.awayId} onChange={(id) => setForm({ ...form, awayId: id })} disabledId={form.homeId} />
                  {away && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#9E9E9E]">
                      <Image src={away.avatar_url || "/placeholder-user.jpg"} alt="avatar" width={20} height={20} className="rounded-full" />
                      <span>{away.username || ""}</span>
                      {away.preferred_team && <span className="px-2 py-0.5 rounded border bg-[#141414] text-[#D1D1D1] border-[#1E1E1E]">{away.preferred_team}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Date/Time</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input type="datetime-local" value={tbd ? "" : (form.date || "")} onChange={(e) => setForm({ ...form, date: e.target.value })} disabled={tbd} className="bg-transparent" />
                    <label className="text-sm text-[#9E9E9E] flex items-center gap-2"><input type="checkbox" checked={tbd} onChange={(e) => setTbd(e.target.checked)} /> TBD</label>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="LIVE">Live</SelectItem>
                      <SelectItem value="PLAYED">Played</SelectItem>
                      <SelectItem value="FORFEIT">Forfeit</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.status === "PLAYED" && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Home Score</Label>
                    <Input type="number" min="0" value={form.homeScore ?? ""} onChange={(e) => setForm({ ...form, homeScore: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 bg-transparent" />
                  </div>
                  <div>
                    <Label className="text-sm">Away Score</Label>
                    <Input type="number" min="0" value={form.awayScore ?? ""} onChange={(e) => setForm({ ...form, awayScore: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 bg-transparent" />
                  </div>
                </div>
              )}

              {form.status === "FORFEIT" && (
                <div className="md:col-span-2">
                  <Label className="text-sm">Forfeit Winner</Label>
                  <Select value={form.forfeitWinnerId || ""} onValueChange={(v) => setForm({ ...form, forfeitWinnerId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select winner" /></SelectTrigger>
                    <SelectContent>
                      {home && <SelectItem value={home.id}>{home.name}</SelectItem>}
                      {away && <SelectItem value={away.id}>{away.name}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="md:col-span-2">
                <Label className="text-sm">Notes (admins only)</Label>
                <Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 bg-transparent" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-[#9E9E9E]">
                Tip: ⌘/Ctrl+K to search players · Enter to save
              </div>
              <div className="flex items-center gap-2">
                {editId && <Button variant="outline" onClick={duplicate}><Copy className="h-4 w-4 mr-1" /> Duplicate</Button>}
                {editId && <Button variant="outline" onClick={del} className="text-rose-400 border-rose-900 hover:bg-rose-900/20"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>}
                <Button className="bg-[#00C853] text-black hover:bg-[#00C853]/90" onClick={save}><Save className="h-4 w-4 mr-1" /> Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function PlayerSearch({ players, value, onChange, disabledId }: { players: Player[]; value?: string; onChange: (id: string) => void; disabledId?: string }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (e.key === "Enter" && open) {
        // Let parent handle submit via default button
        const btn = document.querySelector("button[type=submit]") as HTMLButtonElement | null
        btn?.click()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const selected = players.find((p) => String(p.id) === String(value))

  return (
    <div>
      <Button variant="outline" className="w-full justify-between" onClick={() => setOpen(true)}>
        <div className="truncate text-left">
          {selected ? `${selected.name}${selected.username ? " · " + selected.username : ""}` : "Search player"}
        </div>
      </Button>
      {open && (
        <div className="relative z-50">
          <div className="mt-2 border rounded-md bg-[#141414] text-white shadow-lg">
            <Command>
              <CommandInput ref={inputRef as any} placeholder="Search players" />
              <CommandList>
                <CommandEmpty>No players found.</CommandEmpty>
                <CommandGroup>
                  {players.map((p) => (
                    <CommandItem key={p.id} value={`${p.name} ${p.username || ""}`} onSelect={() => { if (disabledId && String(disabledId) === String(p.id)) return; onChange(String(p.id)); setOpen(false) }}>
                      <div className="flex items-center gap-2">
                        <Image src={p.avatar_url || "/placeholder-user.jpg"} alt="avatar" width={20} height={20} className="rounded-full" />
                        <div className="flex flex-col">
                          <span className="text-sm">{p.name}</span>
                          <span className="text-xs text-[#9E9E9E]">{p.username || ""}{p.preferred_team ? ` · ${p.preferred_team}` : ""}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>
      )}
    </div>
  )
}
