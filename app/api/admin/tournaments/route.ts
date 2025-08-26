import { NextResponse } from "next/server"
import { activePlayers, snapshotTournamentPlayers, syncTournamentPlayers, getTournamentPlayers } from "@/lib/mocks/players"

let tournaments: any[] = []

export async function GET() { return NextResponse.json({ tournaments }) }

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { action } = body
  if (action === "create") {
    const id = Math.random().toString(36).slice(2,10)
    const roster = activePlayers()
    if (roster.length < 6) return NextResponse.json({ error: "Need at least 6 players" }, { status: 400 })
    if (roster.length % 2 !== 0) return NextResponse.json({ error: "Even number required" }, { status: 400 })
    const t = {
      id,
      name: body.name || "New Tournament",
      status: body.status || "DRAFT",
      season: body.season || "",
      type: (body.type || "DOUBLE").toUpperCase(),
      players: roster.length,
      rules: body.rules || "",
      match_length: body.match_length || 6,
      matchdays: body.matchdays || ["Sat","Sun"],
      created_at: new Date().toISOString(),
    }
    tournaments.unshift(t)
    snapshotTournamentPlayers(id)
    return NextResponse.json({ ok:true, tournament: t, snapshotted: roster.length })
  }
  if (action === "update") {
    const { id, patch } = body
    tournaments = tournaments.map((t) => (t.id === id ? { ...t, ...patch } : t))
    return NextResponse.json({ ok:true })
  }
  if (action === "delete") {
    const { id } = body
    tournaments = tournaments.filter((t) => t.id !== id)
    return NextResponse.json({ ok:true })
  }
  if (action === "sync_roster") {
    const { id } = body
    const after = syncTournamentPlayers(id)
    return NextResponse.json({ ok: true, count: after.length })
  }
  if (action === "roster") {
    const { id } = body
    return NextResponse.json({ players: getTournamentPlayers(id) })
  }
  return NextResponse.json({ ok:false, error:"unknown action" }, { status:400 })
}
