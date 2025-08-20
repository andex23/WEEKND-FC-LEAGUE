import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"

// Mock upcoming fixtures for the logged-in player
const mockUpcomingFixtures = [
  {
    id: "1",
    matchday: 3,
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    homePlayer: "John Doe",
    awayPlayer: "Mike Johnson",
    opponent: "Mike Johnson",
    opponentTeam: "Liverpool",
    isHome: true,
    scheduledDate: new Date("2024-01-20T19:00:00"),
  },
  {
    id: "2",
    matchday: 4,
    homeTeam: "Chelsea",
    awayTeam: "Arsenal",
    homePlayer: "Jane Smith",
    awayPlayer: "John Doe",
    opponent: "Jane Smith",
    opponentTeam: "Chelsea",
    isHome: false,
    scheduledDate: new Date("2024-01-27T20:00:00"),
  },
]

export function NextMatches() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Next Matches
        </CardTitle>
        <CardDescription>Your upcoming fixtures in the league</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockUpcomingFixtures.map((fixture) => (
            <div key={fixture.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline">Matchday {fixture.matchday}</Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {fixture.scheduledDate.toLocaleDateString()} at{" "}
                  {fixture.scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className={`text-center ${fixture.isHome ? "font-semibold" : ""}`}>
                  <div className="text-lg">{fixture.homeTeam}</div>
                  <div className="text-sm text-muted-foreground">{fixture.homePlayer}</div>
                  {fixture.isHome && (
                    <Badge variant="secondary" className="mt-1">
                      HOME
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-muted-foreground">VS</div>
                <div className={`text-center ${!fixture.isHome ? "font-semibold" : ""}`}>
                  <div className="text-lg">{fixture.awayTeam}</div>
                  <div className="text-sm text-muted-foreground">{fixture.awayPlayer}</div>
                  {!fixture.isHome && (
                    <Badge variant="secondary" className="mt-1">
                      AWAY
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
