import { NextResponse } from "next/server"

let tournaments: any[] = [ { id: "t1", name: "Weekend FC", status: "ACTIVE", season: "2024/25", type: "DOUBLE", players: 16, rules: "", created_at: new Date().toISOString() } ]

export async function GET() { return NextResponse.json({ tournaments }) }

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { action } = body
  if (action === "create") {
    const id = Math.random().toString(36).slice(2,10)
    const t = {
      id,
      name: body.name || "New Tournament",
      status: body.status || "DRAFT",
      season: body.season || "",
      type: (body.type || "DOUBLE").toUpperCase(),
      players: Number(body.players || 0),
      rules: body.rules || "",
      created_at: new Date().toISOString(),
    }
    tournaments.unshift(t)
    return NextResponse.json({ ok:true, tournament: t })
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
  return NextResponse.json({ ok:false, error:"unknown action" }, { status:400 })
}
