import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  readTournamentEntries,
  respondToTournamentEntry,
  withTournamentEntries,
} from "@/lib/tournaments/entry-config"

function shapePlayerEntry(entry: any, tournament: any) {
  return {
    ...entry,
    tournament: {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      season: tournament.season,
      is_active: tournament.is_active,
      start_at: tournament.start_at,
      end_at: tournament.end_at,
      config: tournament.config,
    },
  }
}

async function signedInPlayerId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id || null
}

export async function GET() {
  const playerId = await signedInPlayerId()
  if (!playerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: tournaments, error } = await admin
    .from("tournaments")
    .select("id,name,status,season,is_active,start_at,end_at,config,created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const entries = (tournaments || []).flatMap((tournament) =>
    readTournamentEntries(tournament.config)
      .filter((entry) => entry.player_id === playerId)
      .map((entry) => shapePlayerEntry(entry, tournament)),
  )

  return NextResponse.json({ entries })
}

export async function POST(request: Request) {
  const playerId = await signedInPlayerId()
  if (!playerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { action, tournamentId } = body

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: tournament, error } = await admin
    .from("tournaments")
    .select("id,name,status,season,is_active,start_at,end_at,config")
    .eq("id", String(tournamentId))
    .maybeSingle()

  if (error || !tournament) {
    return NextResponse.json({ error: error?.message || "Tournament not found" }, { status: 404 })
  }

  const existing = readTournamentEntries(tournament.config)

  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const result = respondToTournamentEntry(
    existing,
    playerId,
    action === "accept" ? "accepted" : "declined",
    body.selectedClub,
  )

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const config = withTournamentEntries(tournament.config, result.entries)
  const { data: updated, error: updateError } = await admin
    .from("tournaments")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("id", String(tournament.id))
    .select("id,name,status,season,is_active,start_at,end_at,config")
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    entry: result.entry ? shapePlayerEntry(result.entry, updated) : null,
  })
}
