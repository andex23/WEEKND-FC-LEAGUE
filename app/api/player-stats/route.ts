import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const tournamentId = searchParams.get("tournamentId")

    let topScorers: any[] = []
    let topAssists: any[] = []
    let discipline: any[] = []

    // If tournamentId is provided, compute stats from fixtures
    if (tournamentId) {
      try {
        // Fetch fixtures for the tournament
        const { data: fixtures, error: fixturesError } = await supabase
          .from("fixtures")
          .select("id, home_player_id, away_player_id, home_score, away_score, status")
          .eq("tournament_id", tournamentId)
          .eq("status", "PLAYED")

        if (!fixturesError && fixtures && fixtures.length > 0) {
          // Fetch players for names
          const { data: players, error: playersError } = await supabase
            .from("players")
            .select("id, name, preferred_club")
            .eq("status", "approved")

          if (!playersError && players) {
            const playerMap = new Map(players.map((p: any) => [p.id, p]))
            
            // Compute goals from fixtures
            const goalsMap = new Map<string, { name: string; team: string; goals: number }>()
            
            for (const fixture of fixtures) {
              if (fixture.home_score !== null && fixture.away_score !== null) {
                const homePlayer = playerMap.get(fixture.home_player_id)
                const awayPlayer = playerMap.get(fixture.away_player_id)
                
                if (homePlayer) {
                  const current = goalsMap.get(fixture.home_player_id) || { 
                    name: homePlayer.name, 
                    team: homePlayer.preferred_club || "-", 
                    goals: 0 
                  }
                  current.goals += fixture.home_score
                  goalsMap.set(fixture.home_player_id, current)
                }
                
                if (awayPlayer) {
                  const current = goalsMap.get(fixture.away_player_id) || { 
                    name: awayPlayer.name, 
                    team: awayPlayer.preferred_club || "-", 
                    goals: 0 
                  }
                  current.goals += fixture.away_score
                  goalsMap.set(fixture.away_player_id, current)
                }
              }
            }
            
            // Convert to top scorers array
            topScorers = Array.from(goalsMap.values())
              .sort((a, b) => b.goals - a.goals)
              .map((player, index) => ({
                rank: index + 1,
                name: player.name,
                team: player.team,
                goals: player.goals
              }))
          }
        }
      } catch (e) {
        console.log("Could not compute stats from fixtures:", e)
      }
    }

    const maybeFilter = (query: any) => (tournamentId ? query.eq("tournament_id", tournamentId) : query)

    // 0) Primary: player_stats table if it exists
    try {
      let q = supabase.from("player_stats").select("player_id, player_name, team, goals, assists, yellow_cards, red_cards")
      q = maybeFilter(q)
      const { data, error } = await q
      if (!error && Array.isArray(data) && data.length) {
        const sortedGoals = [...data].sort((a: any, b: any) => (b.goals ?? 0) - (a.goals ?? 0))
        topScorers = sortedGoals.slice(0, 20).map((r: any, i: number) => ({ rank: i + 1, name: r.player_name || r.name, team: r.team || "-", goals: r.goals || 0 }))
        const sortedAssists = [...data].sort((a: any, b: any) => (b.assists ?? 0) - (a.assists ?? 0))
        topAssists = sortedAssists.slice(0, 20).map((r: any, i: number) => ({ rank: i + 1, name: r.player_name || r.name, team: r.team || "-", assists: r.assists || 0 }))
        discipline = data.map((r: any) => ({ name: r.player_name || r.name, team: r.team || "-", yellow_cards: r.yellow_cards || 0, red_cards: r.red_cards || 0 }))
      }
    } catch {}

    // 1) Preferred views if needed
    if (!topScorers.length) {
      try { let q = supabase.from("v_top_scorers").select("*"); q = maybeFilter(q); const { data, error } = await q; if (!error && Array.isArray(data)) topScorers = data } catch {}
    }
    if (!topAssists.length) {
      try { let q = supabase.from("v_top_assists").select("*"); q = maybeFilter(q); const { data, error } = await q; if (!error && Array.isArray(data)) topAssists = data } catch {}
    }
    if (!discipline.length) {
      try { let q = supabase.from("v_discipline").select("*"); q = maybeFilter(q); const { data, error } = await q; if (!error && Array.isArray(data)) discipline = data } catch {}
    }

    // 2) Fallback to standings_view if still empty
    const needScorers = !topScorers?.length
    const needAssists = !topAssists?.length
    const needDiscipline = !discipline?.length

    if (needScorers || needAssists || needDiscipline) {
      try {
        let q = supabase.from("standings_view").select("*")
        q = maybeFilter(q)
        const { data, error } = await q
        if (!error && Array.isArray(data)) {
          if (needScorers) {
            const hasGoals = data.length > 0 && ("goals" in data[0] || "goals_for" in data[0])
            if (hasGoals) {
              const sorted = [...data].sort((a: any, b: any) => (b.goals ?? b.goals_for ?? 0) - (a.goals ?? a.goals_for ?? 0))
              topScorers = sorted.slice(0, 20).map((r: any, i: number) => ({
                rank: i + 1,
                name: r.name || r.player_name || r.player || r.username,
                team: r.team || r.club || r.preferred_club || r.assigned_club || "-",
                goals: r.goals ?? r.goals_for ?? 0,
              }))
            }
          }
          if (needAssists) {
            const hasAssists = data.length > 0 && ("assists" in data[0])
            if (hasAssists) {
              const sorted = [...data].sort((a: any, b: any) => (b.assists ?? 0) - (a.assists ?? 0))
              topAssists = sorted.slice(0, 20).map((r: any, i: number) => ({
                rank: i + 1,
                name: r.name || r.player_name || r.player || r.username,
                team: r.team || r.club || r.preferred_club || r.assigned_club || "-",
                assists: r.assists ?? 0,
              }))
            }
          }
          if (needDiscipline) {
            const hasCards = data.length > 0 && ("yellow_cards" in data[0] || "YC" in data[0])
            if (hasCards) {
              const mapped = data.map((r: any) => ({
                name: r.name || r.player_name || r.player || r.username,
                team: r.team || r.club || r.preferred_club || r.assigned_club || "-",
                yellow_cards: r.yellow_cards ?? r.YC ?? 0,
                red_cards: r.red_cards ?? r.RC ?? 0,
              }))
              discipline = mapped
            }
          }
        }
      } catch {}
    }

    // 3) Normalize output
    const normalizeName = (r: any) => r.name || r.player || r.player_name || r.playerName
    const normalizeTeam = (r: any) => r.team || r.club || r.preferred_club || r.assigned_club || "-"

    const normalizedScorers = (topScorers || []).map((r: any, i: number) => ({
      rank: r.rank || i + 1,
      name: normalizeName(r),
      team: normalizeTeam(r),
      goals: r.goals || r.G || r.total_goals || 0,
    }))

    const normalizedAssists = (topAssists || []).map((r: any, i: number) => ({
      rank: r.rank || i + 1,
      name: normalizeName(r),
      team: normalizeTeam(r),
      assists: r.assists || r.A || r.total_assists || 0,
    }))

    const normalizedDiscipline = (discipline || []).map((r: any) => ({
      name: normalizeName(r),
      team: normalizeTeam(r),
      yellow_cards: r.yellow_cards || r.YC || 0,
      red_cards: r.red_cards || r.RC || 0,
    }))

    const stats = { goals: 0, assists: 0, yellow: 0, red: 0, wins: 0, draws: 0, losses: 0 }

    return NextResponse.json({
      topScorers: normalizedScorers,
      topAssists: normalizedAssists,
      discipline: normalizedDiscipline,
      ...stats,
    })
  } catch (error) {
    return NextResponse.json({ topScorers: [], topAssists: [], discipline: [], goals: 0, assists: 0, yellow: 0, red: 0, wins: 0, draws: 0, losses: 0 })
  }
}
