import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchday = searchParams.get("matchday")
    const status = searchParams.get("status")
    const playerId = searchParams.get("playerId")

    // TODO: Get fixtures from database
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
        scheduledDate: new Date("2024-01-06T19:00:00"),
      },
      {
        id: "2",
        matchday: 2,
        homePlayer: "2",
        awayPlayer: "1",
        homeTeam: "Chelsea",
        awayTeam: "Arsenal",
        homeScore: null,
        awayScore: null,
        status: "SCHEDULED" as const,
        scheduledDate: new Date("2024-01-13T19:00:00"),
      },
    ]

    let filteredFixtures = mockFixtures

    // Apply filters
    if (matchday && matchday !== "all") {
      filteredFixtures = filteredFixtures.filter((fixture) => fixture.matchday.toString() === matchday)
    }

    if (status && status !== "all") {
      filteredFixtures = filteredFixtures.filter((fixture) => fixture.status === status)
    }

    if (playerId) {
      filteredFixtures = filteredFixtures.filter(
        (fixture) => fixture.homePlayer === playerId || fixture.awayPlayer === playerId,
      )
    }

    return NextResponse.json({
      fixtures: filteredFixtures,
      totalFixtures: filteredFixtures.length,
    })
  } catch (error) {
    console.error("Error fetching fixtures:", error)
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 })
  }
}
