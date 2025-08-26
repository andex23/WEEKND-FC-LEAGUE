"use client"

import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function SettingsPage() {
  const [tab, setTab] = useState("tournament")
  const [data, setData] = useState<any>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => { const res = await fetch("/api/admin/settings"); setData(await res.json()) })() }, [])

  const seasonChip = useMemo(() => {
    const name = data?.branding?.league_name || "Weekend FC"
    const status = (data?.tournament?.status || "DRAFT").toUpperCase()
    return `${name} (${status})`
  }, [data])

  const update = (section: string, patch: any) => { setData((prev: any) => ({ ...prev, [section]: { ...prev[section], ...patch } })); setDirty(true) }

  const save = async (section: string) => { setSaving(true); await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, data: (data as any)[section] }) }); setSaving(false); setDirty(false) }
  const discard = () => { window.location.reload() }

  if (!data) return <div className="p-8 text-gray-600">Loading settings…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-extrabold">Settings</h2>
          <div className="text-sm text-gray-500">Season: <span className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-800 border border-purple-200">{seasonChip}</span></div>
        </div>
      </div>

      {dirty && (
        <div className="sticky top-0 z-10 border rounded-md p-2 bg-amber-50 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={discard}>Discard</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => save(tab)} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
              <TabsTrigger value="tournament">Tournament</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="rules">Rules & Policies</TabsTrigger>
              <TabsTrigger value="season">Season Management</TabsTrigger>
              <TabsTrigger value="export">Data & Export</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="tournament" className="space-y-6 mt-4">
              <div className="border rounded-md p-4">
                <div className="text-sm font-semibold mb-3">Basics</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Season Name</label>
                    <Input className="mt-1" value={data.tournament.name} onChange={(e) => update("tournament", { name: e.target.value, slug: (e.target.value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })} />
                  </div>
                  <div>
                    <label className="text-sm">Season Key/Slug</label>
                    <Input className="mt-1" value={data.tournament.slug} onChange={(e) => update("tournament", { slug: e.target.value })} />
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
                  <div>
                    <label className="text-sm">Format</label>
                    <Select value={data.tournament.format} onValueChange={(v) => update("tournament", { format: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single Round Robin</SelectItem>
                        <SelectItem value="DOUBLE">Double Round Robin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm">Allowed Consoles</label>
                    <Input className="mt-1" value={(data.tournament.allowed_consoles || []).join(", ")} onChange={(e) => update("tournament", { allowed_consoles: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                  </div>
                  <div>
                    <label className="text-sm">Clubs Mode</label>
                    <Select value={String(!!data.tournament.clubs_only)} onValueChange={(v) => update("tournament", { clubs_only: v === "true" })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Off</SelectItem>
                        <SelectItem value="true">On</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm">Match Length (min halves)</label>
                    <Select value={String(data.tournament.match_length)} onValueChange={(v) => update("tournament", { match_length: Number(v) })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[6,8,10].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm">Max Players</label>
                    <Input className="mt-1" type="number" value={data.tournament.max_players ?? ""} onChange={(e) => update("tournament", { max_players: e.target.value === "" ? null : Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-sm">Registration Window Start</label>
                    <Input className="mt-1" type="datetime-local" value={data.tournament.reg_start_at || ""} onChange={(e) => update("tournament", { reg_start_at: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm">Registration Window End</label>
                    <Input className="mt-1" type="datetime-local" value={data.tournament.reg_end_at || ""} onChange={(e) => update("tournament", { reg_end_at: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="text-sm font-semibold mb-3">Scheduling Defaults</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Matchdays (comma list)</label>
                    <Input className="mt-1" value={(data.tournament.matchdays || []).join(", ")} onChange={(e) => update("tournament", { matchdays: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                  </div>
                  <div>
                    <label className="text-sm">Default Kickoff Slots (comma times)</label>
                    <Input className="mt-1" value={(data.tournament.kickoff_slots || []).join(", ")} onChange={(e) => update("tournament", { kickoff_slots: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                  </div>
                  <div>
                    <label className="text-sm">Timezone</label>
                    <Input className="mt-1" value={data.tournament.timezone} onChange={(e) => update("tournament", { timezone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm">Options</label>
                    <Input className="mt-1" value={JSON.stringify(data.tournament.options || {})} onChange={(e) => { try { update("tournament", { options: JSON.parse(e.target.value || "{}") }) } catch {} }} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline">Auto-Generate Fixtures</Button>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="text-sm font-semibold mb-3">Tiebreakers</div>
                <Input value={(data.tournament.tiebreakers || []).join(" → ")} onChange={(e) => update("tournament", { tiebreakers: e.target.value.split("→").map((x) => x.trim()).filter(Boolean) })} />
              </div>

              <div className="border rounded-md p-4">
                <div className="text-sm font-semibold mb-3">Disconnect & Forfeit Rules</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">DC Threshold Minutes</label>
                    <Input className="mt-1" type="number" value={data.tournament.dc_threshold} onChange={(e) => update("tournament", { dc_threshold: Number(e.target.value || 0) })} />
                  </div>
                  <div>
                    <label className="text-sm">Forfeit Default</label>
                    <Select value={data.tournament.forfeit_default} onValueChange={(v) => update("tournament", { forfeit_default: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3-0">3–0 default</SelectItem>
                        <SelectItem value="manual">Enter manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={discard}>Reset to Draft</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => save("tournament")}>Save Draft</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => save("tournament")}>Publish</Button>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="mt-4">
              <div className="border rounded-md p-4">Branding (MVP placeholder)</div>
            </TabsContent>
            <TabsContent value="integrations" className="mt-4">
              <div className="border rounded-md p-4">Integrations (MVP placeholder)</div>
            </TabsContent>
            <TabsContent value="permissions" className="mt-4">
              <div className="border rounded-md p-4">Permissions (MVP placeholder)</div>
            </TabsContent>
            <TabsContent value="rules" className="mt-4">
              <div className="border rounded-md p-4">Rules & Policies (MVP placeholder)</div>
            </TabsContent>
            <TabsContent value="season" className="mt-4">
              <div className="border rounded-md p-4">Season Management (MVP placeholder)</div>
            </TabsContent>
            <TabsContent value="export" className="mt-4">
              <div className="border rounded-md p-4">Data & Export (MVP placeholder)</div>
            </TabsContent>
            <TabsContent value="advanced" className="mt-4">
              <div className="border rounded-md p-4">Advanced (MVP placeholder)</div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="lg:col-span-3">
          <div className="border rounded-md p-4 sticky top-4">
            <div className="text-sm font-semibold mb-2">Help</div>
            <div className="text-xs text-gray-600">Contextual tips for the selected tab. Draft locks fixtures from showing publicly. Publishing reveals schedule to players.</div>
            <div className="mt-2 text-xs"><a className="underline" href={data.branding.rules_url || "#"} target="_blank">Rules PDF</a> · <a className="underline" href={data.branding.discord_invite_url || "#"} target="_blank">Discord</a></div>
          </div>
        </div>
      </div>
    </div>
  )
}
