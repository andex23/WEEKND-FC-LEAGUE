import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Trophy, TrendingUp } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

// Mock data - will be replaced with real data
const leagueStats = {
  totalPlayers: 16,
  status: "DRAFT" as const,
  startDate: new Date("2024-01-15"),
  endDate: new Date("2024-03-15"),
  totalFixtures: 240,
  completedFixtures: 0,
}

const consoleData = [
  { name: "PS5", value: 8, color: "hsl(var(--chart-1))" },
  { name: "Xbox", value: 5, color: "hsl(var(--chart-2))" },
  { name: "PC", value: 3, color: "hsl(var(--chart-3))" },
]

export function OverviewTab() {
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
            <div className="text-2xl font-bold">{leagueStats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">of 20 maximum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">League Status</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusColor(leagueStats.status)} className="text-sm">
              {leagueStats.status}
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
            <div className="text-2xl font-bold">{leagueStats.startDate.toLocaleDateString()}</div>
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
              {leagueStats.completedFixtures}/{leagueStats.totalFixtures}
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
            config={{
              ps5: { label: "PS5", color: "hsl(var(--chart-1))" },
              xbox: { label: "Xbox", color: "hsl(var(--chart-2))" },
              pc: { label: "PC", color: "hsl(var(--chart-3))" },
            }}
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
