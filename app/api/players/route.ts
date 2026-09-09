import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const client = await createClient()
    const { data, error } = await client.from("players")
      .select("id,name,preferred_club,assigned_club,console,avatar_url").eq("status", "approved")
    if (error) throw error
    return NextResponse.json({ players: data || [] })
  } catch {
    return NextResponse.json({ error: "Unable to load players" }, { status: 503 })
  }
}
