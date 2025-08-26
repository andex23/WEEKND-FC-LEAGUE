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
    if (res.ok) router.push("/admin/fixtures")
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl section-pad">
        <div className="mb-6">
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900">Tournaments</h1>
          <p className="text-sm text-gray-500">Create and view tournaments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="border rounded-md overflow-hidden">
              <div className="px-4 py-2 border-b bg-gray-50 text-sm font-semibold">Tournaments</div>
              <div className="divide-y">
                {list.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">No tournaments yet</div>
                ) : list.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-gray-600">{t.season || "—"} · {t.status} · {t.type} · {t.players} players</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => activate(t)}>Activate</Button>
                      <Button size="sm" variant="outline" onClick={() => generateNow(t)}>Generate Fixtures</Button>
                      <Button size="sm" variant="outline" onClick={openSettings}>Settings</Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => remove(t.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="border rounded-md p-4 sticky top-4 space-y-3">
              <div className="text-sm font-semibold">New Tournament</div>
              <div>
                <label className="text-sm">League Name</label>
                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Number of Players (approved)</label>
                <Input className="mt-1" type="number" value={players} onChange={(e) => setPlayers(Number(e.target.value || 0))} />
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
                <Input className="mt-1" placeholder="Link or brief notes" value={rules} onChange={(e) => setRules(e.target.value)} />
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
                  <Input className="mt-1" placeholder="2024/25" value={season} onChange={(e) => setSeason(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-primary hover:bg-primary/90" onClick={create}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
