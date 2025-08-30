import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const client = await createClient()
    const { data, error } = await client
      .from("players")
      .select("*")
      .order("created_at", { ascending: true })
    if (error) throw error
    return NextResponse.json({ players: data || [] })
  } catch (error) {
    console.error("Error loading players:", error)
    return NextResponse.json({ players: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    // Debug environment variables
    console.log("Environment check:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      action: action
    })
    
    // Use regular client for most operations, admin client only for destructive ops
    try {
      const client = await createClient()
      console.log("Regular client created successfully")
      const admin = createAdminClient()
      console.log("Admin client created successfully")
    } catch (clientError) {
      console.error("Error creating clients:", clientError)
      throw clientError
    }
    
    const client = await createClient()
    const admin = createAdminClient()

    if (action === "clear") {
      // Fetch all UUIDs first, then delete by IN (avoids invalid uuid comparisons)
      const { data: rows, error: selErr } = await admin.from("players").select("id")
      if (selErr) throw selErr
      const ids = (rows || []).map((r: any) => r.id).filter(Boolean)
      if (ids.length === 0) return NextResponse.json({ success: true })
      const { error } = await admin.from("players").delete().in("id", ids)
      if (error) throw error
      return NextResponse.json({ success: true, deleted: ids.length })
    }

    if (action === "add") {
      // Only include columns that exist in DB schema
      const insertData: any = {
        user_id: data.user_id || null,
        username: data.username || null,
        name: data.name,
        psn_name: data.psn_name || null,
        location: data.location || null,
        console: data.console,
        preferred_club: data.preferred_club,
        assigned_club: data.assigned_club || null,
        role: data.role || 'PLAYER',
        status: (data.status || 'pending')
      }
      console.log("Attempting to insert player:", insertData)
      const { data: created, error } = await admin.from("players").insert([insertData]).select().single()
      if (error) {
        console.error("Database error:", error)
        throw error
      }
      console.log("Successfully created player:", created)
      return NextResponse.json({ success: true, player: created })
    }

    if (action === "update") {
      // Accept either top-level fields or { patch } wrapper from older UI
      const src: any = typeof (data as any).patch === 'object' ? (data as any).patch : data
      const patch: any = {}
      if (typeof src.username !== 'undefined') patch.username = src.username
      if (typeof src.name !== 'undefined') patch.name = src.name
      if (typeof src.psn_name !== 'undefined') patch.psn_name = src.psn_name
      if (typeof src.location !== 'undefined') patch.location = src.location
      if (typeof src.console !== 'undefined') patch.console = src.console
      if (typeof src.preferred_club !== 'undefined') patch.preferred_club = src.preferred_club
      if (typeof src.assigned_club !== 'undefined') patch.assigned_club = src.assigned_club
      if (typeof src.role !== 'undefined') patch.role = src.role
      if (typeof src.status !== 'undefined') patch.status = src.status
      patch.updated_at = new Date().toISOString()

      const id = String(data.id || '')
      const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

      if (uuidLike.test(id)) {
        const { data: updated, error } = await admin
          .from("players")
          .update(patch)
          .eq("id", id)
          .select()
          .single()
        if (error) throw error
        return NextResponse.json({ success: true, player: updated })
      } else {
        // Fallback: update by name + (username or psn_name) when id isn't a UUID
        const fallbackName = src.name || data.name
        const fallbackUsername = src.username || src.gamer_tag || data.username
        const fallbackPsn = src.psn_name || src.gamer_tag || data.psn_name
        if (!fallbackName || (!fallbackUsername && !fallbackPsn)) {
          return NextResponse.json({ success: true, note: "No-op for non-uuid id" })
        }
        let q = admin.from("players").update(patch).eq("name", fallbackName)
        if (fallbackUsername && fallbackPsn) q = q.or(`username.eq.${fallbackUsername},psn_name.eq.${fallbackPsn}`)
        else if (fallbackUsername) q = q.eq("username", fallbackUsername)
        else if (fallbackPsn) q = q.eq("psn_name", fallbackPsn)
        const { error } = await q
        if (error) throw error
        return NextResponse.json({ success: true })
      }
    }

    if (action === "delete") {
      const id = String(data.id || "")
      console.log("Attempting to delete player with ID:", id)
      
      const uuidLike = /^[0-9a-fA-F-]{36}$/
      let error
      
      if (uuidLike.test(id)) {
        console.log("Using UUID delete method with admin client")
        const { error: deleteError } = await admin.from("players").delete().eq("id", id)
        error = deleteError
      } else {
        console.log("Using fallback delete method with admin client")
        // Fallback: delete by username/psn_name and name if provided
        const name = data.name || null
        const username = data.username || null
        const psn = data.psn_name || null
        if (name && (username || psn)) {
          const { error: deleteError } = await admin.from("players").delete().eq("name", name).or(`${username ? `username.eq.${username}` : ""}${username && psn ? "," : ""}${psn ? `psn_name.eq.${psn}` : ""}`)
          error = deleteError
        } else {
          // As a last resort, do nothing to avoid accidental mass deletions
          return NextResponse.json({ error: "Missing identifiers" }, { status: 400 })
        }
      }
      
      if (error) {
        console.error("Delete error:", error)
        throw error
      }
      
      console.log("Successfully deleted player")
      return NextResponse.json({ success: true })
    }

    if (action === "approve") {
      const { data: updated, error } = await admin
        .from("players")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", String(data.id))
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, player: updated })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error with players:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ error: "Failed to process request", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
