"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AdminOverlayNav } from "@/components/admin/overlay-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const steps = ["Basics", "Registration", "Match Rules", "Tiebreakers", "Invitations", "Scheduling", "Review"] as const

type WizardStep = (typeof steps)[number]

const defaultConfig = {
  basics: { name: "Weekend FC League", season: "2026", status: "DRAFT", startAt: "", endAt: "" },
  registration: { maxPlayers: 20, consoles: ["PS5", "XBOX", "PC"], inviteOnly: true },
  match: { halvesMinutes: 6, dcPolicy: "Replay if <60'", forfeitPolicy: "3-0", points: { win: 3, draw: 1, loss: 0 } },
  tiebreakers: ["Points", "GD", "GF", "H2H", "Fair Play", "Coin Toss"],
  invitations: { autoInviteApproved: true },
  scheduling: { rounds: 2, labelTemplate: "Week {{md}}", pacing: "AUTO" },
}

export default function TournamentSetupPage() {
  const router = useRouter()
  const [current, setCurrent] = useState<WizardStep>("Basics")
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [approvedCount, setApprovedCount] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [config, setConfig] = useState<any>(defaultConfig)

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
          const data = await playersRes.json()
          const players = data?.players || []
          const approved = players.filter((x: any) => String(x.status || "").toLowerCase() === "approved")
          const pending = players.filter((x: any) => String(x.status || "pending").toLowerCase() === "pending")
          setApprovedCount(approved.length)
          setPendingCount(pending.length)
          setConfig((prev: any) => ({
            ...prev,
            registration: { ...prev.registration, maxPlayers: approved.length || prev.registration.maxPlayers },
          }))
        }
      } catch {}
    })()
  }, [])

  const activeStepIndex = steps.indexOf(current)
  const canCreate = config.basics.name.trim().length > 0

  const summaryRows = useMemo(
    () => [
      ["League", `${config.basics.name} - ${config.basics.season}`],
      ["Status", config.basics.status],
      ["Entries", `Invite-only - ${approvedCount ?? "-"} approved players available`],
      ["Rules", `${config.match.halvesMinutes}' halves - ${config.match.points.win}/${config.match.points.draw}/${config.match.points.loss} points`],
      ["Schedule", `${Number(config.scheduling.rounds) === 2 ? "Double" : "Single"} round - ${config.scheduling.pacing}`],
    ],
    [approvedCount, config],
  )

  const saveDraft = async () => {
    setSaving(true)
    try {
      await fetch("/api/tournament/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })
      toast.success("Setup draft saved")
    } finally {
      setSaving(false)
    }
  }

  const createTournament = async () => {
    if (!canCreate) {
      toast.error("Enter a league name")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: config.basics.name,
          season: config.basics.season,
          status: config.basics.status,
          start_at: config.basics.startAt || null,
          end_at: config.basics.endAt || null,
          is_active: config.basics.status === "ACTIVE",
          type: Number(config.scheduling.rounds) === 1 ? "SINGLE" : "DOUBLE",
          players: approvedCount ?? config.registration.maxPlayers,
          rules: `${config.match.halvesMinutes}' halves; DC ${config.match.dcPolicy}; Forfeit ${config.match.forfeitPolicy}`,
          match_length: config.match.halvesMinutes,
          config: {
            registration: config.registration,
            match: config.match,
            tiebreakers: config.tiebreakers,
            invitations: config.invitations,
            scheduling: config.scheduling,
            inviteOnly: true,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.tournament?.id) {
        toast.error(data?.error || "Failed to create tournament")
        return
      }

      if (config.invitations.autoInviteApproved) {
        const inviteRes = await fetch("/api/admin/tournament-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "invite_all_approved", tournamentId: data.tournament.id }),
        })
        const inviteData = await inviteRes.json().catch(() => ({}))
        if (!inviteRes.ok) {
          toast.error(inviteData?.error || "Tournament created, but invitations failed")
          router.push("/admin/tournaments")
          return
        }
        toast.success(`Tournament created. ${inviteData?.summary?.total ?? 0} approved players invited.`)
      } else {
        toast.success("Tournament created")
      }

      router.push("/admin/tournaments")
    } finally {
      setCreating(false)
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
    moveTie(Number(e.dataTransfer.getData("text/plain")), idx)
  }

  return (
    <div className="min-h-screen bg-[#080A08] text-white">
      <div className="mx-auto flex w-full max-w-[1500px] gap-5 px-4 py-5 lg:px-6">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-72 shrink-0 rounded-lg border border-[#243026] bg-[#0E120F] p-4 lg:block">
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Tournament setup</div>
            <div className="mt-2 text-xl font-extrabold">Invite-only league</div>
            <div className="mt-1 text-xs text-[#8A9A8D]">Players choose their club after accepting.</div>
          </div>
          <nav className="space-y-1" aria-label="Setup steps">
            {steps.map((step, index) => (
              <button
                key={step}
                onClick={() => setCurrent(step)}
                className={`flex h-11 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors ${
                  current === step
                    ? "border-[#D6F66A] bg-[#D6F66A] text-[#10130D]"
                    : "border-transparent text-[#DDE8D8] hover:border-[#273529] hover:bg-[#151B16]"
                }`}
              >
                <span>{step}</span>
                <span className="tabular-nums opacity-70">{index + 1}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">
          <header className="rounded-lg border border-[#243026] bg-[#0E120F] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#8A9A8D]">Weekend FC admin</div>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-4xl">Create tournament</h1>
                <p className="mt-1 max-w-2xl text-sm text-[#A7B2A2]">
                  Set the league rules, invite approved players, and generate fixtures only after players accept with their clubs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminOverlayNav />
                <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
                <Button variant="outline" onClick={saveDraft} disabled={saving}>{saving ? "Saving..." : "Save Draft"}</Button>
              </div>
            </div>
          </header>

          <div className="flex flex-wrap gap-2 lg:hidden">
            {steps.map((step) => (
              <button
                key={step}
                onClick={() => setCurrent(step)}
                className={`rounded-md border px-3 py-2 text-xs ${current === step ? "border-[#D6F66A] bg-[#D6F66A] text-[#10130D]" : "border-[#243026] bg-[#0E120F] text-[#DDE8D8]"}`}
              >
                {step}
              </button>
            ))}
          </div>

          {current === "Basics" && (
            <Panel title="Basics" kicker="Tournament identity">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="League Name" className="md:col-span-2">
                  <Input className="bg-transparent" value={config.basics.name} onChange={(e) => setConfig({ ...config, basics: { ...config.basics, name: e.target.value } })} />
                </Field>
                <Field label="Season">
                  <Input className="bg-transparent" value={config.basics.season} onChange={(e) => setConfig({ ...config, basics: { ...config.basics, season: e.target.value } })} />
                </Field>
                <Field label="Status">
                  <Select value={config.basics.status} onValueChange={(v) => setConfig({ ...config, basics: { ...config.basics, status: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Start Date">
                  <Input className="bg-transparent" type="date" value={config.basics.startAt} onChange={(e) => setConfig({ ...config, basics: { ...config.basics, startAt: e.target.value } })} />
                </Field>
                <Field label="End Date">
                  <Input className="bg-transparent" type="date" value={config.basics.endAt} onChange={(e) => setConfig({ ...config, basics: { ...config.basics, endAt: e.target.value } })} />
                </Field>
              </div>
            </Panel>
          )}

          {current === "Registration" && (
            <Panel title="Registration" kicker="Approval-gated intake">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Metric label="Approved" value={approvedCount ?? "-"} detail="Can receive tournament invites" />
                <Metric label="Pending" value={pendingCount ?? "-"} detail="Need admin approval first" warning={Boolean(pendingCount)} />
                <Metric label="Entry model" value="Invite only" detail="No public tournament entry" />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Consoles Allowed">
                  <Select value={config.registration.consoles.join(",")} onValueChange={(v) => setConfig({ ...config, registration: { ...config.registration, consoles: v.split(",") } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PS5,XBOX,PC">PS5, Xbox, PC</SelectItem>
                      <SelectItem value="PS5,XBOX">PS5, Xbox</SelectItem>
                      <SelectItem value="PS5">PS5 only</SelectItem>
                      <SelectItem value="XBOX">Xbox only</SelectItem>
                      <SelectItem value="PC">PC only</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Player Pool">
                  <Input className="bg-transparent" type="number" readOnly value={approvedCount ?? config.registration.maxPlayers} />
                </Field>
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => router.push("/admin/players")}>Open Players</Button>
                </div>
              </div>
            </Panel>
          )}

          {current === "Match Rules" && (
            <Panel title="Match Rules" kicker="Gameplay settings">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Half Length">
                  <Input className="bg-transparent" type="number" value={config.match.halvesMinutes} onChange={(e) => setConfig({ ...config, match: { ...config.match, halvesMinutes: Number(e.target.value || 0) } })} />
                </Field>
                <Field label="Disconnect Policy">
                  <Input className="bg-transparent" value={config.match.dcPolicy} onChange={(e) => setConfig({ ...config, match: { ...config.match, dcPolicy: e.target.value } })} />
                </Field>
                <Field label="Forfeit Policy">
                  <Input className="bg-transparent" value={config.match.forfeitPolicy} onChange={(e) => setConfig({ ...config, match: { ...config.match, forfeitPolicy: e.target.value } })} />
                </Field>
                <Field label="Win Points">
                  <Input className="bg-transparent" type="number" value={config.match.points.win} onChange={(e) => setConfig({ ...config, match: { ...config.match, points: { ...config.match.points, win: Number(e.target.value || 0) } } })} />
                </Field>
                <Field label="Draw Points">
                  <Input className="bg-transparent" type="number" value={config.match.points.draw} onChange={(e) => setConfig({ ...config, match: { ...config.match, points: { ...config.match.points, draw: Number(e.target.value || 0) } } })} />
                </Field>
                <Field label="Loss Points">
                  <Input className="bg-transparent" type="number" value={config.match.points.loss} onChange={(e) => setConfig({ ...config, match: { ...config.match, points: { ...config.match.points, loss: Number(e.target.value || 0) } } })} />
                </Field>
              </div>
            </Panel>
          )}

          {current === "Tiebreakers" && (
            <Panel title="Tiebreakers" kicker="Drag to reorder">
              <div className="flex flex-wrap gap-2">
                {config.tiebreakers.map((rule: string, index: number) => (
                  <span
                    key={rule}
                    draggable
                    onDragStart={(e) => onChipDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onChipDrop(e, index)}
                    className="cursor-move rounded-md border border-[#243026] bg-[#0B0E0C] px-3 py-2 text-xs text-[#DDE8D8]"
                  >
                    {index + 1}. {rule}
                  </span>
                ))}
              </div>
            </Panel>
          )}

          {current === "Invitations" && (
            <Panel title="Invitations" kicker="Player-controlled club choice">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Metric label="Approved Pool" value={approvedCount ?? "-"} detail="Eligible for invite" />
                <Metric label="Pending Queue" value={pendingCount ?? "-"} detail="Approve before inviting" warning={Boolean(pendingCount)} />
                <Metric label="Club Selection" value="Player" detail="Chosen on dashboard accept" />
              </div>
              <label className="mt-4 flex items-start gap-3 rounded-md border border-[#243026] bg-[#0B0E0C] p-4 text-sm text-[#DDE8D8]">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={config.invitations.autoInviteApproved}
                  onChange={(e) => setConfig({ ...config, invitations: { ...config.invitations, autoInviteApproved: e.target.checked } })}
                />
                <span>
                  Invite every currently approved player when this tournament is created.
                  <span className="mt-1 block text-xs text-[#8A9A8D]">You can still invite more approved players later from Tournaments.</span>
                </span>
              </label>
            </Panel>
          )}

          {current === "Scheduling" && (
            <Panel title="Scheduling" kicker="Fixture generation settings">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Rounds">
                  <Select value={String(config.scheduling.rounds)} onValueChange={(v) => setConfig({ ...config, scheduling: { ...config.scheduling, rounds: Number(v) } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single</SelectItem>
                      <SelectItem value="2">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Weekend Label">
                  <Input className="bg-transparent" value={config.scheduling.labelTemplate} onChange={(e) => setConfig({ ...config, scheduling: { ...config.scheduling, labelTemplate: e.target.value } })} />
                </Field>
                <Field label="Pacing">
                  <Select value={config.scheduling.pacing} onValueChange={(v) => setConfig({ ...config, scheduling: { ...config.scheduling, pacing: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">Auto</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Panel>
          )}

          {current === "Review" && (
            <Panel title="Review" kicker="Ready to create">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {summaryRows.map(([label, value]) => (
                  <div key={label} className="rounded-md border border-[#243026] bg-[#0B0E0C] p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A9A8D]">{label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <div className="flex items-center justify-between rounded-lg border border-[#243026] bg-[#0E120F] p-4">
            <Button variant="outline" onClick={() => setCurrent(steps[Math.max(0, activeStepIndex - 1)])} disabled={activeStepIndex === 0}>Back</Button>
            <div className="flex items-center gap-2">
              {activeStepIndex < steps.length - 1 ? (
                <Button onClick={() => setCurrent(steps[Math.min(steps.length - 1, activeStepIndex + 1)])}>Next</Button>
              ) : (
                <Button onClick={createTournament} disabled={creating || !canCreate}>{creating ? "Creating..." : "Create Tournament"}</Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Panel({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#243026] bg-[#0E120F] p-4 sm:p-5">
      <div className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A9A8D]">{kicker}</div>
        <h2 className="mt-1 text-xl font-extrabold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-sm text-[#A7B2A2]">{label}</span>
      {children}
    </label>
  )
}

function Metric({ label, value, detail, warning = false }: { label: string; value: string | number; detail: string; warning?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${warning ? "border-amber-500/25 bg-amber-500/[0.06]" : "border-[#243026] bg-[#0B0E0C]"}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A9A8D]">{label}</div>
      <div className="mt-3 text-2xl font-extrabold tabular-nums text-white">{value}</div>
      <div className="mt-1 text-xs text-[#A7B2A2]">{detail}</div>
    </div>
  )
}
