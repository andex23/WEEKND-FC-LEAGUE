import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const admin = createAdminClient()
    
    // Get league settings
    const { data: leagueSettings, error: settingsError } = await admin
      .from("league_settings")
      .select("*")
      .single()

    // Get active tournament
    const { data: activeTournament, error: tournamentError } = await admin
      .from("tournaments")
      .select("*")
      .eq("status", "ACTIVE")
      .single()

    // Get player count
    const { data: players, error: playersError } = await admin
      .from("players")
      .select("id, status")
      .eq("status", "approved")

    if (settingsError && !leagueSettings) {
      console.error("Error fetching league settings:", settingsError)
    }

    if (tournamentError && !activeTournament) {
      console.error("Error fetching active tournament:", tournamentError)
    }

    if (playersError) {
      console.error("Error fetching players:", playersError)
    }

    // Build league status from database data
    const leagueStatus = {
      id: leagueSettings?.id || "default",
      name: activeTournament?.name || leagueSettings?.name || "Weekend Premier League - FIFA 25",
      status: activeTournament?.status || leagueSettings?.status || "DRAFT",
      startDate: activeTournament?.start_at || leagueSettings?.start_date || new Date("2024-01-15"),
      endDate: activeTournament?.end_at || leagueSettings?.end_date || new Date("2024-03-15"),
      rounds: leagueSettings?.rounds || 2,
      matchdaysPerWeekend: leagueSettings?.matchdays_per_weekend || 2,
      teamsLocked: leagueSettings?.teams_locked || false,
      totalPlayers: players?.length || 0,
      maxPlayers: 20, // Could be configurable in settings
      activeTournamentId: activeTournament?.id || null,
    }

    return NextResponse.json(leagueStatus)
  } catch (error) {
    console.error("Error fetching league status:", error)
    return NextResponse.json({ 
      error: "Failed to fetch league status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, teamsLocked, startDate, endDate, rounds, matchdaysPerWeekend } = body

    const admin = createAdminClient()
    
    // Update league settings
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (status !== undefined) updateData.status = status
    if (teamsLocked !== undefined) updateData.teams_locked = teamsLocked
    if (startDate !== undefined) updateData.start_date = startDate
    if (endDate !== undefined) updateData.end_date = endDate
    if (rounds !== undefined) updateData.rounds = rounds
    if (matchdaysPerWeekend !== undefined) updateData.matchdays_per_weekend = matchdaysPerWeekend

    const { data: updatedSettings, error: settingsError } = await admin
      .from("league_settings")
      .upsert(updateData)
      .select()
      .single()

    if (settingsError) {
      console.error("Error updating league settings:", settingsError)
      return NextResponse.json({ 
        error: "Failed to update league settings",
        details: settingsError.message 
      }, { status: 500 })
    }

    // If status is being changed to ACTIVE, also update active tournament
    if (status === "ACTIVE") {
      const { data: activeTournament, error: tournamentError } = await admin
        .from("tournaments")
        .select("id")
        .eq("status", "ACTIVE")
        .single()

      if (!tournamentError && activeTournament) {
        await admin
          .from("league_settings")
          .update({ active_tournament_id: activeTournament.id })
          .neq("id", "")
      }
    }

    return NextResponse.json({
      message: "League status updated successfully",
      updatedFields: { status, teamsLocked, startDate, endDate, rounds, matchdaysPerWeekend },
      settings: updatedSettings,
    })
  } catch (error) {
    console.error("Error updating league status:", error)
    return NextResponse.json({ 
      error: "Failed to update league status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
