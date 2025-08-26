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
  // Utility for mocking: seed, clear, add, import
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.action === "seed6") {
      const now = new Date().toISOString()
      const six = [
        { id: "1", name: "Player One", gamer_tag: "player1", console: "PS5", preferred_club: "Arsenal", location: "London", status: "pending", created_at: now },
        { id: "2", name: "Player Two", gamer_tag: "player2", console: "XBOX", preferred_club: "Chelsea", location: "Manchester", status: "pending", created_at: now },
        { id: "3", name: "Player Three", gamer_tag: "player3", console: "PS5", preferred_club: "Liverpool", location: "Liverpool", status: "pending", created_at: now },
        { id: "4", name: "Player Four", gamer_tag: "player4", console: "PC", preferred_club: "Man City", location: "Leeds", status: "pending", created_at: now },
        { id: "5", name: "Player Five", gamer_tag: "player5", console: "PS5", preferred_club: "Spurs", location: "Birmingham", status: "pending", created_at: now },
        { id: "6", name: "Player Six", gamer_tag: "player6", console: "XBOX", preferred_club: "Newcastle", location: "Newcastle", status: "pending", created_at: now },
      ]
      setMemRegistrations(six as any)
      return NextResponse.json({ ok: true, registrations: six })
    }
    if (body?.action === "clear") {
      clearMemRegistrations()
      return NextResponse.json({ ok: true })
    }
    if (body?.action === "add") {
      const current = getMemRegistrations() || []
      const now = new Date().toISOString()
      const id = String(body.id || crypto.randomUUID())
      const reg = {
        id,
        name: String(body.name || "New Player"),
        gamer_tag: String(body.gamer_tag || body.gamertag || ""),
        console: String(body.console || "PS5"),
        preferred_club: String(body.preferred_club || ""),
        location: String(body.location || ""),
        status: String(body.status || "pending"),
        created_at: now,
      }
      setMemRegistrations([reg as any, ...current])
      return NextResponse.json({ ok: true, registration: reg })
    }
    if (body?.action === "import") {
      const rows = Array.isArray(body.rows) ? body.rows : []
      const current = getMemRegistrations() || []
      const now = new Date().toISOString()
      const mapped = rows.map((r: any) => ({
        id: String(r.id || crypto.randomUUID()),
        name: String(r.name || "Unnamed"),
        gamer_tag: String(r.gamer_tag || r.gamertag || ""),
        console: String(r.console || "PS5"),
        preferred_club: String(r.preferred_club || ""),
        location: String(r.location || ""),
        status: String(r.status || "pending"),
        created_at: now,
      }))
      setMemRegistrations([...mapped as any, ...current])
      return NextResponse.json({ ok: true, added: mapped.length })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
