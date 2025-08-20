import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import { SubmitResultDialog } from "./submit-result-dialog"

// Mock fixtures grouped by matchday
const mockMatchdayFixtures = [
  {
    matchday: 1,
    fixtures: [
      {
        id: "1",
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        homePlayer: "John Doe",
        awayPlayer: "Jane Smith",
        homeScore: 2,
        awayScore: 1,
        status: "PLAYED" as const,
        scheduledDate: new Date("2024-01-06T19:00:00"),
        isPlayerInvolved: true,
        isHome: true,
      },
      {
        id: "2",
        homeTeam: "Liverpool",
        awayTeam: "Man City",
        homePlayer: "Mike Johnson",
        awayPlayer: "Sarah Wilson",
        homeScore: 1,
        awayScore: 1,
        status: "PLAYED" as const,
        scheduledDate: new Date("2024-01-06T20:00:00"),
        isPlayerInvolved: false,
        isHome: false,
      },
    ],
  },
  {
    matchday: 2,
    fixtures: [
      {
        id: "3",
        homeTeam: "Chelsea",
        awayTeam: "Liverpool",
        homePlayer: "Jane Smith",
        awayPlayer: "Mike Johnson",
        homeScore: null,
        awayScore: null,
        status: "SCHEDULED" as const,
        scheduledDate: new Date("2024-01-13T19:00:00"),
        isPlayerInvolved: false,
        isHome: false,
      },
      {
        id: "4",
        homeTeam: "Man City",
        awayTeam: "Arsenal",
        homePlayer: "Sarah Wilson",
        awayPlayer: "John Doe",
        homeScore: null,
        awayScore: null,
        status: "SCHEDULED" as const,
        scheduledDate: new Date("2024-01-13T20:00:00"),
        isPlayerInvolved: true,
        isHome: false,
      },
    ],
  },
]

export function MatchdayTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Matchday Timeline
        </CardTitle>
        <CardDescription>All fixtures organized by matchday</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {mockMatchdayFixtures.map((matchday) => (
            <AccordionItem key={matchday.matchday} value={`matchday-${matchday.matchday}`}>
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Matchday {matchday.matchday}</Badge>
                  <span className="text-sm text-muted-foreground">{matchday.fixtures.length} fixtures</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {matchday.fixtures.map((fixture) => (
                    <div
                      key={fixture.id}
                      className={`border rounded-lg p-4 ${fixture.isPlayerInvolved ? "bg-accent/5 border-accent/20" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {fixture.scheduledDate.toLocaleDateString()} at{" "}
                          {fixture.scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={fixture.status === "PLAYED" ? "default" : "secondary"}>
                            {fixture.status}
                          </Badge>
                          {fixture.isPlayerInvolved && <Badge variant="outline">Your Match</Badge>}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <div className="font-semibold">{fixture.homeTeam}</div>
                          <div className="text-sm text-muted-foreground">{fixture.homePlayer}</div>
                        </div>

                        <div className="text-center">
                          {fixture.status === "PLAYED" ? (
                            <div className="text-2xl font-bold">
                              {fixture.homeScore} - {fixture.awayScore}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-muted-foreground">VS</div>
                          )}
                        </div>

                        <div className="text-center">
                          <div className="font-semibold">{fixture.awayTeam}</div>
                          <div className="text-sm text-muted-foreground">{fixture.awayPlayer}</div>
                        </div>
                      </div>

                      {fixture.isPlayerInvolved && fixture.status === "SCHEDULED" && (
                        <div className="mt-4 flex justify-center">
                          <SubmitResultDialog
                            fixture={{
                              id: fixture.id,
                              matchday: matchday.matchday,
                              homeTeam: fixture.homeTeam,
                              awayTeam: fixture.awayTeam,
                              homePlayer: fixture.homePlayer,
                              awayPlayer: fixture.awayPlayer,
                              isHome: fixture.isHome,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
