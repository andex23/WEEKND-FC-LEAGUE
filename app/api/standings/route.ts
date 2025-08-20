import { type NextRequest, NextResponse } from "next/server"
import { calculateStandings } from "@/lib/utils/standings"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const console = searchParams.get("console")

    // TODO: Get fixtures and players from database
    const mockFixtures = [
      {
        id: "1",
        matchday: 1,
        homePlayer: "1",
        awayPlayer: "2",
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        homeScore: 2,
        awayScore: 1,
        status: "PLAYED" as const,
      },
    ]

    const mockPlayers = [
      { id: "1", name: "John Doe", assignedTeam: "Arsenal", console: "PS5" },
      { id: "2", name: "Jane Smith", assignedTeam: "Chelsea", console: "Xbox" },
    ]

    let filteredPlayers = mockPlayers
    if (console && console !== "all") {
      filteredPlayers = mockPlayers.filter((player) => player.console === console)
    }

    const standings = calculateStandings(mockFixtures, filteredPlayers)

    return NextResponse.json({
      standings,
      totalPlayers: filteredPlayers.length,
    })
  } catch (error) {
    console.error("Error fetching standings:", error)
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 })
  }
}
