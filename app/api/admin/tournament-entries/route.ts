import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  invitePlayersToTournament,
  readTournamentEntries,
  removeTournamentEntry,
  summarizeTournamentEntries,
  withTournamentEntries,
} from "@/lib/tournaments/entry-config"

async function requireAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get("wfc_admin")?.value === "1"
}

function playerMap(players: any[] | null) {
  return new Map((players || []).map((player) => [String(player.id), player]))
}

function shapeEntries(tournaments: any[], players: any[] | null) {
  const byPlayer = playerMap(players)
  return tournaments.flatMap((tournament) => {
    const entries = readTournamentEntries(tournament.config)
    return entries.map((entry) => ({
      ...entry,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        season: tournament.season,
        is_active: tournament.is_active,
      },
      player: byPlayer.get(entry.player_id) || null,
    }))
  })
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get("tournamentId")
  const admin = createAdminClient()

  let tournamentQuery = admin
    .from("tournaments")
    .select("id,name,status,season,is_active,config,created_at")
    .order("created_at", { ascending: false })

  if (tournamentId) tournamentQuery = tournamentQuery.eq("id", tournamentId)

  const [{ data: tournaments, error: tournamentError }, { data: players, error: playersError }] =
    await Promise.all([
      tournamentQuery,
      admin.from("players").select("id,name,username,email,console,location,preferred_club,status").order("name"),
    ])

  if (tournamentError || playersError) {
    return NextResponse.json(
      { error: tournamentError?.message || playersError?.message || "Failed to load tournament entries" },
      { status: 500 },
    )
  }

  const entries = shapeEntries(tournaments || [], players || [])
  const summary = summarizeTournamentEntries(entries)
  return NextResponse.json({ entries, summary })
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { action, tournamentId } = body

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: tournament, error: tournamentError } = await admin
    .from("tournaments")
    .select("id,name,config")
    .eq("id", String(tournamentId))
    .maybeSingle()

  if (tournamentError || !tournament) {
    return NextResponse.json({ error: tournamentError?.message || "Tournament not found" }, { status: 404 })
  }

  const existing = readTournamentEntries(tournament.config)
  let nextEntries = existing

  if (action === "invite_all_approved") {
    const { data: players, error } = await admin
      .from("players")
      .select("id")
      .eq("status", "approved")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    nextEntries = invitePlayersToTournament(
      existing,
      String(tournament.id),
      (players || []).map((player) => player.id),
    )
  } else if (action === "invite") {
    const playerIds = Array.isArray(body.playerIds) ? body.playerIds.map(String) : []
    if (playerIds.length === 0) {
      return NextResponse.json({ error: "Select at least one approved player to invite." }, { status: 400 })
    }

    const { data: players, error } = await admin
      .from("players")
      .select("id,status")
      .in("id", playerIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const approvedIds = (players || [])
      .filter((player) => String(player.status) === "approved")
      .map((player) => player.id)

    if (approvedIds.length === 0) {
      return NextResponse.json({ error: "Only approved players can be invited." }, { status: 400 })
    }

    nextEntries = invitePlayersToTournament(existing, String(tournament.id), approvedIds)
  } else if (action === "remove") {
    if (!body.entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 })
    }
    nextEntries = removeTournamentEntry(existing, String(body.entryId))
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const config = withTournamentEntries(tournament.config, nextEntries)
  const { data: updated, error: updateError } = await admin
    .from("tournaments")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("id", String(tournament.id))
    .select("id,name,status,season,is_active,config")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    tournament: updated,
    entries: readTournamentEntries(updated.config),
    summary: summarizeTournamentEntries(readTournamentEntries(updated.config)),
  })
}
