import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp } from "lucide-react"

interface MyStandingCardProps {
  standing: {
    position: number
    points: number
    goal_difference: number
    wins: number
    draws: number
    losses: number
    total_players: number
  } | null
}

export function MyStandingCard({ standing }: MyStandingCardProps) {
  if (!standing) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-purple-600" />
            My Standing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No standings data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressToNext =
    standing.position > 1 ? ((standing.total_players - standing.position + 1) / standing.total_players) * 100 : 100

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-purple-600" />
          My Standing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold tabular-nums">#{standing.position}</div>
            <div className="text-sm text-gray-600">League Position</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{standing.points}</div>
            <div className="text-sm text-gray-600">Points</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold tabular-nums text-green-600">{standing.wins}</div>
            <div className="text-xs text-gray-600">W</div>
          </div>
          <div>
            <div className="text-lg font-semibold tabular-nums text-yellow-600">{standing.draws}</div>
            <div className="text-xs text-gray-600">D</div>
          </div>
          <div>
            <div className="text-lg font-semibold tabular-nums text-red-600">{standing.losses}</div>
            <div className="text-xs text-gray-600">L</div>
          </div>
          <div>
            <div
              className={`text-lg font-semibold tabular-nums ${standing.goal_difference >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {standing.goal_difference > 0 ? "+" : ""}
              {standing.goal_difference}
            </div>
            <div className="text-xs text-gray-600">GD</div>
          </div>
        </div>

        {standing.position > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress to next position</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
