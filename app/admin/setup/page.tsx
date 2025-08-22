"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { PREMIER_LEAGUE_CLUBS } from "@/lib/constants"

const steps = [
  "Basics",
  "Registration",
  "Match Rules",
  "Tiebreakers",
  "Teams",
  "Players",
  "Scheduling",
  "Review",
] as const

type WizardStep = (typeof steps)[number]

export default function TournamentSetupPage() {
  const router = useRouter()

  const [current, setCurrent] = useState<WizardStep>("Basics")
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [approvedCount, setApprovedCount] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [config, setConfig] = useState<any>({
    basics: { name: "Weekend FC League", season: "2025", format: "league", is_active: false, status: "DRAFT" },
    registration: { maxPlayers: 20, consoles: ["PS5", "XBOX", "PC"], uniqueTeams: true, autoApprove: false },
    match: { halvesMinutes: 6, dcPolicy: "Replay if <60'", forfeitPolicy: "3-0", points: { win: 3, draw: 1, loss: 0 } },
    tiebreakers: ["Points", "GD", "GF", "H2H", "Fair Play", "Coin Toss"],
    teams: [] as string[],
    players: { approved: [], pending: [] as any[] },
    scheduling: { rounds: 2, labelTemplate: "Week {{md}}", pacing: "AUTO" },
  })

  const csvRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [cfgRes, playersRes] = await Promise.all([
          fetch("/api/tournament/config"),
          fetch("/api/admin/players"),
        ])
        if (cfgRes.ok) {
          const data = await cfgRes.json()
          if (data?.config) setConfig((prev: any) => ({ ...prev, ...data.config }))
        }
        if (playersRes.ok) {
          const p = await playersRes.json()
          const players = p?.players || []
          const approved = players.filter((x: any) => (x.status || "approved").toLowerCase() === "approved")
          const pending = players.filter((x: any) => (x.status || "approved").toLowerCase() !== "approved")
          setApprovedCount(approved.length)
          setPendingCount(pending.length)
          setConfig((prev: any) => ({ ...prev, players: { approved, pending } }))
        }
      } catch {}
    })()
  }, [])

  const saveDraft = async () => {
    setSaving(true)
    try {
      await fetch("/api/tournament/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    setPublishing(true)
    try {
      const updated = { ...config, basics: { ...config.basics, is_active: true, status: "ACTIVE" } }
      await fetch("/api/tournament/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: updated }) })
      await fetch("/api/tournament/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: updated, setActive: true }) })
      await fetch("/api/admin/generate-fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rounds: Number(updated.scheduling.rounds) || 2 }) })
      router.push("/admin?tab=fixtures")
    } finally {
      setPublishing(false)
    }
  }

  const moveTie = (from: number, to: number) => {
    setConfig((prev: any) => {
      const arr = [...prev.tiebreakers]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return { ...prev, tiebreakers: arr }
    })
  }

  const onChipDragStart = (e: React.DragEvent, idx: number) => e.dataTransfer.setData("text/plain", String(idx))
  const onChipDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData("text/plain"))
    moveTie(from, idx)
  }

  const importTeamsCsv = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    setConfig((prev: any) => ({ ...prev, teams: Array.from(new Set([...(prev.teams || []), ...lines])) }))
  }

  const stepper = (
    <div className="flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <button key={s} onClick={() => setCurrent(s)} className={`px-3 py-1 rounded border text-sm ${current === s ? "bg-purple-50 border-purple-200 text-purple-800" : "hover:bg-gray-50"}`}>
          {i + 1}. {s}
        </button>
      ))}
    </div>
  )

  const headerBar = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900">Tournament Setup</h1>
        <p className="text-sm text-gray-600">Guided wizard to publish your tournament</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
        <Button variant="outline" onClick={saveDraft} disabled={saving}>{saving ? "Saving..." : "Save Draft"}</Button>
      </div>
    </div>
  )

  const navBar = (
    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={() => setCurrent((s) => steps[Math.max(0, steps.indexOf(s) - 1)])} disabled={steps.indexOf(current) === 0}>Back</Button>
      <div className="flex items-center gap-2">
        {steps.indexOf(current) < steps.length - 1 ? (
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setCurrent((s) => steps[Math.min(steps.length - 1, steps.indexOf(s) + 1)])}>Next</Button>
        ) : (
          <Button className="bg-primary hover:bg-primary/90" onClick={publish} disabled={publishing}>{publishing ? "Publishing..." : "Publish Tournament"}</Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl section-pad space-y-6">
        {headerBar}
        {stepper}

        {/* Basics */}
        {current === "Basics" && (
          <Card>
            <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="text-sm">League Name</label>
                  <Input value={config.basics.name} onChange={(e) => setConfig({ ...config, basics: { ...config.basics, name: e.target.value } })} />
                </div>
                <div>
                  <label className="text-sm">Season</label>
                  <Input value={config.basics.season} onChange={(e) => setConfig({ ...config, basics: { ...config.basics, season: e.target.value } })} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Format</div>
                <Select value={config.basics.format} onValueChange={(v) => setConfig({ ...config, basics: { ...config.basics, format: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="league">League</SelectItem>
                    <SelectItem value="round_robin">Round-robin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration */}
        {current === "Registration" && (
          <Card>
            <CardHeader><CardTitle>Registration Rules</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm">Max players</label>
                <Input type="number" value={config.registration.maxPlayers} onChange={(e) => setConfig({ ...config, registration: { ...config.registration, maxPlayers: Number(e.target.value || 0) } })} />
              </div>
              <div>
                <label className="text-sm">Consoles allowed</label>
                <Select value={config.registration.consoles.join(",")} onValueChange={(v) => setConfig({ ...config, registration: { ...config.registration, consoles: v.split(",") } })}>
                  <SelectTrigger><SelectValue placeholder="Choose consoles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PS5,XBOX,PC">PS5, Xbox, PC</SelectItem>
                    <SelectItem value="PS5,XBOX">PS5, Xbox</SelectItem>
                    <SelectItem value="PS5">PS5 only</SelectItem>
                    <SelectItem value="XBOX">Xbox only</SelectItem>
                    <SelectItem value="PC">PC only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Unique teams</label>
                <Select value={String(config.registration.uniqueTeams)} onValueChange={(v) => setConfig({ ...config, registration: { ...config.registration, uniqueTeams: v === "true" } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Auto-approve registrations</label>
                <Select value={String(config.registration.autoApprove)} onValueChange={(v) => setConfig({ ...config, registration: { ...config.registration, autoApprove: v === "true" } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match Rules */}
        {current === "Match Rules" && (
          <Card>
            <CardHeader><CardTitle>Match Rules</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm">Half length (minutes)</label>
                <Input type="number" value={config.match.halvesMinutes} onChange={(e) => setConfig({ ...config, match: { ...config.match, halvesMinutes: Number(e.target.value || 0) } })} />
              </div>
              <div>
                <label className="text-sm">DC policy</label>
                <Input value={config.match.dcPolicy} onChange={(e) => setConfig({ ...config, match: { ...config.match, dcPolicy: e.target.value } })} />
              </div>
              <div>
                <label className="text-sm">Forfeit policy</label>
                <Input value={config.match.forfeitPolicy} onChange={(e) => setConfig({ ...config, match: { ...config.match, forfeitPolicy: e.target.value } })} />
              </div>
              <div>
                <label className="text-sm">Scoring (win/draw/loss)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" className="text-center" value={config.match.points.win} onChange={(e) => setConfig({ ...config, match: { ...config.match, points: { ...config.match.points, win: Number(e.target.value || 0) } } })} />
                  <Input type="number" className="text-center" value={config.match.points.draw} onChange={(e) => setConfig({ ...config, match: { ...config.match, points: { ...config.match.points, draw: Number(e.target.value || 0) } } })} />
                  <Input type="number" className="text-center" value={config.match.points.loss} onChange={(e) => setConfig({ ...config, match: { ...config.match, points: { ...config.match.points, loss: Number(e.target.value || 0) } } })} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tiebreakers */}
        {current === "Tiebreakers" && (
          <Card>
            <CardHeader><CardTitle>Tiebreakers</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">Drag to reorder the ranking rules.</p>
              <div className="flex flex-wrap gap-2">
                {config.tiebreakers.map((b: string, idx: number) => (
                  <span key={b} draggable onDragStart={(e) => onChipDragStart(e, idx)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onChipDrop(e, idx)} className="px-2 py-1 rounded border text-xs bg-gray-50 cursor-move">
                    {b}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams */}
        {current === "Teams" && (
          <Card>
            <CardHeader><CardTitle>Teams</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">Pick EPL clubs or paste your own list. Empty = use players' preferred clubs.</div>
              <div className="flex flex-wrap gap-2">
                {PREMIER_LEAGUE_CLUBS.map((club) => (
                  <button key={club} onClick={() => setConfig((prev: any) => ({ ...prev, teams: Array.from(new Set([...(prev.teams || []), club])) }))} className="px-2 py-1 rounded border text-xs hover:bg-gray-50">
                    {club}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm">Custom teams (one per line)</label>
                <textarea className="w-full h-28 border rounded p-2 text-sm" value={(config.teams || []).join("\n")} onChange={(e) => setConfig({ ...config, teams: e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="flex items-center gap-2">
                <input ref={csvRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files && importTeamsCsv(e.target.files[0])} />
                <Button variant="outline" onClick={() => csvRef.current?.click()}>Import CSV</Button>
                <Button variant="outline" onClick={() => setConfig((prev: any) => ({ ...prev, teams: [] }))}>Clear</Button>
              </div>
              {(config.teams?.length || 0) === 0 && (
                <div className="border rounded p-3 text-xs text-gray-600">No teams selected. Players' preferred clubs will be used.</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Players */}
        {current === "Players" && (
          <Card>
            <CardHeader><CardTitle>Players</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <div className="text-xs text-gray-600">Approved</div>
                  <div className="font-semibold tabular-nums">{approvedCount ?? "—"}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-gray-600">Pending</div>
                  <div className="font-semibold tabular-nums">{pendingCount ?? "—"}</div>
                </div>
              </div>
              {(!approvedCount || approvedCount === 0) && (
                <div className="border rounded p-3 text-xs text-gray-600">No approved players yet. Manage registrations in the admin.</div>
              )}
              <div>
                <Button variant="outline" onClick={() => router.push("/admin?tab=registrations")}>Manage Registrations</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduling */}
        {current === "Scheduling" && (
          <Card>
            <CardHeader><CardTitle>Scheduling</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm">Rounds</label>
                <Select value={String(config.scheduling.rounds)} onValueChange={(v) => setConfig({ ...config, scheduling: { ...config.scheduling, rounds: Number(v) } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Single</SelectItem>
                    <SelectItem value="2">Double (Home & Away)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Weekend label template</label>
                <Input value={config.scheduling.labelTemplate} onChange={(e) => setConfig({ ...config, scheduling: { ...config.scheduling, labelTemplate: e.target.value } })} />
              </div>
              <div>
                <label className="text-sm">Pacing</label>
                <Select value={config.scheduling.pacing} onValueChange={(v) => setConfig({ ...config, scheduling: { ...config.scheduling, pacing: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Auto</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review */}
        {current === "Review" && (
          <Card>
            <CardHeader><CardTitle>Review & Publish</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <div className="text-xs text-gray-600">League</div>
                  <div className="font-semibold">{config.basics.name} — {config.basics.season}</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-xs text-gray-600">Players</div>
                  <div className="font-semibold tabular-nums">Approved {approvedCount ?? "—"} • Pending {pendingCount ?? "—"}</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-xs text-gray-600">Match Rules</div>
                  <div className="font-semibold">{config.match.halvesMinutes}' halves • DC: {config.match.dcPolicy} • Forfeit: {config.match.forfeitPolicy} • Points: {config.match.points.win}/{config.match.points.draw}/{config.match.points.loss}</div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="text-xs text-gray-600">Scheduling</div>
                  <div className="font-semibold">{Number(config.scheduling.rounds) === 2 ? "Double Round" : "Single Round"} • {config.scheduling.pacing} • {config.scheduling.labelTemplate}</div>
                </div>
                <div className="border rounded-md p-4 md:col-span-2">
                  <div className="text-xs text-gray-600">Tiebreakers</div>
                  <div className="font-semibold text-sm">{config.tiebreakers.join(" → ")}</div>
                </div>
              </div>
              {navBar}
            </CardContent>
          </Card>
        )}

        {current !== "Review" && (
          <div>{navBar}</div>
        )}
      </div>
    </div>
  )
}
