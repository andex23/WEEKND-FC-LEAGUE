import { type NextRequest, NextResponse } from "next/server"
import { calculateStandings } from "@/lib/utils/standings"
import { activePlayers, getTournamentPlayers } from "@/lib/mocks/players"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    // Global in-memory stores
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any
    if (!g.__memoryFixtures) g.__memoryFixtures = []
    if (!g.__memPlayers) g.__memPlayers = []

    const { searchParams } = new URL(request.url)
    const consoleFilter = searchParams.get("console")
    let tournamentId = searchParams.get("tournamentId")

    if (!tournamentId) {
      const active = g.__adminSettings?.tournament?.active_tournament_id || null
      if (active) tournamentId = String(active)
    }

    // Fetch fixtures from database for tournament
    let fixtures: any[] = []
    if (tournamentId) {
      try {
        const admin = createAdminClient()
        const { data: dbFixtures, error } = await admin
          .from("fixtures")
          .select("id, tournament_id, matchday, home_player_id, away_player_id, home_score, away_score, status, scheduled_date")
          .eq("tournament_id", tournamentId)
        
        if (!error && dbFixtures) {
          // Transform database fixtures to expected format
          fixtures = dbFixtures.map((f: any) => ({
            id: f.id,
            tournamentId: f.tournament_id,
            matchday: f.matchday,
            homePlayer: f.home_player_id,
            awayPlayer: f.away_player_id,
            homeScore: f.home_score,
            awayScore: f.away_score,
            status: f.status,
            scheduledDate: f.scheduled_date
          }))
          // Using ${fixtures.length} fixtures from database
        }
      } catch (e) {
        // Fallback to in-memory fixtures
        const allFixtures = (g.__memoryFixtures as any[]) || []
        fixtures = allFixtures.filter((f) => String(f.tournamentId || "") === String(tournamentId))
      }
    }

    // Build players list: try Supabase first, then fallback to in-memory stores
    let players: any[] = []
    
    // First, try to get players from Supabase
    try {
      const admin = createAdminClient()
      const { data: supabasePlayers, error } = await admin
        .from("players")
        .select("id, name, preferred_club, console, status")
        .eq("status", "approved")
      
      if (!error && supabasePlayers && supabasePlayers.length > 0) {
        players = supabasePlayers
        // Using ${players.length} players from Supabase
      }
    } catch (e) {
      // Fallback to in-memory stores
    }
    
    // Fallback to in-memory stores if Supabase failed or returned no data
    if (players.length === 0) {
      let playerIds: string[] = []
      if (tournamentId) {
        try { playerIds = getTournamentPlayers(String(tournamentId)) } catch { playerIds = [] }
      }
      
      if (playerIds.length > 0) {
        const byId = new Map((g.__memPlayers as any[]).map((p: any) => [String(p.id), p]))
        players = playerIds.map((id) => byId.get(String(id))).filter(Boolean)
      } else {
        players = activePlayers()
        if (players.length === 0) {
          const seen = new Set<string>()
          for (const f of fixtures) { seen.add(String(f.homePlayer)); seen.add(String(f.awayPlayer)) }
          const byId = new Map((g.__memPlayers as any[]).map((p: any) => [String(p.id), p]))
          players = Array.from(seen).map((id) => byId.get(id)).filter(Boolean)
        }
      }
      // Using ${players.length} players from in-memory stores
    }

    // Optional console filter
    if (consoleFilter && consoleFilter !== "all") {
      players = players.filter((p) => String(p.console || "").toUpperCase() === String(consoleFilter).toUpperCase())
    }

    // Shape players to what calculateStandings expects
    const shapedPlayers = players.map((p) => ({
      id: String(p.id),
      name: p.name,
      assignedTeam: p.preferred_club || undefined,
      preferredClub: p.preferred_club || undefined,
      console: p.console,
    }))

    const standings = calculateStandings(fixtures as any, shapedPlayers)

    return NextResponse.json({
      standings,
      totalPlayers: shapedPlayers.length,
    })
  } catch (error) {
    console.error("Error fetching standings:", error)
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 })
  }
}
