import { type NextRequest, NextResponse } from "next/server"
import { assignTeamsAutomatically } from "@/lib/utils/fixtures"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamsLocked = false } = body

    // Get players from database
    const admin = createAdminClient()
    const { data: players, error: fetchError } = await admin
      .from("players")
      .select("id, name, preferred_club, assigned_club, status")
      .eq("status", "approved")
      .order("created_at", { ascending: true })

    if (fetchError) {
      console.error("Error fetching players:", fetchError)
      return NextResponse.json({ 
        error: "Failed to fetch players from database",
        details: fetchError.message,
        code: fetchError.code 
      }, { status: 500 })
    }

    if (!players || players.length === 0) {
      return NextResponse.json({ 
        error: "No approved players found",
        message: "Please approve some players before assigning teams",
        suggestion: "Go to Players page and approve players first"
      }, { status: 400 })
    }

    // Transform database players to expected format
    const dbPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      preferredClub: p.preferred_club,
      assignedTeam: p.assigned_club,
    }))

    const updatedPlayers = assignTeamsAutomatically(dbPlayers, teamsLocked)

    // Update players in database with assigned teams
    const updatePromises = updatedPlayers.map((player) =>
      admin
        .from("players")
        .update({ 
          assigned_club: player.assignedTeam,
          updated_at: new Date().toISOString()
        })
        .eq("id", player.id)
    )

    const updateResults = await Promise.allSettled(updatePromises)
    
    // Check for any failed updates
    const failedUpdates = updateResults.filter((result) => result.status === "rejected")
    if (failedUpdates.length > 0) {
      console.error("Some player updates failed:", failedUpdates)
      const successCount = updatedPlayers.length - failedUpdates.length
      return NextResponse.json({ 
        error: "Some team assignments failed", 
        message: `Successfully assigned ${successCount} teams, but ${failedUpdates.length} failed`,
        failedCount: failedUpdates.length,
        successCount: successCount,
        players: updatedPlayers,
        suggestion: "Please try again or check database connection"
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "Teams assigned successfully",
      players: updatedPlayers,
      assignedCount: updatedPlayers.length,
    })
  } catch (error) {
    console.error("Error assigning teams:", error)
    return NextResponse.json({ error: "Failed to assign teams" }, { status: 500 })
  }
}
