import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const client = await createClient()
    const { data, error } = await client.from("league_settings").select("*").limit(1).single()
    if (error) throw error
    return NextResponse.json(data || {})
  } catch (error) {
    console.error("Error loading settings:", error)
    return NextResponse.json({})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { section, data } = body
    const client = await createClient()

    // Load current
    const { data: current } = await client.from("league_settings").select("*").limit(1).single()
    let next = current || {}

    if (section && data) {
      next = { ...next, [section]: { ...(next as any)[section], ...data } }
      if (section === "tournament" && data?.active_tournament_id) {
        next.active_tournament_id = data.active_tournament_id
      }
    } else {
      next = { ...next, ...body }
    }

    // Upsert (assumes single row table)
    const { data: saved, error } = await client.from("league_settings").upsert(next, { onConflict: "id" }).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, settings: saved })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
