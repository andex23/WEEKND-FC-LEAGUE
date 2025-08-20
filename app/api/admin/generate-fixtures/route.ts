import { type NextRequest, NextResponse } from "next/server"
import { generateRoundRobinFixtures } from "@/lib/utils/fixtures"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rounds = 2, matchdaysPerWeekend = 2 } = body

    // TODO: Get players from database
    const mockPlayers = [
      { id: "1", name: "John Doe", assignedTeam: "Arsenal" },
      { id: "2", name: "Jane Smith", assignedTeam: "Chelsea" },
      { id: "3", name: "Mike Johnson", assignedTeam: "Liverpool" },
      { id: "4", name: "Sarah Wilson", assignedTeam: "Man City" },
    ]

    const fixtures = generateRoundRobinFixtures(mockPlayers, rounds, matchdaysPerWeekend)

    // TODO: Save fixtures to database

    return NextResponse.json({
      message: "Fixtures generated successfully",
      fixtures,
      totalFixtures: fixtures.length,
    })
  } catch (error) {
    console.error("Error generating fixtures:", error)
    return NextResponse.json({ error: "Failed to generate fixtures" }, { status: 500 })
  }
}
