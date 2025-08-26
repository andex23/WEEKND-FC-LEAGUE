"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function SettingsPage() {
  const [tab, setTab] = useState("tournament")
  const [data, setData] = useState<any>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approvedCount, setApprovedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings")
      setData(await res.json())
      try {
        const regs = await fetch("/api/admin/registrations").then((r) => r.json())
        const count = (regs.registrations || []).filter((p: any) => String(p.status || "").toLowerCase() === "approved").length
        setApprovedCount(count)
      } catch {}
    })()
  }, [])

  const seasonChip = useMemo(() => {
    const name = data?.tournament?.name || data?.branding?.league_name || "Weekend FC"
    const status = (data?.tournament?.status || "DRAFT").toUpperCase()
    return `${name} (${status})`
  }, [data])

  const update = (section: string, patch: any) => { setData((prev: any) => ({ ...prev, [section]: { ...prev[section], ...patch } })); setDirty(true) }

  const save = async (section: string) => { setSaving(true); await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, data: (data as any)[section] }) }); setSaving(false); setDirty(false) }
  const discard = () => { window.location.reload() }

  const toggleMatchday = (day: string) => {
    const md = new Set<string>(data.tournament.matchdays || [])
    md.has(day) ? md.delete(day) : md.add(day)
    update("tournament", { matchdays: Array.from(md) })
  }

  const syncRoster = () => { update("tournament", { roster_count: approvedCount }) }

  const markCompleted = () => { if (!confirm("Mark tournament as Completed? This locks edits.")) return; update("tournament", { status: "COMPLETED" }); save("tournament") }
  const deleteTournament = () => {
    const st = (data.tournament.status || "DRAFT").toUpperCase()
    if (!(st === "DRAFT" || st === "COMPLETED")) { alert("You can only delete when Draft or Completed."); return }
    if (!confirm("Delete tournament? This cannot be undone.")) return
    update("tournament", { name: "", slug: "", status: "DRAFT", matchdays: [], match_length: 8, roster_count: 0 })
    save("tournament")
  }

  const syncRosterFromPlayers = async () => {
    try {
      const tid = (data?.tournament?.id || "") as string
      if (!tid) { alert("No tournament id"); return }
      const res = await fetch("/api/admin/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync_roster", id: tid }) })
      const out = await res.json()
      alert(`Roster synced: ${out.count} players now in roster`)
    } catch {}
  }

  const uploadLogo = async (f: File) => {
    const reader = new FileReader()
    reader.onload = () => { update("branding", { logo_url: String(reader.result || "") }) }
    reader.readAsDataURL(f)
  }

  const testDiscord = async () => {
    // Simulate send; in real system we'd POST to webhook
    alert(data.integrations.discord_webhook_url ? "Test message sent (simulated)." : "Add a webhook URL first.")
  }

  const exportFixturesCsv = async () => {
    const r = await fetch("/api/fixtures").then((x) => x.json())
    const fixtures = r.fixtures || []
    const rows = [["id","matchday","home","away","status","date"], ...fixtures.map((f: any) => [f.id,f.matchday,f.homePlayer||f.home_team,f.awayPlayer||f.away_team,f.status,f.scheduledDate || f.kickoff_at || ""]) ]
    const csv = rows.map((r: any[]) => r.map((c) => `"${String(c ?? "").replaceAll("\"","\"\"")}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const a=document.createElement("a"); a.href=url; a.download="fixtures.csv"; a.click(); URL.revokeObjectURL(url)
  }

  const exportStandingsCsv = async () => {
    const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "export", table: "standings" }) })
    const txt = await res.text(); const url = URL.createObjectURL(new Blob([txt], { type: "text/csv" })); const a=document.createElement("a"); a.href=url; a.download="standings.csv"; a.click(); URL.revokeObjectURL(url)
  }

  const resetSeason = async () => { if (!confirm("Reset season? Clears stats & fixtures while keeping shell.")) return; alert("Reset simulated. Hook to backend as needed.") }

  if (!data) return <div className="p-8 text-[#9E9E9E]">Loading settings…</div>

  const isCompleted = String(data?.tournament?.status || "DRAFT").toUpperCase() === "COMPLETED"

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-extrabold">Settings</h2>
          <div className="text-sm text-[#9E9E9E]">Season: <span className="px-2 py-0.5 text-xs rounded bg-[#141414] border border-[#1E1E1E]">{seasonChip}</span></div>
        </div>
      </div>

      {dirty && (
        <div className="sticky top-0 z-10 border rounded-2xl p-2 bg-amber-900/20 text-amber-200 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={discard}>Discard</Button>
          <Button onClick={() => save(tab)} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-4 w-full bg-[#141414] border">
              <TabsTrigger value="tournament">Tournament</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="tournament" className="space-y-6 mt-4">
              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3">Tournament Settings</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Tournament Name</label>
                    <Input className="mt-1 bg-transparent" value={data.tournament.name || ""} onChange={(e) => update("tournament", { name: e.target.value })} disabled={isCompleted} />
                  </div>
                  <div>
                    <label className="text-sm">Status</label>
                    <Select value={data.tournament.status} onValueChange={(v) => update("tournament", { status: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">Matchdays</label>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={(data.tournament.matchdays || []).includes("Sat")} onChange={() => toggleMatchday("Sat")} disabled={isCompleted} /> Sat</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={(data.tournament.matchdays || []).includes("Sun")} onChange={() => toggleMatchday("Sun")} disabled={isCompleted} /> Sun</label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm">Match Length</label>
                    <Select value={String(data.tournament.match_length)} onValueChange={(v) => update("tournament", { match_length: Number(v) })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[6,8,10].map((n) => (<SelectItem key={n} value={String(n)}>{n} mins</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm">Roster</label>
                    <div className="mt-1 text-sm text-[#D1D1D1]">{approvedCount} Active Players</div>
                    <div className="mt-2"><Button variant="outline" onClick={syncRosterFromPlayers}>Sync Roster from Players</Button></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3 text-rose-300">Danger Zone</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={markCompleted} disabled={isCompleted}>Mark Tournament as Completed</Button>
                  <Button variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={deleteTournament}>Delete Tournament</Button>
                </div>
                {isCompleted && <div className="mt-2 text-xs text-[#9E9E9E]">Tournament is completed. Editing is locked.</div>}
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6 mt-4">
              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3">Branding</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="text-sm">League Logo</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) uploadLogo(f); e.currentTarget.value = "" }} />
                      {data.branding.logo_url && (<img src={data.branding.logo_url} alt="logo" className="h-10 w-10 rounded-full border" />)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm">Primary Color</label>
                    <input type="color" className="mt-1 h-10 w-16 p-0 border rounded" value={data.branding.accent_color || "#00C853"} onChange={(e) => update("branding", { accent_color: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm">Dark Mode</label>
                    <div className="mt-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.branding.dark_mode} onChange={(e) => update("branding", { dark_mode: e.target.checked })} /> Default to dark</label></div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3">Links</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Rules PDF URL</label>
                    <Input className="mt-1 bg-transparent" value={data.branding.rules_url || ""} onChange={(e) => update("branding", { rules_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm">Discord Invite URL</label>
                    <Input className="mt-1 bg-transparent" value={data.branding.discord_invite_url || ""} onChange={(e) => update("branding", { discord_invite_url: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => save("branding")}>Save</Button>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6 mt-4">
              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3">Discord</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="text-sm">Webhook URL</label>
                    <Input className="mt-1 bg-transparent" value={data.integrations.discord_webhook_url || ""} onChange={(e) => update("integrations", { discord_webhook_url: e.target.value })} />
                  </div>
                  <div>
                    <Button onClick={testDiscord}>Send Test Message</Button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3">Email</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">From Name</label>
                    <Input className="mt-1 bg-transparent" value={data.integrations.email_from_name || ""} onChange={(e) => update("integrations", { email_from_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm">From Address</label>
                    <Input className="mt-1 bg-transparent" value={data.integrations.email_from_address || ""} onChange={(e) => update("integrations", { email_from_address: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => save("integrations")}>Save</Button>
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-6 mt-4">
              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3">Export Data</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={exportFixturesCsv}>Export Fixtures CSV</Button>
                  <Button variant="outline" onClick={exportStandingsCsv}>Export Standings CSV</Button>
                </div>
              </div>
              <div className="rounded-2xl border p-4 bg-[#141414]">
                <div className="text-sm font-semibold mb-3 text-rose-300">Season Reset</div>
                <Button variant="outline" className="text-rose-400 border-rose-900 hover:bg-rose-900/20" onClick={resetSeason}>Reset Season</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-2xl border p-4 sticky top-4 bg-[#141414]">
            <div className="text-sm font-semibold mb-2">Help</div>
            <div className="text-xs text-[#9E9E9E]">Settings let you tweak basics and connect Discord/Email. You can sync roster from approved players and finish or delete a tournament here.</div>
            <div className="mt-2 text-xs"><a className="underline" href={data.branding.rules_url || "#"} target="_blank">Rules PDF</a> · <a className="underline" href={data.branding.discord_invite_url || "#"} target="_blank">Discord</a></div>
          </div>
        </div>
      </div>
    </div>
  )
}

