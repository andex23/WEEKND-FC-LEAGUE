"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Trophy, Calendar, BarChart3, User, X, Check } from "lucide-react"
import { useState, useEffect } from "react"

export default function PlayerDashboard() {
  const [player, setPlayer] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        recentResults: fixturesData.recentResults || [],
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

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
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
        <div className="text-center">
          <p className="text-gray-600">No player data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Weeknd FC</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                  {notifications.filter((n) => !n.read).length}
                </Badge>
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 1: Overview */}
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {player.name}</h2>
              <p className="text-gray-600">Ready to dominate the pitch this weekend?</p>
            </CardContent>
          </Card>

          {/* Mini Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">#{dashboardData.standing?.position || "N/A"}</div>
                <div className="text-sm text-gray-600">League Position</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardData.standing?.points || 0}</div>
                <div className="text-sm text-gray-600">Points</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.standing?.wins || 0}–{dashboardData.standing?.draws || 0}–
                  {dashboardData.standing?.losses || 0}
                </div>
                <div className="text-sm text-gray-600">Record (W–D–L)</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData.standing
                    ? `+${dashboardData.standing.goals_for - dashboardData.standing.goals_against}`
                    : "0"}
                </div>
                <div className="text-sm text-gray-600">Goal Difference</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 2: Next Match */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.nextFixtures[0] ? (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">{dashboardData.nextFixtures[0].opponent_name}</div>
                      <div className="text-sm text-gray-600">
                        Playing as {dashboardData.nextFixtures[0].opponent_team}
                      </div>
                    </div>
                    <Badge variant="outline">Matchday {dashboardData.nextFixtures[0].matchday}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={dashboardData.nextFixtures[0].status === "SCHEDULED" ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {dashboardData.nextFixtures[0].status}
                    </Badge>
                    <span className="text-sm text-gray-600">{dashboardData.nextFixtures[0].match_date}</span>
                  </div>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">Report Result</Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming matches</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: My Stats */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              My Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl">⚽</div>
                <div className="text-2xl font-bold">{dashboardData.stats?.goals || 0}</div>
                <div className="text-sm text-gray-600">Goals</div>
                {dashboardData.stats?.is_top_scorer && <Badge className="bg-yellow-500 text-xs">Leader</Badge>}
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl">🎯</div>
                <div className="text-2xl font-bold">{dashboardData.stats?.assists || 0}</div>
                <div className="text-sm text-gray-600">Assists</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl">🟨</div>
                <div className="text-2xl font-bold">{dashboardData.stats?.yellow_cards || 0}</div>
                <div className="text-sm text-gray-600">Yellows</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl">🟥</div>
                <div className="text-2xl font-bold">{dashboardData.stats?.red_cards || 0}</div>
                <div className="text-sm text-gray-600">Reds</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: League Table (Compact) */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              League Table
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-purple-600">
              View Full Table →
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {dashboardData.leagueTable.slice(0, 6).map((row) => (
                <div
                  key={row.position}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
                    row.isCurrentPlayer ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium w-6">{row.position}</span>
                    <span className="flex-1">{row.name}</span>
                    <span className="text-gray-600 text-xs">{row.team}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span>{row.points} pts</span>
                    <span className="text-gray-500">
                      {row.goals_for - row.goals_against > 0 ? "+" : ""}
                      {row.goals_for - row.goals_against}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Notifications */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {notifications.filter((n) => !n.read).length > 0 && (
                <Badge className="bg-red-500 text-xs">{notifications.filter((n) => !n.read).length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border text-sm transition-colors ${
                    !notification.read ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex-1">{notification.message}</p>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
