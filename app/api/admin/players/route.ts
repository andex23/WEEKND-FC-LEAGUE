import { NextResponse } from "next/server"
import { listPlayers, addPlayer, updatePlayer, deletePlayer, clearPlayers } from "@/lib/mocks/players"

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
  if (action === "clear") {
    clearPlayers()
    return NextResponse.json({ ok: true })
  }
  if (action === "seed6") {
    const now = new Date().toISOString()
    const sample = [
      { name: "Alex Rodriguez", gamer_tag: "CR7_Alex99", console: "PS5", preferred_club: "Man United", location: "London" },
      { name: "Jordan Smith", gamer_tag: "MessiKing10", console: "XBOX", preferred_club: "Man City", location: "Manchester" },
      { name: "Sam Wilson", gamer_tag: "BluesSam", console: "PS5", preferred_club: "Chelsea", location: "Birmingham" },
      { name: "Ryan Taylor", gamer_tag: "ArsenalRyan", console: "PC", preferred_club: "Arsenal", location: "London" },
      { name: "Mike Johnson", gamer_tag: "LFC_Mike", console: "PS5", preferred_club: "Liverpool", location: "Liverpool" },
      { name: "Tom Brown", gamer_tag: "SpursTom", console: "XBOX", preferred_club: "Spurs", location: "London" },
    ] as const
    for (const s of sample) {
      addPlayer({ id: crypto.randomUUID(), name: s.name, gamer_tag: s.gamer_tag, console: s.console as any, preferred_club: s.preferred_club, location: s.location, active: true, created_at: now })
    }
    return NextResponse.json({ ok: true, players: listPlayers() })
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
