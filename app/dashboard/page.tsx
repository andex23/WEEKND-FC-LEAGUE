"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function PlayerDashboard() {
  const [player, setPlayer] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [playerRes, standingRes, statsRes, fixturesRes, notificationsRes] = await Promise.all([
        fetch("/api/player/profile"),
        fetch("/api/player/standing"),
        fetch("/api/player/stats"),
        fetch("/api/player/fixtures?limit=2"),
        fetch("/api/player/notifications"),
      ])

      const playerData = await playerRes.json()
      const standingData = await standingRes.json()
      const statsData = await statsRes.json()
      const fixturesData = await fixturesRes.json()
      const notificationsData = await notificationsRes.json()

      setPlayer(playerData.player)
      setDashboardData({
        standing: standingData.standing,
        stats: statsData.stats,
        nextFixtures: fixturesData.fixtures || [],
        leagueTable: standingData.leagueTable || [],
      })
      setNotifications(notificationsData.notifications || [])
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!player || !dashboardData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">No player data available</div>
      </div>
    )
  }

  const standing = dashboardData.standing
  const nextMatch = dashboardData.nextFixtures[0]

  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl section-pad space-y-8">
        {/* Welcome strip */}
        <div className="flex items-center justify-between">
          <div className="text-gray-900 font-semibold">Hi, {player.name} — Matchday {nextMatch?.matchday ?? "-"}</div>
        </div>

        {/* Quick stat pills */}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 border rounded-md bg-white tabular-nums">#{standing?.position ?? "-"} Pos</span>
          <span className="px-3 py-1 border rounded-md bg-white tabular-nums">{standing?.points ?? 0} Pts</span>
          <span className="px-3 py-1 border rounded-md bg-white tabular-nums">
            {standing ? `${standing.wins ?? 0}–${standing.draws ?? 0}–${standing.losses ?? 0}` : "-"} Record
          </span>
          <span className="px-3 py-1 border rounded-md bg-white tabular-nums">
            {standing ? `${(standing.goals_for - standing.goals_against) > 0 ? "+" : ""}${standing.goals_for - standing.goals_against}` : "-"} GD
          </span>
        </div>

        {/* Next match card */}
        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between">
            {nextMatch ? (
              <div className="space-y-1">
                <div className="font-medium text-gray-900">{nextMatch.opponent_name}</div>
                <div className="text-sm text-gray-600">Matchday {nextMatch.matchday}</div>
                <div className="text-xs text-gray-500">{nextMatch.match_date}</div>
              </div>
            ) : (
              <div className="text-gray-600">No upcoming match</div>
            )}
            <div>
              {nextMatch && (
                <Button className="bg-primary hover:bg-primary/90">Report score</Button>
              )}
            </div>
          </div>
        </div>

        {/* Compact table preview + Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold text-gray-900">Table (Top 5)</div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Pos</th>
                    <th className="text-left px-3 py-2">Player</th>
                    <th className="text-right px-3 py-2">Pts</th>
                    <th className="text-right px-3 py-2">GD</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboardData.leagueTable || []).slice(0, 5).map((row: any) => (
                    <tr key={row.position} className={`border-t ${row.isCurrentPlayer ? "bg-purple-50" : ""}`}>
                      <td className="px-3 py-2 tabular-nums">{row.position}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.points}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {(row.goals_for - row.goals_against) > 0 ? "+" : ""}
                        {row.goals_for - row.goals_against}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-gray-900">Notifications</div>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 border rounded-md text-sm ${n.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex-1">{n.message}</p>
                    {!n.read && (
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => markAsRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <div className="text-sm text-gray-500">No notifications</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
