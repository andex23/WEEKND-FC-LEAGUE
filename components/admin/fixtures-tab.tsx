"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Filter } from "lucide-react"

// Mock fixture data
const mockFixtures = [
  {
    id: "1",
    matchday: 1,
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    homePlayer: "John Doe",
    awayPlayer: "Jane Smith",
    homeScore: null,
    awayScore: null,
    status: "SCHEDULED" as const,
  },
  {
    id: "2",
    matchday: 1,
    homeTeam: "Liverpool",
    awayTeam: "Man City",
    homePlayer: "Mike Johnson",
    awayPlayer: "Sarah Wilson",
    homeScore: 2,
    awayScore: 1,
    status: "PLAYED" as const,
  },
]

export function FixturesTab() {
  const [fixtures, setFixtures] = useState(mockFixtures)
  const [filterMatchday, setFilterMatchday] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const handleScoreChange = (fixtureId: string, type: "home" | "away", value: string) => {
    const score = value === "" ? null : Number.parseInt(value)
    setFixtures((prev) =>
      prev.map((fixture) =>
        fixture.id === fixtureId ? { ...fixture, [type === "home" ? "homeScore" : "awayScore"]: score } : fixture,
      ),
    )
  }

  const handleSaveResult = (fixtureId: string) => {
    const fixture = fixtures.find((f) => f.id === fixtureId)
    if (fixture && fixture.homeScore !== null && fixture.awayScore !== null) {
      setFixtures((prev) => prev.map((f) => (f.id === fixtureId ? { ...f, status: "PLAYED" as const } : f)))
      // TODO: Update standings
      console.log("Saving result and updating standings...")
    }
  }

  const filteredFixtures = fixtures.filter((fixture) => {
    const matchdayMatch = filterMatchday === "all" || fixture.matchday.toString() === filterMatchday
    const statusMatch = filterStatus === "all" || fixture.status === filterStatus
    return matchdayMatch && statusMatch
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>League Fixtures</CardTitle>
              <CardDescription>Manage match results and update standings</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterMatchday} onValueChange={setFilterMatchday}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Matchday" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matchdays</SelectItem>
                  <SelectItem value="1">Matchday 1</SelectItem>
                  <SelectItem value="2">Matchday 2</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="PLAYED">Played</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matchday</TableHead>
                <TableHead>Home</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Away</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFixtures.map((fixture) => (
                <TableRow key={fixture.id}>
                  <TableCell>
                    <Badge variant="outline">MD {fixture.matchday}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{fixture.homeTeam}</div>
                      <div className="text-sm text-muted-foreground">{fixture.homePlayer}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        className="w-16"
                        value={fixture.homeScore ?? ""}
                        onChange={(e) => handleScoreChange(fixture.id, "home", e.target.value)}
                        disabled={fixture.status === "PLAYED"}
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        className="w-16"
                        value={fixture.awayScore ?? ""}
                        onChange={(e) => handleScoreChange(fixture.id, "away", e.target.value)}
                        disabled={fixture.status === "PLAYED"}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{fixture.awayTeam}</div>
                      <div className="text-sm text-muted-foreground">{fixture.awayPlayer}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={fixture.status === "PLAYED" ? "default" : "secondary"}>{fixture.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {fixture.status === "SCHEDULED" && (
                      <Button size="sm" onClick={() => handleSaveResult(fixture.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
