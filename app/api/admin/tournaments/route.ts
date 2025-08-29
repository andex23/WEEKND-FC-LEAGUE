import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const client = await createClient()
    const { data, error } = await client.from("tournaments").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ tournaments: data || [] })
  } catch (error) {
    console.error("Error loading tournaments:", error)
    return NextResponse.json({ tournaments: [] })
  }
}

export async function POST(req: Request) {
  try {
    const client = await createClient()
    const admin = createAdminClient()
    const body = await req.json()
    const { action, ...data } = body

    if (action === "create") {
      // Primary shape (newer schema)
      const insertData: any = {
        name: data.name,
        status: data.status || "DRAFT",
        season: data.season || "2024/25",
        type: data.type || "DOUBLE",
        players: data.players || 0,
        rules: data.rules || "",
        match_length: data.match_length || 6,
        matchdays: data.matchdays || ["Sat", "Sun"],
        start_at: data.start_at || null,
        end_at: data.end_at || null,
        is_active: !!data.is_active,
      }
      // Try admin insert (bypass RLS). Fallback to minimal schema if needed.
      let created: any | null = null
      try {
        const { data: row, error } = await admin.from("tournaments").insert([insertData]).select().single()
        if (error) throw error
        created = row
      } catch (e: any) {
        // Retry with lowercase status for older schemas with lowercase CHECK
        try {
          const lowered = { name: String(data.name || ""), status: String(data.status || "draft").toLowerCase() }
          const { data: row2, error: err2 } = await admin.from("tournaments").insert([lowered]).select().single()
          if (err2) throw err2
          created = row2
        } catch (e2) {
          console.error("create tournament fallback failed", e2)
          throw e2
        }
      }
      return NextResponse.json({ success: true, tournament: created })
    }

    if (action === "update") {
      // Accept either flat fields or { patch } wrapper
      const src: any = typeof (data as any).patch === 'object' ? (data as any).patch : data
      const patch: any = {}
      if (typeof src.name !== 'undefined') patch.name = src.name
      if (typeof src.season !== 'undefined') patch.season = src.season
      if (typeof src.type !== 'undefined') patch.type = src.type
      if (typeof src.status !== 'undefined') patch.status = src.status
      if (typeof src.players !== 'undefined') patch.players = src.players
      if (typeof src.rules !== 'undefined') patch.rules = src.rules
      if (typeof src.match_length !== 'undefined') patch.match_length = src.match_length
      if (typeof src.matchdays !== 'undefined') patch.matchdays = src.matchdays
      if (typeof src.start_at !== 'undefined') patch.start_at = src.start_at
      if (typeof src.end_at !== 'undefined') patch.end_at = src.end_at
      patch.updated_at = new Date().toISOString()

      const { data: updated, error } = await admin
        .from("tournaments")
        .update(patch)
        .eq("id", String(data.id))
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, tournament: updated })
    }

    if (action === "delete") {
      const { error } = await admin.from("tournaments").delete().eq("id", String(data.id))
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "sync_roster") {
      // Best-effort: count approved players
      const { count, error: cntErr } = await admin
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
      if (cntErr) throw cntErr

      // Try to persist into tournaments.players if the column exists; otherwise, just return the count
      let persisted = false
      try {
        const { error: upErr } = await admin
          .from("tournaments")
          .update({ players: count || 0, updated_at: new Date().toISOString() })
          .eq("id", String(data.id))
        if (!upErr) persisted = true
      } catch {}

      return NextResponse.json({ success: true, count: count || 0, persisted })
    }

    if (action === "activate") {
      // Deactivate all
      await admin.from("tournaments").update({ is_active: false, status: "DRAFT" }).eq("is_active", true)
      // Activate target
      const { data: activated, error } = await admin
        .from("tournaments")
        .update({ is_active: true, status: "ACTIVE", updated_at: new Date().toISOString() })
        .eq("id", String(data.id))
        .select()
        .single()
      if (error) throw error
      // Best-effort update of league_settings
      try {
        await admin.from("league_settings").update({ active_tournament_id: activated.id, status: "ACTIVE" }).neq("id", "")
      } catch {}
      return NextResponse.json({ success: true, tournament: activated })
    }

    if (action === "deactivate") {
      // Deactivate target tournament
      const { data: deactivated, error } = await admin
        .from("tournaments")
        .update({ is_active: false, status: "DRAFT", updated_at: new Date().toISOString() })
        .eq("id", String(data.id))
        .select()
        .single()
      if (error) throw error
      // Best-effort update of league_settings
      try {
        await admin.from("league_settings").update({ active_tournament_id: null, status: "INACTIVE" }).neq("id", "")
      } catch {}
      return NextResponse.json({ success: true, tournament: deactivated })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error with tournaments:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
