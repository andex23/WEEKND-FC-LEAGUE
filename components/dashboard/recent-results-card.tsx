import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"

interface RecentResultsCardProps {
  results: Array<{
    id: string
    matchday: number
    home_team: string
    away_team: string
    home_score: number
    away_score: number
    is_home: boolean
    result: "W" | "D" | "L"
  }> | null
}

export function RecentResultsCard({ results }: RecentResultsCardProps) {
  if (!results || results.length === 0) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-purple-600" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recent results</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-purple-600" />
          Recent Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.slice(0, 5).map((result) => (
          <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">Matchday {result.matchday}</div>
              <div className="text-sm text-gray-600">
                {result.home_team} vs {result.away_team}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-mono">
                {result.home_score} - {result.away_score}
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  result.result === "W" ? "bg-green-500" : result.result === "D" ? "bg-yellow-500" : "bg-red-500"
                }`}
              >
                {result.result}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
