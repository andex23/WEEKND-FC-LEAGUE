import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMemRegistrations, setMemRegistrations, clearMemRegistrations } from "@/lib/mocks/registrations"

export async function GET() {
  try {
    const mem = getMemRegistrations()
    if (mem && mem.length > 0) {
      return NextResponse.json({ registrations: mem, total: mem.length })
    }

    const sb = await createClient()

    const { data, error } = await sb
      .from("users")
      .select("id,name,console,location,status,created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

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
    const mem = getMemRegistrations()
    return NextResponse.json({ registrations: mem || [], total: mem?.length || 0 })
  }
}

export async function POST(request: Request) {
  // Utility for mocking: seed or clear
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.action === "seed6") {
      const now = new Date().toISOString()
      const six = [
        { id: "1", name: "Player One", console: "PS5", preferred_club: "Arsenal", status: "pending", created_at: now },
        { id: "2", name: "Player Two", console: "XBOX", preferred_club: "Chelsea", status: "pending", created_at: now },
        { id: "3", name: "Player Three", console: "PS5", preferred_club: "Liverpool", status: "pending", created_at: now },
        { id: "4", name: "Player Four", console: "PC", preferred_club: "Man City", status: "pending", created_at: now },
        { id: "5", name: "Player Five", console: "PS5", preferred_club: "Spurs", status: "pending", created_at: now },
        { id: "6", name: "Player Six", console: "XBOX", preferred_club: "Newcastle", status: "pending", created_at: now },
      ]
      setMemRegistrations(six as any)
      return NextResponse.json({ ok: true, registrations: six })
    }
    if (body?.action === "clear") {
      clearMemRegistrations()
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
