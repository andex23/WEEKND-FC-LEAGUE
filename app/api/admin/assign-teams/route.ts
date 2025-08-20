import { type NextRequest, NextResponse } from "next/server"
import { assignTeamsAutomatically } from "@/lib/utils/fixtures"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamsLocked = false } = body

    // TODO: Get players from database
    const mockPlayers = [
      { id: "1", name: "John Doe", preferredClub: "Arsenal", assignedTeam: null },
      { id: "2", name: "Jane Smith", preferredClub: "Chelsea", assignedTeam: null },
      { id: "3", name: "Mike Johnson", preferredClub: "Liverpool", assignedTeam: null },
    ]

    const updatedPlayers = assignTeamsAutomatically(mockPlayers, teamsLocked)

    // TODO: Update players in database

    return NextResponse.json({
      message: "Teams assigned successfully",
      players: updatedPlayers,
    })
  } catch (error) {
    console.error("Error assigning teams:", error)
    return NextResponse.json({ error: "Failed to assign teams" }, { status: 500 })
  }
}
