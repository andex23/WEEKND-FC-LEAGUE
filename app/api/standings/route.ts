import { mergeStatsRows } from "@/lib/stats-overrides"
import { type NextRequest, NextResponse } from "next/server"
import { calculateStandings } from "@/lib/utils/standings"
import type { Fixture } from "@/lib/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { readTournamentEntries } from "@/lib/tournaments/entry-config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consoleFilter = searchParams.get("console")
    let tournamentId = searchParams.get("tournamentId")

    const admin = createAdminClient()

    if (!tournamentId) {
      const { data: active, error } = await admin.from("tournaments").select("id").eq("status", "ACTIVE").order("updated_at", { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      tournamentId = active?.id || null
    }
    let overrides: Record<string, any> = {}
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
      overrides = tournament?.config?.stats_overrides?.standings || {}
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
    let standings = calculateStandings(shapedFixtures as unknown as Fixture[], shapedPlayers).filter((row) => visiblePlayerIds.has(row.playerId))

    const base = standings.map((r) => ({ id: r.playerId, name: r.playerName, team: r.team || "-", P: r.played, W: r.won, D: r.drawn, L: r.lost, GF: r.goalsFor, GA: r.goalsAgainst, GD: r.goalDifference, Pts: r.points }))
    const originals = new Map(standings.map((r) => [r.playerId, r]))
    const merged = mergeStatsRows(base, overrides, "standings").map((r) => ({
      ...originals.get(r.id), playerId: r.id, playerName: r.name, team: r.team,
      played: r.P, won: r.W, drawn: r.D, lost: r.L, goalsFor: r.GF, goalsAgainst: r.GA,
      goalDifference: r.GD, points: r.Pts, last5: originals.get(r.id)?.last5 || [], overridden: r.overridden,
    })).filter((r) => !consoleFilter || consoleFilter === "all" || visiblePlayerIds.has(r.playerId))
      .sort((a,b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
    return NextResponse.json({ standings: merged, totalPlayers: merged.length })
  } catch (error) {
    console.error("Error fetching standings:", error)
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 })
  }
}
