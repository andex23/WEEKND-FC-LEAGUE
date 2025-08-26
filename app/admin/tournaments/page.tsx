"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function AdminTournamentsPage() {
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [name, setName] = useState("")
  const [status, setStatus] = useState("DRAFT")
  const [season, setSeason] = useState("")
  const [type, setType] = useState("DOUBLE")
  const [players, setPlayers] = useState(0)
  const [rules, setRules] = useState("")

  const load = async () => { const r = await fetch("/api/admin/tournaments").then((x) => x.json()); setList(r.tournaments || []) }
  useEffect(() => {
    load()
    ;(async () => {
      try {
        const regs = await fetch("/api/admin/registrations").then((r) => r.json())
        const count = (regs.registrations || []).filter((p: any) => String(p.status || "").toLowerCase() === "approved").length
        setPlayers(count)
      } catch {}
    })()
  }, [])

  const create = async () => {
    if (!name.trim()) return
    await fetch("/api/admin/tournaments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"create", name, status, season, type, players, rules }) })
    setName(""); setSeason(""); setRules("")
    load()
  }
  const remove = async (id: string) => { if (!confirm("Delete tournament?")) return; await fetch("/api/admin/tournaments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"delete", id }) }); load() }
  const activate = async (t: any) => {
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ section:"tournament", data: { name: t.name, status: "ACTIVE", season: t.season || "", format: t.type, matchdays: ["Sat","Sun"], match_length: 8 } }) })
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ section:"branding", data: { league_name: t.name } }) })
    router.push("/admin")
  }
  const openSettings = () => { router.push("/admin?section=settings") }
  const generateNow = async (t: any) => {
    const rounds = String(t.type || "DOUBLE").toUpperCase() === "SINGLE" ? 1 : 2
    const res = await fetch("/api/admin/generate-fixtures", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ rounds }) })
    if (!res.ok) return
    const data = await res.json()
    // Persist each generated fixture to our fixtures store so they display under
    for (const f of data.fixtures || []) {
      await fetch("/api/fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        id: f.id,
        season: season || t.season || "2024/25",
        matchday: f.matchday,
        homeId: f.homeId || f.home_player || f.home || f.home_reg_id || f.homePlayer || f.home_player_id || "",
        awayId: f.awayId || f.away_player || f.away || f.away_reg_id || f.awayPlayer || f.away_player_id || "",
        status: "SCHEDULED",
        date: null,
      }) })
    }
    // Reload list so user can click through or view under
    await load()
  }

  const [justGenerated, setJustGenerated] = useState<any[]>([])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad">
        <div className="mb-6">
          <h1 className="text-[28px] md:text-[32px] font-extrabold">Tournaments</h1>
          <p className="text-sm text-[#9E9E9E]">Create and view tournaments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="rounded-2xl border overflow-hidden bg-[#141414]">
              <div className="px-4 py-2 border-b border-[#1E1E1E] text-sm font-semibold">Tournaments</div>
              <div className="divide-y divide-[#1E1E1E]">
                {list.length === 0 ? (
                  <div className="p-4 text-sm text-[#9E9E9E]">No tournaments yet</div>
                ) : list.map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-[#9E9E9E]">{t.season || "—"} · {t.status} · {t.type} · {t.players} players</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => activate(t)}>Activate</Button>
                        <Button size="sm" variant="outline" onClick={() => generateNow(t)}>Generate Fixtures</Button>
                        <Button size="sm" variant="outline" onClick={openSettings}>Settings</Button>
                        <Button size="sm" variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={() => remove(t.id)}>Delete</Button>
                      </div>
                    </div>
                    {/* Inline fixtures preview */}
                    <InlineFixtures />
                  </div>
                ))}
              </div>
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
                <label className="text-sm">Number of Players (approved)</label>
                <Input className="mt-1 bg-transparent" type="number" value={players} onChange={(e) => setPlayers(Number(e.target.value || 0))} />
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
                  <label className="text-sm">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Season</label>
                  <Input className="mt-1 bg-transparent" placeholder="2024/25" value={season} onChange={(e) => setSeason(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={create}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InlineFixtures() {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/fixtures").then((x) => x.json())
        setRows(r.fixtures || [])
      } catch {}
    })()
  }, [])
  if (rows.length === 0) return null
  return (
    <div className="mt-3 rounded-md border border-[#1E1E1E]">
      <div className="px-3 py-2 text-xs text-[#9E9E9E]">Generated Fixtures</div>
      <div className="divide-y divide-[#1E1E1E]">
        {rows.map((f) => (
          <div key={f.id} className="px-3 py-2 flex items-center justify-between">
            <div className="text-sm">MD{f.matchday} • {f.homePlayer} vs {f.awayPlayer}</div>
            <a className="text-xs underline" href="/admin/fixtures">Edit</a>
          </div>
        ))}
      </div>
    </div>
  )
}
