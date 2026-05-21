import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const tournamentId = new URL(request.url).searchParams.get("tournamentId")

    // Optionally restrict to a single tournament's fixtures.
    let fixtureIds: string[] | null = null
    if (tournamentId) {
      const { data: fx } = await supabase
        .from("fixtures")
        .select("id")
        .eq("tournament_id", tournamentId)
      fixtureIds = (fx ?? []).map((f: { id: string }) => f.id)
      if (fixtureIds.length === 0) {
        return NextResponse.json({ topScorers: [], topAssists: [], discipline: [], ...emptyStats })
      }
    }

    let eventsQuery = supabase.from("match_events").select("player_id,type")
    if (fixtureIds) eventsQuery = eventsQuery.in("fixture_id", fixtureIds)
    const { data: events } = await eventsQuery

    const { data: players } = await supabase
      .from("players")
      .select("id,name,preferred_club,assigned_club")
      .eq("status", "approved")

    const playerMap = new Map<string, PlayerRow>(
      ((players as PlayerRow[]) ?? []).map((p) => [p.id, p]),
    )
    const teamOf = (id: string) => {
      const p = playerMap.get(id)
      return p?.assigned_club || p?.preferred_club || "-"
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

    const entries = [...tally.entries()]
    const topScorers = entries
      .filter(([, t]) => t.goals > 0)
      .sort((a, b) => b[1].goals - a[1].goals)
      .slice(0, 20)
      .map(([id, t], i) => ({ rank: i + 1, name: nameOf(id), team: teamOf(id), goals: t.goals }))
    const topAssists = entries
      .filter(([, t]) => t.assists > 0)
      .sort((a, b) => b[1].assists - a[1].assists)
      .slice(0, 20)
      .map(([id, t], i) => ({ rank: i + 1, name: nameOf(id), team: teamOf(id), assists: t.assists }))
    const discipline = entries
      .filter(([, t]) => t.yellow > 0 || t.red > 0)
      .sort((a, b) => b[1].red - a[1].red || b[1].yellow - a[1].yellow)
      .map(([id, t]) => ({
        name: nameOf(id),
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
      const { data: standing } = await supabase
        .from("v_standings")
        .select("wins,draws,losses")
        .eq("id", user.id)
        .maybeSingle()
      if (standing) {
        stats.wins = standing.wins ?? 0
        stats.draws = standing.draws ?? 0
        stats.losses = standing.losses ?? 0
      }
    }

    return NextResponse.json({ topScorers, topAssists, discipline, ...stats })
  } catch (error) {
    console.error("Error computing player stats:", error)
    return NextResponse.json({ error: "Failed to compute stats" }, { status: 500 })
  }
}
