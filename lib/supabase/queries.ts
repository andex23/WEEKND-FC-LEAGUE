import { createClient } from "./server"
import { supabase } from "./client"

// Player queries
export async function getPlayers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("players").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching players:", error)
    return []
  }

  return data || []
}

export async function getPlayerByUserId(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("players").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching player:", error)
    return null
  }

  return data
}

export async function getPlayerByUsername(username: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("players").select("*").eq("username", username).single()

  if (error) {
    console.error("Error fetching player by username:", error)
    return null
  }

  return data
}

export async function createPlayer(playerData: {
  name: string
  location: string
  console: "PS5" | "XBOX" | "PC"
  preferred_club: string
  user_id?: string
}) {
  const { data, error } = await supabase.from("players").insert([playerData]).select().single()

  if (error) {
    console.error("Error creating player:", error)
    throw error
  }

  return data
}

// New: approved registrations (fallback to all players if no status column)
export async function getApprovedRegistrations() {
  const client = await createClient()
  try {
    // Try filtering by status if present
    const byStatus = await client.from("players").select("*").eq("status", "approved")
    if (!byStatus.error) return byStatus.data || []
  } catch {}
  // Fallback: return all players
  const { data } = await client.from("players").select("*")
  return data || []
}

// Fixture queries
export async function getFixtures() {
  const supabase = await createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("fixtures")
    .select(`
      id, matchday, home_score, away_score, status, played_at,
      home_player:players!fixtures_home_player_id_fkey(id, name, assigned_club),
      away_player:players!fixtures_away_player_id_fkey(id, name, assigned_club)
    `)
    .order("matchday", { ascending: true })

  if (error) {
    console.error("Error fetching fixtures:", error)
    return []
  }

  return data || []
}

export async function getPlayerFixtures(playerId: string, limit?: number) {
  const supabase = await createClient()
  if (!supabase) return []

  let query = supabase
    .from("fixtures")
    .select(`
      *,
      home_player:players!fixtures_home_player_id_fkey(name, assigned_club),
      away_player:players!fixtures_away_player_id_fkey(name, assigned_club)
    `)
    .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`)
    .eq("status", "SCHEDULED")
    .order("matchday", { ascending: true })
    .order("created_at", { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching player fixtures:", error)
    return []
  }

  // Transform data to include is_home flag and proper team names
  return (data || []).map((fixture) => ({
    id: fixture.id,
    matchday: fixture.matchday,
    home_team: fixture.home_player?.assigned_club || "TBD",
    away_team: fixture.away_player?.assigned_club || "TBD",
    home_player: fixture.home_player?.name || "TBD",
    away_player: fixture.away_player?.name || "TBD",
    status: fixture.status,
    scheduled_date: fixture.scheduled_date,
    is_home: fixture.home_player_id === playerId,
  }))
}

export async function updateFixtureResult(fixtureId: string, homeScore: number, awayScore: number, playerId: string) {
  const supabase = await createClient()
  if (!supabase) throw new Error("Supabase client not available")

  // First get the fixture to determine if player is home or away
  const { data: fixture, error: fetchError } = await supabase
    .from("fixtures")
    .select("home_player_id, away_player_id, home_confirmed, away_confirmed")
    .eq("id", fixtureId)
    .single()

  if (fetchError) throw fetchError

  const isHomePlayer = fixture.home_player_id === playerId
  const isAwayPlayer = fixture.away_player_id === playerId

  if (!isHomePlayer && !isAwayPlayer) {
    throw new Error("Player not involved in this fixture")
  }

  // Update the fixture with scores and confirmation
  const updateData: any = {
    home_score: homeScore,
    away_score: awayScore,
  }

  if (isHomePlayer) {
    updateData.home_confirmed = true
  } else {
    updateData.away_confirmed = true
  }

  // If both players have confirmed, mark as played
  const bothConfirmed = (isHomePlayer && fixture.away_confirmed) || (isAwayPlayer && fixture.home_confirmed)

  if (bothConfirmed) {
    updateData.status = "PLAYED"
    updateData.played_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from("fixtures").update(updateData).eq("id", fixtureId).select().single()

  if (error) throw error
  return data
}

// New: bulk insert fixtures
export async function insertFixturesBulk(fixtures: Array<{ id?: string; matchday: number; home_player_id: string; away_player_id: string; home_club: string; away_club: string; status?: string }>) {
  const client = await createClient()
  const { data, error } = await client.from("fixtures").insert(fixtures).select()
  if (error) {
    console.error("Error inserting fixtures:", error)
    throw error
  }
  return data
}

// Standings queries
export async function getStandings() {
  const supabase = await createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("v_standings")
    .select("*")
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false })

  if (error) {
    console.error("Error fetching standings:", error)
    return []
  }

  return data || []
}

export async function getPlayerStanding(playerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("v_standings").select("*").eq("id", playerId).single()

  if (error) {
    console.error("Error fetching player standing:", error)
    return null
  }

  // Get total number of players for progress calculation
  const { count } = await supabase.from("v_standings").select("*", { count: "exact", head: true })

  return {
    ...data,
    total_players: count || 0,
  }
}

export async function getPlayerStats(playerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("v_standings").select("*").eq("id", playerId).single()

  if (error) {
    console.error("Error fetching player stats:", error)
    return {
      goals: 0,
      assists: 0,
      cards: 0,
      is_top_scorer: false,
      is_top_assister: false,
    }
  }

  // Get league leaders to determine badges
  const { data: topScorer } = await supabase
    .from("v_standings")
    .select("*")
    .order("goals", { ascending: false })
    .limit(1)
    .single()
  const { data: topAssister } = await supabase
    .from("v_standings")
    .select("*")
    .order("assists", { ascending: false })
    .limit(1)
    .single()

  return {
    goals: data?.goals || 0,
    assists: data?.assists || 0,
    cards: data?.cards || 0,
    is_top_scorer: topScorer?.id === playerId && (topScorer?.goals || 0) > 0,
    is_top_assister: topAssister?.id === playerId && (topAssister?.assists || 0) > 0,
  }
}

// League settings queries
export async function getLeagueSettings() {
  const supabase = await createClient()
  if (!supabase) return null

  const { data, error } = await supabase.from("league_settings").select("*").limit(1).single()

  if (error) {
    console.error("Error fetching league settings:", error)
    return null
  }

  return data
}

// Admin functions
export async function assignTeamsAutomatically() {
  const supabase = await createClient()

  const { error } = await supabase.rpc("assign_teams_automatically")

  if (error) {
    console.error("Error assigning teams:", error)
    throw error
  }
}

export async function generateFixtures(rounds = 2) {
  const supabase = await createClient()

  const { error } = await supabase.rpc("generate_fixtures", {
    rounds_param: rounds,
  })

  if (error) {
    console.error("Error generating fixtures:", error)
    throw error
  }
}

export async function promotePlayerToAdmin(playerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("players").update({ role: "ADMIN" }).eq("id", playerId).select().single()

  if (error) {
    console.error("Error promoting player:", error)
    throw error
  }

  return data
}

// New: Tournament config helpers (best-effort)
export async function upsertTournamentConfig(config: any, setActive?: boolean) {
  const client = await createClient()
  // Try tournaments table first
  try {
    const { data, error } = await client
      .from("tournaments")
      .upsert({ id: "active", name: config?.basics?.name || "Tournament", config, status: setActive ? "ACTIVE" : "DRAFT", is_active: !!setActive }, { onConflict: "id" })
      .select()
      .single()
    if (!error) return data
  } catch (e) {
    console.warn("tournaments table not available; falling back", e)
  }
  // Fallback to league_settings row
  try {
    await client.from("league_settings").update({ status: setActive ? "ACTIVE" : "DRAFT" }).neq("id", "")
  } catch {}
}

// Tournament queries
export async function getTournaments() {
  const client = await createClient()
  const { data, error } = client.from("league").select("*").order("created_at", { ascending: false })
  if (error) return []
  return data || []
}

export async function createTournament(tournamentData: any) {
  const client = await createClient()
  const { data, error } = await client.from("tournaments").insert([tournamentData]).select().single()
  if (error) {
    console.error("Error creating tournament:", error)
    throw error
  }
  return data
}

export async function updateTournament(id: string, patch: any) {
  const client = await createClient()
  const { data, error } = await client.from("tournaments").update(patch).eq("id", id).select().single()
  if (error) {
    console.error("Error updating tournament:", error)
    throw error
  }
  return data
}

export async function deleteTournament(id: string) {
  const client = await createClient()
  const { error } = await client.from("tournaments").delete().eq("id", id)
  if (error) {
    console.error("Error deleting tournament:", error)
    throw error
  }
  return true
}

export async function getActiveTournamentId() {
  const client = await createClient()
  const { data, error } = await client.from("tournaments").select("id").eq("is_active", true).single()
  if (error) {
    console.error("Error fetching active tournament:", error)
    return null
  }
  return data?.id || null
}

export async function setActiveTournament(id: string) {
  const client = await createClient()
  // Deactivate all first
  await client.from("tournaments").update({ is_active: false }).eq("is_active", true)
  // Activate the new one
  const { data, error } = await client.from("tournaments").update({ is_active: true, status: "ACTIVE" }).eq("id", id).select().single()
  if (error) {
    console.error("Error activating tournament:", error)
    throw error
  }
  return data
}

export async function deactivateTournament() {
  const client = await createClient()
  await client.from("tournaments").update({ is_active: false, status: "DRAFT" }).eq("is_active", true)
}
