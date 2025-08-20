import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // TODO: Get league status from database
    const mockLeagueStatus = {
      id: "1",
      name: "Weekend Premier League - FIFA 25",
      status: "DRAFT" as const,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-03-15"),
      rounds: 2,
      matchdaysPerWeekend: 2,
      teamsLocked: false,
      totalPlayers: 16,
      maxPlayers: 20,
    }

    return NextResponse.json(mockLeagueStatus)
  } catch (error) {
    console.error("Error fetching league status:", error)
    return NextResponse.json({ error: "Failed to fetch league status" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, teamsLocked, startDate, endDate } = body

    // TODO: Update league status in database
    // TODO: Verify user has admin privileges

    console.log("Updating league status:", { status, teamsLocked, startDate, endDate })

    return NextResponse.json({
      message: "League status updated successfully",
      updatedFields: { status, teamsLocked, startDate, endDate },
    })
  } catch (error) {
    console.error("Error updating league status:", error)
    return NextResponse.json({ error: "Failed to update league status" }, { status: 500 })
  }
}
