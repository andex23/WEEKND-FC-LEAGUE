"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminDashboard() {
  const [section, setSection] = useState<"registrations" | "fixtures" | "results" | "stats" | "settings">(
    "registrations",
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
      const [playersRes, standingsRes, fixturesRes, settingsRes, statsRes] = await Promise.all([
        fetch("/api/admin/players"),
        fetch("/api/standings"),
        fetch("/api/fixtures"),
        fetch("/api/league/settings"),
        fetch("/api/player-stats"),
      ])

      const playersData = await playersRes.json()
      const standingsData = await standingsRes.json()
      const fixturesData = await fixturesRes.json()
      const settingsData = await settingsRes.json()
      const statsData = await statsRes.json()

      setPlayers(playersData.players || [])
      setStandings(standingsData.standings || [])
      setFixtures(fixturesData.fixtures || [])
      setLeagueSettings(settingsData.settings || {})
      setPlayerStats(statsData || null)

      // Optional: fetch results queue if backend exists
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
    () => players.filter((p) => p.status === "pending"),
    [players],
  )
  const approvedPlayers = useMemo(
    () => players.filter((p) => p.status === "approved"),
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
        <div className="mb-6">
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900">Admin</h1>
          <p className="text-sm text-gray-500">Manage the Weeknd FC League</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-56 shrink-0">
            <nav className="space-y-1">
              {[
                { key: "registrations", label: "Registrations" },
                { key: "fixtures", label: "Fixtures" },
                { key: "results", label: "Results" },
                { key: "stats", label: "Stats" },
                { key: "settings", label: "Settings" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key as any)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    section === item.key ? "bg-purple-50 text-purple-800 border border-purple-200" : "hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <section className="flex-1">
            {section === "registrations" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Registrations</h2>
                  <Badge className="bg-purple-100 text-purple-800">
                    {pendingRegistrations.length} pending
                  </Badge>
                </div>

                <div className="border rounded-md divide-y">
                  {pendingRegistrations.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No pending registrations</div>
                  ) : (
                    pendingRegistrations.map((player) => (
                      <div key={player.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            {player.psn_name} • {player.console} • {player.preferred_club}
                          </div>
                          <div className="text-xs text-gray-500">{player.location}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approvePlayer(player.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectPlayer(player.id)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {section === "fixtures" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Fixtures</h2>
                  <Button className="bg-primary hover:bg-primary/90" onClick={generateAllFixtures} disabled={approvedPlayers.length < 2}>
                    Generate Fixtures
                  </Button>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedFixtures).length === 0 && (
                    <div className="p-4 border rounded-md text-sm text-gray-500">No fixtures yet. Admin will generate the schedule soon.</div>
                  )}

                  {Object.entries(groupedFixtures).map(([matchday, items]) => (
                    <div key={matchday} className="border rounded-md">
                      <div className="px-4 py-2 border-b bg-gray-50 text-sm font-medium">{matchday}</div>
                      <div className="divide-y">
                        {items.map((fx) => (
                          <div key={fx.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-4">
                              <div className="font-medium">{fx.homePlayer} vs {fx.awayPlayer}</div>
                              <div className="text-xs text-gray-600">{fx.homeTeam} vs {fx.awayTeam}</div>
                            </div>
                            <div className="md:col-span-3 text-sm text-gray-600">
                              {fx.date} {fx.time}
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                              <Input placeholder="H" defaultValue={fx.homeScore ?? ""} className="w-16" />
                              <span className="text-gray-500">-</span>
                              <Input placeholder="A" defaultValue={fx.awayScore ?? ""} className="w-16" />
                            </div>
                            <div className="md:col-span-2">
                              <Select defaultValue={fx.status ?? "scheduled"}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-1">
                              <Select defaultValue={"sat"}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Weekend" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sat">Saturday</SelectItem>
                                  <SelectItem value="sun">Sunday</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "results" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Results Queue</h2>
                </div>

                {resultsQueue.length === 0 ? (
                  <div className="p-4 border rounded-md text-sm text-gray-500">No results pending review</div>
                ) : (
                  <div className="space-y-4">
                    {resultsQueue.map((r) => (
                      <div key={r.id} className="p-4 border rounded-md flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-medium">{r.homePlayer} {r.homeScore} - {r.awayScore} {r.awayPlayer}</div>
                          <div className="text-xs text-gray-600">Submitted by {r.submittedBy}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {r.screenshot && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.screenshot} alt="screenshot" className="h-10 w-16 object-cover rounded border" />
                          )}
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                          <Button size="sm" variant="outline">Override</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "stats" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Leaderboards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Scorers</h3>
                    <div className="border rounded-md divide-y">
                      {playerStats?.topScorers?.slice(0, 10).map((s: any) => (
                        <div key={`${s.rank}-${s.name}`} className="px-3 py-2 text-sm flex items-center justify-between">
                          <span className="tabular-nums w-6 text-gray-500">{s.rank}</span>
                          <span className="flex-1 px-2">{s.name}</span>
                          <span className="tabular-nums font-semibold">{s.goals}</span>
                        </div>
                      ))}
                      {!playerStats?.topScorers?.length && (
                        <div className="px-3 py-3 text-sm text-gray-500">No data</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Assists</h3>
                    <div className="border rounded-md divide-y">
                      {playerStats?.topAssists?.slice(0, 10).map((a: any, idx: number) => (
                        <div key={`${idx}-${a.name}`} className="px-3 py-2 text-sm flex items-center justify-between">
                          <span className="tabular-nums w-6 text-gray-500">{a.rank}</span>
                          <span className="flex-1 px-2">{a.name}</span>
                          <span className="tabular-nums font-semibold">{a.assists}</span>
                        </div>
                      ))}
                      {!playerStats?.topAssists?.length && (
                        <div className="px-3 py-3 text-sm text-gray-500">No data</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Discipline</h3>
                    <div className="border rounded-md divide-y">
                      {playerStats?.discipline?.slice(0, 10).map((d: any, idx: number) => (
                        <div key={`${idx}-${d.name}`} className="px-3 py-2 text-sm flex items-center justify-between">
                          <span className="flex-1">{d.name}</span>
                          <div className="flex items-center gap-2 tabular-nums">
                            {d.yellow_cards > 0 && (
                              <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">{d.yellow_cards} 🟨</span>
                            )}
                            {d.red_cards > 0 && (
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-medium">{d.red_cards} 🟥</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {!playerStats?.discipline?.length && (
                        <div className="px-3 py-3 text-sm text-gray-500">No data</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === "settings" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label>Season Start</Label>
                    <Input type="date" defaultValue={leagueSettings?.start_date} />
                  </div>
                  <div className="space-y-2">
                    <Label>Season End</Label>
                    <Input type="date" defaultValue={leagueSettings?.end_date} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rounds</Label>
                    <Input type="number" defaultValue={leagueSettings?.rounds || 2} min={1} max={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Matchdays per Weekend</Label>
                    <Input type="number" defaultValue={leagueSettings?.matchdays_per_weekend || 1} min={1} max={3} />
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
