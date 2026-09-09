import { type NextRequest, NextResponse } from "next/server"
import { calculateStandings } from "@/lib/utils/standings"
import type { Fixture } from "@/lib/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { readTournamentEntries } from "@/lib/tournaments/entry-config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consoleFilter = searchParams.get("console")
    const tournamentId = searchParams.get("tournamentId")

    const admin = createAdminClient()

    // Approved players only.
    const { data: players, error: playersError } = await admin
      .from("players")
      .select("id,name,preferred_club,assigned_club,console,status,avatar_url")
      .eq("status", "approved")
    if (playersError) throw playersError

    let selectedClubByPlayer = new Map<string, string>()
    let hasEntryRoster = false
    if (tournamentId) {
      const { data: tournament } = await admin
        .from("tournaments")
        .select("config")
        .eq("id", tournamentId)
        .maybeSingle()
      hasEntryRoster = Array.isArray(tournament?.config?.entries)
      selectedClubByPlayer = new Map(
        readTournamentEntries(tournament?.config)
          .filter((entry) => entry.status === "accepted" && entry.selected_club)
          .map((entry) => [entry.player_id, entry.selected_club as string]),
      )
    }

    // Fixtures, optionally scoped to one tournament.
    let fixturesQuery = admin
      .from("fixtures")
      .select(
        "id,tournament_id,matchday,home_player_id,away_player_id,home_score,away_score,status,scheduled_date",
      )
    if (tournamentId) fixturesQuery = fixturesQuery.eq("tournament_id", tournamentId)
    const { data: fixtures, error: fixturesError } = await fixturesQuery
    if (fixturesError) throw fixturesError

    const eligiblePlayers =
      tournamentId && hasEntryRoster
        ? (players ?? []).filter((p) => selectedClubByPlayer.has(String(p.id)))
        : (players ?? [])

    let shapedPlayers = eligiblePlayers.map((p) => ({
      id: String(p.id),
      name: p.name,
      assignedTeam: selectedClubByPlayer.get(String(p.id)) || p.assigned_club || p.preferred_club || undefined,
      preferredClub: p.preferred_club || undefined,
      console: p.console,
      avatarUrl: p.avatar_url ?? null,
    }))

    const shapedFixtures = (fixtures ?? []).map((f) => ({
      id: f.id,
      tournamentId: f.tournament_id,
      matchday: f.matchday,
      homePlayer: String(f.home_player_id),
      awayPlayer: String(f.away_player_id),
      homeScore: f.home_score,
      awayScore: f.away_score,
      status: f.status,
      scheduledDate: f.scheduled_date,
    }))

    const visiblePlayerIds = new Set(shapedPlayers.filter((p) => !consoleFilter || consoleFilter === "all" || String(p.console || "").toUpperCase() === consoleFilter.toUpperCase()).map((p) => p.id))
    // Calculate before filtering so cross-console opponents still contribute results.
    const standings = calculateStandings(shapedFixtures as unknown as Fixture[], shapedPlayers).filter((row) => visiblePlayerIds.has(row.playerId))

    return NextResponse.json({ standings, totalPlayers: standings.length })
  } catch (error) {
    console.error("Error fetching standings:", error)
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 })
  }
}
