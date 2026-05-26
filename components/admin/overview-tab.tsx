import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Trophy, TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useState, useEffect } from "react"

type ConsoleSlice = { name: string; value: number; color: string }

// Distinct slice colours for the console-distribution pie chart.
const SLICE_COLORS = ["#10b981", "#f5c54a", "#3b82f6", "#ef4444", "#a855f7"]

export function OverviewTab() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    status: "DRAFT",
    startDate: new Date(),
    endDate: new Date(),
    totalFixtures: 0,
    completedFixtures: 0,
  })
  const [consoleData, setConsoleData] = useState<ConsoleSlice[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const tournamentsRes = await fetch("/api/admin/tournaments").then((x) => x.json())
        const tournaments: any[] = Array.isArray(tournamentsRes)
          ? tournamentsRes
          : tournamentsRes?.tournaments || []
        const latestTournament = tournaments[0] || {}
        const f = await fetch(`/api/fixtures?tournamentId=${latestTournament.id ?? ""}`).then((x) =>
          x.json(),
        )
        const fixtures: any[] = f?.fixtures || []
        const playersRes = await fetch("/api/admin/players").then((x) => x.json())
        const players: any[] = playersRes?.players || []

        // Console distribution across registered players.
        const counts = new Map<string, number>()
        for (const p of players) {
          const key = p.console || "Unknown"
          counts.set(key, (counts.get(key) || 0) + 1)
        }
        const slices: ConsoleSlice[] = Array.from(counts.entries()).map(([name, value], i) => ({
          name,
          value,
          color: SLICE_COLORS[i % SLICE_COLORS.length],
        }))

        setStats({
          totalPlayers: players.length,
          status: latestTournament.status || "DRAFT",
          startDate: new Date(latestTournament.start_at || Date.now()),
          endDate: new Date(latestTournament.end_at || Date.now()),
          totalFixtures: f?.totalFixtures || fixtures.length,
          completedFixtures: fixtures.filter((fx) => fx.status === "PLAYED").length,
        })
        setConsoleData(slices)
      } catch {
        // Keep the placeholder stats if anything fails.
      }
    })()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary"
      case "ACTIVE":
        return "default"
      case "COMPLETE":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      {/* League Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">of 20 maximum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">League Status</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusColor(stats.status)} className="text-sm">
              {stats.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Current phase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Start Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.startDate.toLocaleDateString()}</div>
            <p className="text-xs text-muted-foreground">League begins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedFixtures}/{stats.totalFixtures}
            </div>
            <p className="text-xs text-muted-foreground">Fixtures completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Console Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Console Distribution</CardTitle>
          <CardDescription>Breakdown of players by gaming platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {consoleData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No player data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {consoleData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
