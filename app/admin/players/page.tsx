"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [q, setQ] = useState("")

  const load = async () => {
    const r = await fetch("/api/admin/players").then((x) => x.json())
    setPlayers(r.players || [])
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return players
    return players.filter((p) => [p.name, p.gamer_tag, p.preferred_club, p.console, p.location].some((v) => String(v || "").toLowerCase().includes(query)))
  }, [players, q])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Players</h1>
            <p className="text-sm text-[#9E9E9E]">Add and manage players for tournaments</p>
          </div>
        </header>

        <AddForm onAdded={load} />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-[#141414]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/gamer tag/club" className="h-7 border-0 focus-visible:ring-0 p-0 bg-transparent" />
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
                      <Button size="sm" variant="outline" onClick={async () => { await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id: p.id, patch: { active: !p.active } }) }); load() }}>{p.active ? "Deactivate" : "Activate"}</Button>
                      <Button size="sm" variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={async () => { if (!confirm("Delete player?")) return; await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: p.id }) }); load() }}>Delete</Button>
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
      </div>
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
    try {
      await fetch("/api/admin/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name, gamer_tag: gamerTag, console: consoleType, preferred_club: club, location, active }) })
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
