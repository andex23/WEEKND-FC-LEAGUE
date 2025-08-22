import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const sb = await createClient()
    if (!sb) throw new Error("Supabase not configured")

    const { data, error } = await sb
      .from("users")
      .select("id,name,console,location,status,created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Map to UI shape (preferred_team left null for now)
    const items = (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      console: u.console,
      preferred_team: null as string | null,
      status: u.status,
      created_at: u.created_at,
    }))

    return NextResponse.json({ registrations: items, total: items.length })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ registrations: [], total: 0 })
  }
}
