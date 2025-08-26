import { type NextRequest, NextResponse } from "next/server"
import { calculateStandings } from "@/lib/utils/standings"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const console = searchParams.get("console")

    // Start empty unless computed from real data later
    const mockFixtures: any[] = []
    const mockPlayers: any[] = []

    let filteredPlayers = mockPlayers
    if (console && console !== "all") {
      filteredPlayers = mockPlayers.filter((player) => player.console === console)
    }

    const standings = calculateStandings(mockFixtures as any, filteredPlayers)

    return NextResponse.json({
      standings,
      totalPlayers: filteredPlayers.length,
    })
  } catch (error) {
    console.error("Error fetching standings:", error)
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 })
  }
}
