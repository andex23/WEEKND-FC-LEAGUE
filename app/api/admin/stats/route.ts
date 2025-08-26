import { NextResponse } from "next/server"

// In-memory demo data
let standings = [
  { id: "1", name: "Alex", team: "Man United", P: 10, W: 6, D: 2, L: 2, GF: 18, GA: 10, GD: 8, Pts: 20, overridden: {} as Record<string, boolean> },
  { id: "2", name: "Jordan", team: "Man City", P: 10, W: 5, D: 3, L: 2, GF: 16, GA: 11, GD: 5, Pts: 18, overridden: {} },
]
let scorers = [ { id: "1", name: "Alex", team: "Man United", G: 12, overridden: {} as Record<string, boolean> } ]
let assists = [ { id: "2", name: "Jordan", team: "Man City", A: 9, overridden: {} as Record<string, boolean> } ]
let discipline = [ { id: "3", name: "Sam", team: "Chelsea", YC: 3, RC: 0, overridden: {} as Record<string, boolean> } ]

export async function GET() {
  return NextResponse.json({ standings, leaders: { scorers, assists, discipline } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { action } = body
  if (action === "recompute") {
    // For demo, just echo success
    return NextResponse.json({ ok: true })
  }
  if (action === "reset_overrides") {
    standings = standings.map((r) => ({ ...r, overridden: {} }))
    scorers = scorers.map((r) => ({ ...r, overridden: {} }))
    assists = assists.map((r) => ({ ...r, overridden: {} }))
    discipline = discipline.map((r) => ({ ...r, overridden: {} }))
    return NextResponse.json({ ok: true })
  }
  if (action === "export") {
    const table = String(body.table || "standings")
    let headers: string[] = []
    let rows: string[] = []
    if (table === "standings") {
      headers = ["name","team","P","W","D","L","GF","GA","GD","Pts"]
      rows = standings.map((r) => [r.name,r.team,r.P,r.W,r.D,r.L,r.GF,r.GA,r.GD,r.Pts].join(","))
    } else if (table === "scorers") {
      headers = ["name","team","G"]
      rows = scorers.map((r) => [r.name,r.team,r.G].join(","))
    } else if (table === "assists") {
      headers = ["name","team","A"]
      rows = assists.map((r) => [r.name,r.team,r.A].join(","))
    } else if (table === "discipline") {
      headers = ["name","team","YC","RC"]
      rows = discipline.map((r) => [r.name,r.team,r.YC,r.RC].join(","))
    } else {
      headers = ["name","team"]
      rows = []
    }
    const csv = [headers.join(","), ...rows].join("\n")
    return new NextResponse(csv, { headers: { "content-type": "text/csv" } })
  }
  if (action === "override") {
    const { table, id, field, value } = body
    const val = Number(value)
    if (Number.isNaN(val) || val < 0) return NextResponse.json({ ok: false, error: "Invalid value" }, { status: 400 })
    const upd = (row: any) => ({ ...row, [field]: val, overridden: { ...row.overridden, [field]: true } })
    if (table === "standings") standings = standings.map((r) => (r.id === id ? upd(r) : r))
    if (table === "scorers") scorers = scorers.map((r) => (r.id === id ? upd(r) : r))
    if (table === "assists") assists = assists.map((r) => (r.id === id ? upd(r) : r))
    if (table === "discipline") discipline = discipline.map((r) => (r.id === id ? upd(r) : r))
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 })
}
