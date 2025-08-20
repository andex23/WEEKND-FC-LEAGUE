import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, ExternalLink } from "lucide-react"

// Mock top 6 standings
const mockTopStandings = [
  { position: 1, playerName: "Mike Johnson", team: "Liverpool", points: 15, played: 6 },
  { position: 2, playerName: "John Doe", team: "Arsenal", points: 13, played: 6 },
  { position: 3, playerName: "Sarah Wilson", team: "Man City", points: 12, played: 6 },
  { position: 4, playerName: "Jane Smith", team: "Chelsea", points: 10, played: 6 },
  { position: 5, playerName: "Tom Brown", team: "Newcastle", points: 8, played: 6 },
  { position: 6, playerName: "Lisa Davis", team: "Spurs", points: 7, played: 6 },
]

export function StandingsWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              League Standings
            </CardTitle>
            <CardDescription>Top 6 players in the league</CardDescription>
          </div>
          <Link href="/standings">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Table
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTopStandings.map((standing) => (
              <TableRow key={standing.position}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {standing.position === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    {standing.position}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{standing.playerName}</TableCell>
                <TableCell>{standing.team}</TableCell>
                <TableCell className="text-center">{standing.played}</TableCell>
                <TableCell className="text-center font-bold">{standing.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
