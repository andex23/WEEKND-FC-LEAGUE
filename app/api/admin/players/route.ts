import { NextResponse } from "next/server"
import { listPlayers, addPlayer, updatePlayer, deletePlayer } from "@/lib/mocks/players"

export async function GET() {
  return NextResponse.json({ players: listPlayers() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const action = body?.action || "create"
  if (action === "create") {
    const now = new Date().toISOString()
    addPlayer({ id: String(body.id || crypto.randomUUID()), name: String(body.name), gamer_tag: body.gamer_tag || "", console: String(body.console || "PS5") as any, preferred_club: body.preferred_club || "", location: body.location || "", active: body.active !== false, created_at: now })
    return NextResponse.json({ ok: true })
  }
  if (action === "update") {
    updatePlayer(String(body.id), body.patch || {})
    return NextResponse.json({ ok: true })
  }
  if (action === "delete") {
    deletePlayer(String(body.id))
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
