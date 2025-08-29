import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Trophy, TrendingUp } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"

export function OverviewTab() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    status: "DRAFT",
    startDate: new Date(),
    endDate: new Date(),
    totalFixtures: 0,
    completedFixtures: 0,
  });
  const [consoleData, setConsoleData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/stats").then(x => x.json());
        const tournaments = await fetch("/api/admin/tournaments").then(x => x.json());
        const latestTournament = tournaments[0] || {};
        const f = await fetch(`/api/fixtures?tournamentId=${latestTournament.id}`).then(x => x.json());
        const playersRes = await fetch("/api/admin/players").then(x => x.json());
        const players = playersRes.players || [];

        // Compute console distribution
        const consoleCounts = players.reduce((acc, p) => {
          acc[p.console] = (acc[p.console] || 0) + 1;
          return acc;
        }, {});
        const consoleArray = Object.entries(consoleCounts).map(([name, value], index) => ({
          name,
          value,
          color: `hsl(var(--chart-${index + 1}))`,
        }));

        setStats({
          totalPlayers: players.length,
          status: latestTournament.status || "DRAFT",
          startDate: new Date(latestTournament.start_at || Date.now()),
          endDate: new Date(latestTournament.end_at || Date.now()),
          totalFixtures: f.totalFixtures || 0,
          completedFixtures: f.fixtures.filter(fixt => fixt.status === "COMPLETE").length,
        });
        setConsoleData(consoleArray);
      } catch {}
    })();
  }, []);

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
          <ChartContainer
            config={consoleData.reduce((acc, item, index) => {
              acc[item.name.toLowerCase()] = { label: item.name, color: item.color };
              return acc;
            }, {})}
            className="h-[300px]"
          >
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
                >
                  {consoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
