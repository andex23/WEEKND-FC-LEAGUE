import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target } from "lucide-react"

interface MyStatsCardProps {
  stats: {
    goals: number
    assists: number
    yellow_cards: number
    red_cards: number
    is_top_scorer: boolean
    is_top_assister: boolean
  } | null
}

export function MyStatsCard({ stats }: MyStatsCardProps) {
  if (!stats) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-purple-600" />
            My Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No stats available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-purple-600" />
          My Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold tabular-nums text-green-600">{stats.goals}</div>
            <div className="text-sm text-gray-600">Goals</div>
            {stats.is_top_scorer && (
              <Badge variant="secondary" className="mt-1 text-xs">
                🥇 Top Scorer
              </Badge>
            )}
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold tabular-nums text-blue-600">{stats.assists}</div>
            <div className="text-sm text-gray-600">Assists</div>
            {stats.is_top_assister && (
              <Badge variant="secondary" className="mt-1 text-xs">
                🥇 Top Assists
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold tabular-nums text-yellow-600">{stats.yellow_cards}</div>
            <div className="text-sm text-gray-600">Yellow Cards</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold tabular-nums text-red-600">{stats.red_cards}</div>
            <div className="text-sm text-gray-600">Red Cards</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
