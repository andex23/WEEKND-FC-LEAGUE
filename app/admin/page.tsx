"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { FixturesTab } from "@/components/admin/fixtures-tab"
import { StandingsTab } from "@/components/admin/standings-tab"

export default function AdminDashboard() {
  const router = useRouter()
  const [section, setSection] = useState<"overview" | "registrations" | "fixtures" | "results" | "stats" | "messaging" | "settings" | "setup">(
    "overview",
  )

  const [players, setPlayers] = useState<any[]>([])
  const [standings, setStandings] = useState<any[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [leagueSettings, setLeagueSettings] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<any>(null)
  const [resultsQueue, setResultsQueue] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [regsRes, standingsRes, fixturesRes, statusRes, statsRes] = await Promise.all([
        fetch("/api/admin/registrations"),
        fetch("/api/standings"),
        fetch("/api/fixtures"),
        fetch("/api/league/status"),
        fetch("/api/player-stats"),
      ])

      const regsData = await regsRes.json()
      const standingsData = await standingsRes.json()
      const fixturesData = await fixturesRes.json()
      const statusData = await statusRes.json()
      const statsData = await statsRes.json()

      setPlayers(regsData.registrations || [])
      setStandings(standingsData.standings || [])
      setFixtures(fixturesData.fixtures || [])
      setLeagueSettings(statusData || {})
      setPlayerStats(statsData || null)

      try {
        const rq = await fetch("/api/admin/results")
        if (rq.ok) {
          const rqData = await rq.json()
          setResultsQueue(rqData.results || [])
        } else {
          setResultsQueue([])
        }
      } catch {
        setResultsQueue([])
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const pendingRegistrations = useMemo(
    () => players.filter((p) => (p.status || "pending").toLowerCase() === "pending"),
    [players],
  )
  const approvedPlayers = useMemo(
    () => players.filter((p) => (p.status || "pending").toLowerCase() === "approved"),
    [players],
  )

  const approvePlayer = async (playerId: string) => {
    try {
      const response = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "approve" }),
      })
      if (response.ok) fetchAllData()
    } catch (err) {
      console.error("Error approving player:", err)
    }
  }

  const rejectPlayer = async (playerId: string) => {
    try {
      const response = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "reject" }),
      })
      if (response.ok) fetchAllData()
    } catch (err) {
      console.error("Error rejecting player:", err)
    }
  }

  const bulkApproveAll = async () => {
    for (const p of pendingRegistrations) {
      // eslint-disable-next-line no-await-in-loop
      await approvePlayer(p.id)
    }
  }

  const approveAllReports = async () => {
    try {
      // Attempt backend endpoint if exists, otherwise fall back to local clear
      const res = await fetch("/api/admin/results/approve-all", { method: "POST" })
      if (!res.ok) throw new Error("fallback")
    } catch {
      setResultsQueue([])
    }
  }

  const generateAllFixtures = async () => {
    try {
      const response = await fetch("/api/admin/generate-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "double-round-robin" }),
      })

      if (response.ok) {
        const data = await response.json()
        setFixtures(data.fixtures)
      }
    } catch (err) {
      console.error("Error generating fixtures:", err)
    }
  }

  const groupedFixtures = useMemo(() => {
    const map: Record<string, any[]> = {}
    fixtures.forEach((fx) => {
      const key = `Matchday ${fx.matchday ?? "?"}`
      if (!map[key]) map[key] = []
      map[key].push(fx)
    })
    return map
  }, [fixtures])

  const matchesPlayed = useMemo(() => fixtures.filter((f) => (f.status || f.Status || f.status)?.toUpperCase?.() === "PLAYED").length, [fixtures])
  const matchesPendingApproval = useMemo(() => resultsQueue.filter((r) => (r.status || "").toUpperCase() !== "APPROVED").length, [resultsQueue])

  const goSetup = () => router.push("/admin/setup")

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading admin...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAllData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl section-pad">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900">Admin</h1>
            <p className="text-sm text-gray-500">Manage the Weekend FC League</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={goSetup}>Tournament Setup</Button>
        </div>

        <div className="flex gap-8">
          <aside className="w-56 shrink-0">
            <nav className="space-y-1">
              {[
                { key: "overview", label: "Overview" },
                { key: "registrations", label: "Registrations" },
                { key: "fixtures", label: "Fixtures" },
                { key: "results", label: "Reports" },
                { key: "stats", label: "Stats" },
                { key: "messaging", label: "Messaging" },
                { key: "settings", label: "Settings" },
                { key: "setup", label: "Setup" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => (item.key === "setup" ? goSetup() : setSection(item.key as any))}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    section === item.key ? "bg-purple-50 text-purple-800 border border-purple-200" : "hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="flex-1">
            {section === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">Registered Players</div>
                    <div className="text-2xl font-bold tabular-nums">{players.length}</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">Fixtures Created</div>
                    <div className="text-2xl font-bold tabular-nums">{fixtures.length}</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">Matches Played</div>
                    <div className="text-2xl font-bold tabular-nums">{matchesPlayed}</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">Pending Approval</div>
                    <div className="text-2xl font-bold tabular-nums">{matchesPendingApproval}</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-xs text-gray-600">League Status</div>
                    <div className="text-sm font-semibold">{leagueSettings?.status || "DRAFT"}</div>
                  </div>
                </div>

                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Tournament Setup Wizard</div>
                    <div className="text-xs text-gray-600">Configure basics, rules, and scheduling, then publish.</div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90" onClick={goSetup}>Open Wizard</Button>
                </div>
              </div>
            )}

            {section === "fixtures" && (
              <div className="space-y-6">
                <FixturesTab />
              </div>
            )}

            {section === "registrations" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Registrations</h2>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">{pendingRegistrations.length} pending</Badge>
                    <Button size="sm" variant="outline" onClick={async () => { await fetch("/api/admin/seed-demo-players", { method: "POST" }); fetchAllData() }}>Seed 8 Demo Players</Button>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2">Player</th>
                        <th className="text-left px-3 py-2">Console</th>
                        <th className="text-left px-3 py-2">Preferred Team</th>
                        <th className="text-left px-3 py-2">Registered</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-right px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2">{p.console || "—"}</td>
                          <td className="px-3 py-2">{p.preferred_team || p.preferred_club || "—"}</td>
                          <td className="px-3 py-2 text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                          <td className="px-3 py-2">{p.status || "pending"}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => { await fetch("/api/admin/approve-registration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: p.id, action: "approve" }) }); fetchAllData() }}>Approve</Button>
                              <Button size="sm" variant="outline" onClick={async () => { await fetch("/api/admin/approve-registration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: p.id, action: "reject" }) }); fetchAllData() }}>Reject</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {section === "results" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Result Reports</h2>
                  <Button variant="outline" disabled={resultsQueue.length === 0}>Approve All Reports</Button>
                </div>

                {resultsQueue.length === 0 ? (
                  <div className="p-4 border rounded-md text-sm text-gray-500">No results pending review</div>
                ) : (
                  <div className="space-y-4">
                    {resultsQueue.map((r) => (
                      <div key={r.id} className="p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{r.homePlayer} {r.homeScore} - {r.awayScore} {r.awayPlayer}</div>
                          <div>
                            <span className="px-2 py-0.5 text-xs rounded border bg-amber-50 border-amber-200 text-amber-800">{r.status || "Pending"}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mb-3">Submitted by {r.submittedBy}</div>
                        <div className="flex items-center gap-3 justify-between">
                          <div className="text-sm text-gray-600">Reason: {r.reason || "Awaiting opponent confirmation"}</div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                            <Button size="sm" variant="outline">Override</Button>
                            <Button size="sm" variant="outline">Flag/Dispute</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "stats" && (
              <div className="space-y-6">
                <StandingsTab />
              </div>
            )}

            {section === "messaging" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Messaging / Announcements</h2>
                <div className="border rounded-md p-4">
                  <Label className="text-sm">Global broadcast</Label>
                  <Input placeholder="Write a league-wide announcement (sent to dashboards)" className="mt-2" />
                  <div className="flex justify-end mt-3">
                    <Button className="bg-primary hover:bg-primary/90">Send Broadcast</Button>
                  </div>
                </div>
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm">Player</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose player" />
                        </SelectTrigger>
                        <SelectContent>
                          {players.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm">Message</Label>
                      <Input placeholder="Direct message (for disputes/clarifications)" className="mt-2" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button className="bg-primary hover:bg-primary/90">Send Message</Button>
                  </div>
                </div>
              </div>
            )}

            {section === "settings" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>League Name</Label>
                    <Input type="text" defaultValue={leagueSettings?.name || "Weekend FC League"} />
                  </div>
                  <div className="space-y-2">
                    <Label>League Status</Label>
                    <Select defaultValue={leagueSettings?.status || "DRAFT"}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETE">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Allow late reports</Label>
                    <Select defaultValue="no">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Self-report deadline (hours)</Label>
                    <Input type="number" defaultValue={24} min={1} max={72} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-primary hover:bg-primary/90">Save</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
