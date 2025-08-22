"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

const steps = [
  "Basics",
  "Registration Rules",
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
  const [config, setConfig] = useState<any>({
    basics: { name: "Weekend FC League", season: "2025", is_active: false },
    registration: { allowLateReports: false, selfReportDeadlineHours: 24 },
    match: { rounds: 2, halvesMinutes: 6, format: "round_robin" },
    tiebreakers: ["points", "goal_difference", "goals_for"],
    teams: [] as string[],
    players: [] as string[],
    scheduling: { byes: "auto", labelTemplate: "Week {{md}}", pacing: "AUTO" },
  })

  useEffect(() => {
    // Load existing draft and approved players count
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
          const countApproved = players.filter((x: any) => (x.status || "approved").toLowerCase() === "approved").length || players.length
          setApprovedCount(countApproved)
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
      // Persist config (and set active)
      await fetch("/api/tournament/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, setActive: true }),
      })
      // Auto-generate fixtures using approved registrations and selected rounds
      await fetch("/api/admin/generate-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds: Number(config.match.rounds) || 2 }),
      })
      router.push("/admin?tab=fixtures")
    } finally {
      setPublishing(false)
    }
  }

  const NextPrev = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
        <Button variant="outline" onClick={() => setCurrent((s) => steps[Math.max(0, steps.indexOf(s) - 1)])} disabled={steps.indexOf(current) === 0}>
          Back
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={saveDraft} disabled={saving}>{saving ? "Saving..." : "Save Draft"}</Button>
        {steps.indexOf(current) < steps.length - 1 ? (
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setCurrent((s) => steps[Math.min(steps.length - 1, steps.indexOf(s) + 1)])}>Next</Button>
        ) : (
          <Button className="bg-primary hover:bg-primary/90" onClick={publish} disabled={publishing}>{publishing ? "Publishing..." : "Publish"}</Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl section-pad space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900">Tournament Setup</h1>
            <p className="text-sm text-gray-600">Configure and publish your tournament</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {steps.map((s) => (
            <button key={s} onClick={() => setCurrent(s)} className={`px-3 py-1 rounded border text-sm ${current === s ? "bg-purple-50 border-purple-200 text-purple-800" : "hover:bg-gray-50"}`}>{s}</button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{current}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {current === "Basics" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 border rounded-md p-4">
                  <div className="text-sm text-gray-600 mb-2">Approved Players</div>
                  <div className="text-3xl font-bold tabular-nums mb-4">{approvedCount ?? "—"}</div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Format</div>
                    <Select value={String(config.match.rounds)} onValueChange={(v) => setConfig({ ...config, match: { ...config.match, rounds: Number(v) } })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Round-robin (single)</SelectItem>
                        <SelectItem value="2">Round-robin (home & away)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
              </div>
            )}

            {current === "Registration Rules" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Allow late reports</label>
                  <Select value={String(config.registration.allowLateReports)} onValueChange={(v) => setConfig({ ...config, registration: { ...config.registration, allowLateReports: v === "true" } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Self-report deadline (hours)</label>
                  <Input type="number" value={config.registration.selfReportDeadlineHours} onChange={(e) => setConfig({ ...config, registration: { ...config.registration, selfReportDeadlineHours: Number(e.target.value || 0) } })} />
                </div>
              </div>
            )}

            {current === "Match Rules" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm">Rounds</label>
                  <Select value={String(config.match.rounds)} onValueChange={(v) => setConfig({ ...config, match: { ...config.match, rounds: Number(v) } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single Round</SelectItem>
                      <SelectItem value="2">Double Round (Home & Away)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Half length (minutes)</label>
                  <Input type="number" value={config.match.halvesMinutes} onChange={(e) => setConfig({ ...config, match: { ...config.match, halvesMinutes: Number(e.target.value || 0) } })} />
                </div>
                <div>
                  <label className="text-sm">Format</label>
                  <Select value={config.match.format} onValueChange={(v) => setConfig({ ...config, match: { ...config.match, format: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round-robin</SelectItem>
                      <SelectItem value="league">League</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {current === "Tiebreakers" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Order: points → goal difference → goals scored</p>
              </div>
            )}

            {current === "Teams" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Choose teams to include (optional; otherwise use players' preferred clubs)</p>
                <Input placeholder="Comma-separated team names" value={config.teams.join(", ")} onChange={(e) => setConfig({ ...config, teams: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
            )}

            {current === "Players" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Preview of approved registrations (mock)</p>
                <div className="border rounded-md p-3 text-sm text-gray-600">This will list approved players from Supabase in production.</div>
              </div>
            )}

            {current === "Scheduling" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm">BYE handling</label>
                  <Select value={config.scheduling.byes} onValueChange={(v) => setConfig({ ...config, scheduling: { ...config.scheduling, byes: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Label template</label>
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
              </div>
            )}

            {current === "Review" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">League</div>
                    <div className="font-semibold">{config.basics.name} — {config.basics.season}</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">Players</div>
                    <div className="font-semibold tabular-nums">{approvedCount ?? "—"}</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">Format</div>
                    <div className="font-semibold">{Number(config.match.rounds) === 2 ? "Round-robin (home & away)" : "Round-robin (single)"}</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">Scheduling</div>
                    <div className="font-semibold">{config.scheduling.pacing} • {config.scheduling.byes} BYE • {config.scheduling.labelTemplate}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-600">On publish, fixtures will be generated using approved registrations and these settings. You can edit fixtures afterward in the Admin → Fixtures tab.</p>
              </div>
            )}

            {NextPrev}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
