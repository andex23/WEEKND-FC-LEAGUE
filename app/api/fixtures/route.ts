import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchday = searchParams.get("matchday")
    const status = searchParams.get("status")
    const playerId = searchParams.get("playerId")
    let tournamentId = searchParams.get("tournamentId")

    const client = await createClient()

    if (!tournamentId) {
      // Try to get active tournament from DB settings
      try {
        const { data: s } = await client.from("league_settings").select("active_tournament_id").limit(1).single()
        tournamentId = s?.active_tournament_id || null
      } catch {
        tournamentId = null
      }
      if (!tournamentId) return NextResponse.json({ fixtures: [], totalFixtures: 0 })
    }

    // Select base columns - only use player_id columns, no registration columns
    let query = client
      .from("fixtures")
      .select("id,tournament_id,matchday,home_player_id,away_player_id,home_score,away_score,status,scheduled_date,notes")
      .eq("tournament_id", tournamentId)
      .order("matchday", { ascending: true })

    if (matchday && matchday !== "all") query = query.eq("matchday", Number(matchday))
    if (status && status !== "all") query = query.eq("status", status)
    if (playerId) query = query.or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`)

    console.log("Executing query for tournamentId:", tournamentId)
    const { data, error } = await query
    if (error) {
      console.error("Error fetching fixtures:", error)
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }
    console.log("Raw fixtures data:", data)
    console.log("Number of fixtures found:", data?.length || 0)

    const shaped = (data || []).map((f: any) => ({
      id: f.id,
      tournamentId: f.tournament_id,
      matchday: f.matchday,
      homePlayer: f.home_player_id,
      awayPlayer: f.away_player_id,
      homeScore: f.home_score,
      awayScore: f.away_score,
      status: f.status,
      scheduledDate: f.scheduled_date,
      notes: f.notes || undefined,
    }))

    return NextResponse.json({ fixtures: shaped, totalFixtures: shaped.length })
  } catch (error) {
    console.error("Error fetching fixtures:", error)
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Use admin client for writes to avoid RLS conflicts during generation
    const admin = createAdminClient()

    if (body?.action === "clear_for_tournament") {
      const tournamentId = String(body.tournamentId || "")
      const { error } = await admin.from("fixtures").delete().eq("tournament_id", tournamentId)
      if (error) throw error
      return NextResponse.json({ ok: true, cleared: true })
    }

    const uuidLike = /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/
    const id = (typeof body.id === "string" && uuidLike.test(body.id)) ? body.id : randomUUID()
    const row: any = {
      id,
      tournament_id: body.tournamentId || null,
      matchday: Number(body.matchday || 1),
      home_player_id: String(body.homeId), // Primary player reference
      away_player_id: String(body.awayId), // Primary player reference
      home_reg_id: null, // Explicitly set to null
      away_reg_id: null, // Explicitly set to null
      home_score: body.homeScore ?? null,
      away_score: body.awayScore ?? null,
      status: String(body.status || "SCHEDULED").toUpperCase(),
      scheduled_date: body.date || null,
    }

    // Validate UUIDs explicitly to avoid DB casting errors
    if (!uuidLike.test(String(row.tournament_id || ""))) {
      return NextResponse.json({ error: "Invalid tournamentId", received: row.tournament_id }, { status: 400 })
    }
    if (!uuidLike.test(String(row.home_player_id || ""))) {
      return NextResponse.json({ error: "Invalid homeId (player_id)", received: row.home_player_id }, { status: 400 })
    }
    if (!uuidLike.test(String(row.away_player_id || ""))) {
      return NextResponse.json({ error: "Invalid awayId (player_id)", received: row.away_player_id }, { status: 400 })
    }

    // Use upsert to handle both new and existing records reliably
    // Saving fixture to database
    
    try {
      const { data: saved, error } = await admin
        .from("fixtures")
        .upsert([row])
        .select()
        .single()
      
      if (error) {
        console.error("Database error during upsert:", error)
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // Log the error and continue - no special handling needed since we don't use registration IDs
        
        throw error
      }
      
      // Fixture saved successfully
      return NextResponse.json({ ok: true, fixture: saved, message: "Fixture saved successfully" })
    } catch (dbError) {
      console.error("Exception during database operation:", dbError)
      throw dbError
    }
      } catch (error) {
      console.error("Error saving fixture:", error)
      return NextResponse.json({ 
        error: "Failed to save fixture", 
        details: String((error as any)?.message || error),
        errorCode: (error as any)?.code,
        errorHint: (error as any)?.hint
      }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
  try {
    let id: string | null = null
    let tournamentId: string | null = null
    try {
      const body = await request.json()
      id = body?.id ? String(body.id) : null
      tournamentId = body?.tournamentId ? String(body.tournamentId) : null
    } catch {
      const { searchParams } = new URL(request.url)
      id = searchParams.get("id")
      tournamentId = searchParams.get("tournamentId")
    }

    const client = await createClient()

    if (tournamentId) {
      const { error } = await client.from("fixtures").delete().eq("tournament_id", tournamentId)
      if (error) throw error
      return NextResponse.json({ ok: true, cleared: true })
    }

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    if (id === "__all__") {
      const { error } = await client.from("fixtures").delete().neq("id", "")
      if (error) throw error
      return NextResponse.json({ ok: true, cleared: true })
    }

    const { error } = await client.from("fixtures").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting fixture:", error)
    return NextResponse.json({ error: "Failed to delete fixture" }, { status: 500 })
  }
}
