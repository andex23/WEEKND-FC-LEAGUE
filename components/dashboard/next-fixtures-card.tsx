"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { SubmitResultDialog } from "@/components/player/submit-result-dialog"

interface NextFixturesCardProps {
  fixtures: Array<{
    id: string
    matchday: number
    home_team: string
    away_team: string
    home_player: string
    away_player: string
    status: string
    scheduled_date: string
    is_home: boolean
  }> | null
  playerId: string
}

export function NextFixturesCard({ fixtures, playerId }: NextFixturesCardProps) {
  if (!fixtures || fixtures.length === 0) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-purple-600" />
            Next Fixtures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No upcoming fixtures</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-purple-600" />
          Next Fixtures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fixtures.slice(0, 3).map((fixture) => (
          <div key={fixture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">Matchday {fixture.matchday}</div>
              <div className="text-sm text-gray-600">
                {fixture.home_team} vs {fixture.away_team}
              </div>
              <div className="text-xs text-gray-500">
                {fixture.home_player} vs {fixture.away_player}
              </div>
            </div>
            {fixture.status === "SCHEDULED" && (
              <SubmitResultDialog
                fixture={{
                  id: fixture.id,
                  matchday: fixture.matchday,
                  homeTeam: fixture.home_team,
                  awayTeam: fixture.away_team,
                  homePlayer: fixture.home_player,
                  awayPlayer: fixture.away_player,
                  isHome: fixture.is_home,
                }}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
