import { NextResponse } from "next/server"

// Minimal in-memory stores referencing existing endpoints
let memNotifications: any[] = []

export async function POST(request: Request) {
  const { action } = await request.json().catch(() => ({ action: "reset" }))
  if (action === "reset") {
    try {
      // Clear fixtures in-memory store
      await fetch(process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/fixtures?id=__all__` : "http://localhost:3000/api/fixtures?id=__all__", { method: "DELETE" }).catch(() => {})
    } catch {}
    memNotifications = []
    return NextResponse.json({ ok: true, cleared: true })
  }

  if (action === "seed_six") {
    const now = new Date().toISOString()
    const six = [
      { id: "1", name: "Player One", console: "PS5", preferred_club: "Arsenal", status: "pending", created_at: now },
      { id: "2", name: "Player Two", console: "XBOX", preferred_club: "Chelsea", status: "pending", created_at: now },
      { id: "3", name: "Player Three", console: "PS5", preferred_club: "Liverpool", status: "pending", created_at: now },
      { id: "4", name: "Player Four", console: "PC", preferred_club: "Man City", status: "pending", created_at: now },
      { id: "5", name: "Player Five", console: "PS5", preferred_club: "Spurs", status: "pending", created_at: now },
      { id: "6", name: "Player Six", console: "XBOX", preferred_club: "Newcastle", status: "pending", created_at: now },
    ]
    // This project fetches registrations from Supabase; provide fallback via notifications to indicate seeding
    memNotifications.unshift({ id: `seed-${now}`, title: "Seeded demo users", body: "6 demo users available (mock layer)", created_at: now })
    return NextResponse.json({ ok: true, players: six })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
