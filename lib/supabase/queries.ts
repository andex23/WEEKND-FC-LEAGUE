import { createServerClient, createServiceClient } from "./server"
import { supabase } from "./client"

// Player queries
export async function getPlayers() {
  const client = createServerClient()
  if (!client) return []

  const { data, error } = await client.from("players").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching players:", error)
    return []
  }

  return data || []
}

export async function getPlayerByUserId(userId: string) {
  const client = createServerClient()
  if (!client) return null

  const { data, error } = await client.from("players").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching player:", error)
    return null
  }

  return data
}

export async function getPlayerByUsername(username: string) {
  const client = createServerClient()
  if (!client) return null

  const { data, error } = await client.from("players").select("*").eq("username", username).single()

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

// Fixture queries
export async function getFixtures() {
  const client = createServerClient()
  if (!client) return []

  const { data, error } = await client
    .from("fixtures")
    .select(`
      *,
      home_player:players!fixtures_home_player_id_fkey(name, assigned_club),
      away_player:players!fixtures_away_player_id_fkey(name, assigned_club)
    `)
    .order("matchday", { ascending: true })

  if (error) {
    console.error("Error fetching fixtures:", error)
    return []
  }

  return data || []
}

export async function getPlayerFixtures(playerId: string, limit?: number) {
  const client = createServerClient()
  if (!client) return []

  let query = client
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

export async function getPlayerFixturesWithLimit(playerId: string, limit?: number) {
  const client = createServerClient()
  if (!client) return []

  let query = client
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
  const client = createServerClient()
  if (!client) throw new Error("Supabase client not available")

  // First get the fixture to determine if player is home or away
  const { data: fixture, error: fetchError } = await client
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

  const { data, error } = await client.from("fixtures").update(updateData).eq("id", fixtureId).select().single()

  if (error) throw error
  return data
}

// Standings queries
export async function getStandings() {
  const client = createServerClient()
  if (!client) return []

  const { data, error } = await client
    .from("standings")
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
  const client = createServerClient()
  if (!client) return null

  const { data, error } = await client.from("standings").select("*").eq("player_id", playerId).single()

  if (error) {
    console.error("Error fetching player standing:", error)
    return null
  }

  // Get total number of players for progress calculation
  const { count } = await client.from("standings").select("*", { count: "exact", head: true })

  return {
    ...data,
    total_players: count || 0,
  }
}

// League settings queries
export async function getLeagueSettings() {
  const client = createServerClient()
  if (!client) return null

  const { data, error } = await client.from("league_settings").select("*").limit(1).single()

  if (error) {
    console.error("Error fetching league settings:", error)
    return null
  }

  return data
}

// Admin functions
export async function assignTeamsAutomatically() {
  const serviceClient = createServiceClient()

  const { error } = await serviceClient.rpc("assign_teams_automatically")

  if (error) {
    console.error("Error assigning teams:", error)
    throw error
  }
}

export async function generateFixtures(rounds = 2) {
  const serviceClient = createServiceClient()

  const { error } = await serviceClient.rpc("generate_fixtures", {
    rounds_param: rounds,
  })

  if (error) {
    console.error("Error generating fixtures:", error)
    throw error
  }
}

export async function promotePlayerToAdmin(playerId: string) {
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from("players")
    .update({ role: "ADMIN" })
    .eq("id", playerId)
    .select()
    .single()

  if (error) {
    console.error("Error promoting player:", error)
    throw error
  }

  return data
}

export async function getPlayerStats(playerId: string) {
  const client = createServerClient()
  if (!client) return null

  const { data, error } = await client.from("v_player_stats").select("*").eq("player_id", playerId).single()

  if (error) {
    console.error("Error fetching player stats:", error)
    return {
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      is_top_scorer: false,
      is_top_assister: false,
    }
  }

  return data
}

export async function getPlayerRecentResults(playerId: string, limit = 5) {
  const client = createServerClient()
  if (!client) return []

  const { data, error } = await client
    .from("fixtures")
    .select(`
      *,
      home_player:players!fixtures_home_player_id_fkey(name, assigned_club),
      away_player:players!fixtures_away_player_id_fkey(name, assigned_club)
    `)
    .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`)
    .eq("status", "PLAYED")
    .order("played_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching player recent results:", error)
    return []
  }

  // Transform data to include result from player's perspective
  return (data || []).map((fixture) => {
    const isHome = fixture.home_player_id === playerId
    const playerScore = isHome ? fixture.home_score : fixture.away_score
    const opponentScore = isHome ? fixture.away_score : fixture.home_score

    let result: "W" | "D" | "L"
    if (playerScore > opponentScore) {
      result = "W"
    } else if (playerScore === opponentScore) {
      result = "D"
    } else {
      result = "L"
    }

    return {
      id: fixture.id,
      matchday: fixture.matchday,
      home_team: fixture.home_player?.assigned_club || "TBD",
      away_team: fixture.away_player?.assigned_club || "TBD",
      home_score: fixture.home_score,
      away_score: fixture.away_score,
      is_home: isHome,
      result,
    }
  })
}
