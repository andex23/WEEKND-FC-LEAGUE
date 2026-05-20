import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const cookieStore = await cookies()
  if (cookieStore.get("wfc_admin")?.value !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data, error } = await createAdminClient()
    .from("players")
    .select("id,name,username,console,location,preferred_club,status,created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }

  const registrations = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    username: p.username,
    console: p.console,
    location: p.location,
    preferred_team: p.preferred_club,
    status: p.status,
    created_at: p.created_at,
  }))

  return NextResponse.json({ registrations, total: registrations.length })
}
