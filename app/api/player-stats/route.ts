import { mergeStatsRows } from "@/lib/stats-overrides"
import { NextRequest, NextResponse } from "next/server"
import { GET as standingsGET } from "@/app/api/standings/route"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { readTournamentEntries } from "@/lib/tournaments/entry-config"

type PlayerRow = {
  id: string
  name: string
  preferred_club: string | null
  assigned_club: string | null
}
type EventRow = { player_id: string; type: string }
type Tally = { goals: number; assists: number; yellow: number; red: number }

const emptyStats = { goals: 0, assists: 0, yellow: 0, red: 0, wins: 0, draws: 0, losses: 0 }

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    let tournamentId = new URL(request.url).searchParams.get("tournamentId")
    const admin = createAdminClient()
    if (!tournamentId) {
      const { data: active, error } = await admin.from("tournaments").select("id").eq("status", "ACTIVE").order("updated_at", { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      tournamentId = active?.id || null
    }
    let overrides: Record<string, any> = {}

    // Optionally restrict to a single tournament's fixtures.
    let fixtureIds: string[] | null = null
    if (tournamentId) {
      const { data: fx } = await supabase
        .from("fixtures")
        .select("id")
        .eq("tournament_id", tournamentId)
      fixtureIds = (fx ?? []).map((f: { id: string }) => f.id)

    }

    let eventsQuery = supabase.from("match_events").select("player_id,type")
    if (fixtureIds) eventsQuery = eventsQuery.in("fixture_id", fixtureIds)
    const { data: events } = await eventsQuery

    const { data: players } = await supabase
      .from("players")
      .select("id,name,preferred_club,assigned_club")
      .eq("status", "approved")

    let selectedClubByPlayer = new Map<string, string>()
    if (tournamentId) {
      const admin = createAdminClient()
      const { data: tournament } = await admin
        .from("tournaments")
        .select("config")
        .eq("id", tournamentId)
        .maybeSingle()
      overrides = tournament?.config?.stats_overrides || {}
      selectedClubByPlayer = new Map(
        readTournamentEntries(tournament?.config)
          .filter((entry) => entry.status === "accepted" && entry.selected_club)
          .map((entry) => [entry.player_id, entry.selected_club as string]),
      )
    }

    const playerMap = new Map<string, PlayerRow>(
      ((players as PlayerRow[]) ?? []).map((p) => [p.id, p]),
    )
    const teamOf = (id: string) => {
      const p = playerMap.get(id)
      return selectedClubByPlayer.get(id) || p?.assigned_club || p?.preferred_club || "-"
    }
    const nameOf = (id: string) => playerMap.get(id)?.name ?? "Unknown"

    // Tally goals / assists / cards per player from match events.
    const tally = new Map<string, Tally>()
    for (const e of ((events as EventRow[]) ?? [])) {
      const t = tally.get(e.player_id) ?? { goals: 0, assists: 0, yellow: 0, red: 0 }
      if (e.type === "goal") t.goals++
      else if (e.type === "assist") t.assists++
      else if (e.type === "yellow") t.yellow++
      else if (e.type === "red") t.red++
      tally.set(e.player_id, t)
    }

    // EA FC goals come from approved match scores; assists/cards come from match events.
    let scoreQuery = supabase.from("fixtures").select("home_player_id,away_player_id,home_score,away_score").in("status", ["PLAYED", "FORFEIT"])
    if (tournamentId) scoreQuery = scoreQuery.eq("tournament_id", tournamentId)
    const { data: scores, error: scoreError } = await scoreQuery
    if (scoreError) throw scoreError
    const goals = new Map<string, number>()
    for (const f of scores || []) {
      if (f.home_score == null || f.away_score == null) continue
      goals.set(f.home_player_id, (goals.get(f.home_player_id) || 0) + f.home_score)
      goals.set(f.away_player_id, (goals.get(f.away_player_id) || 0) + f.away_score)
    }
    for (const [id, count] of goals) tally.set(id, { ...(tally.get(id) || { goals: 0, assists: 0, yellow: 0, red: 0 }), goals: count })

    const entries = [...tally.entries()]
    const topScorers = entries
      .filter(([, t]) => t.goals > 0)
      .sort((a, b) => b[1].goals - a[1].goals)
      .slice(0, 20)
      .map(([id, t], i) => ({ id, rank: i + 1, name: nameOf(id), team: teamOf(id), goals: t.goals }))
    const topAssists = entries
      .filter(([, t]) => t.assists > 0)
      .sort((a, b) => b[1].assists - a[1].assists)
      .slice(0, 20)
      .map(([id, t], i) => ({ id, rank: i + 1, name: nameOf(id), team: teamOf(id), assists: t.assists }))
    const discipline = entries
      .filter(([, t]) => t.yellow > 0 || t.red > 0)
      .sort((a, b) => b[1].red - a[1].red || b[1].yellow - a[1].yellow)
      .map(([id, t]) => ({
        id, name: nameOf(id),
        team: teamOf(id),
        yellow_cards: t.yellow,
        red_cards: t.red,
      }))

    // Per-user stats for the signed-in player's dashboard.
    let stats = { ...emptyStats }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const mine = tally.get(user.id)
      if (mine) stats = { ...stats, ...mine }
      const response = await standingsGET(new NextRequest(request.url))
      if (!response.ok) throw new Error("Could not load player standings")
      const standing = (await response.json()).standings.find((row: any) => row.playerId === user.id)
      if (standing) {
        stats.wins = standing.won ?? 0
        stats.draws = standing.drawn ?? 0
        stats.losses = standing.lost ?? 0
      }
    }

    const scorers = mergeStatsRows(topScorers.map((r) => ({ ...r, G: r.goals })), overrides.scorers, "scorers")
      .sort((a,b) => b.G-a.G).map((r,i) => ({ id: r.id, rank: i+1, name: r.name, team: r.team, goals: r.G }))
    const assists = mergeStatsRows(topAssists.map((r) => ({ ...r, A: r.assists })), overrides.assists, "assists")
      .sort((a,b) => b.A-a.A).map((r,i) => ({ id: r.id, rank: i+1, name: r.name, team: r.team, assists: r.A }))
    const cards = mergeStatsRows(discipline.map((r) => ({ ...r, YC: r.yellow_cards, RC: r.red_cards })), overrides.discipline, "discipline")
      .map((r) => ({ id: r.id, name: r.name, team: r.team, yellow_cards: r.YC, red_cards: r.RC }))
    if (user) {
      stats.goals = scorers.find((r) => r.id === user.id)?.goals ?? stats.goals
      stats.assists = assists.find((r) => r.id === user.id)?.assists ?? stats.assists
      stats.yellow = cards.find((r) => r.id === user.id)?.yellow_cards ?? stats.yellow
      stats.red = cards.find((r) => r.id === user.id)?.red_cards ?? stats.red
    }
    return NextResponse.json({ topScorers: scorers, topAssists: assists, discipline: cards, ...stats })
  } catch (error) {
    console.error("Error computing player stats:", error)
    return NextResponse.json({ error: "Failed to compute stats" }, { status: 500 })
  }
}
