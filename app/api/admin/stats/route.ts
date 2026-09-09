import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { GET as standingsGET } from "@/app/api/standings/route"
import { GET as leadersGET } from "@/app/api/player-stats/route"
import { csvCell, statsFields } from "@/lib/stats-overrides"

async function tournament(id?: string | null) {
  const db = createAdminClient()
  let q = db.from("tournaments").select("id,config")
  if (id) q = q.eq("id", id)
  else q = q.eq("status", "ACTIVE")
  const { data, error } = await q.order("updated_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return { db, row: data }
}
async function read(request: Request, id: string) {
  const url = new URL(request.url)
  url.searchParams.set("tournamentId", id)
  const [s, l] = await Promise.all([standingsGET(new NextRequest(url)), leadersGET(new Request(url))])
  if (!s.ok || !l.ok) throw new Error("Could not load statistics")
  const [standings, leaders] = await Promise.all([s.json(), l.json()])
  return {
    standings: standings.standings.map((r: any) => ({ id: r.playerId, name: r.playerName, team: r.team || "-", P: r.played, W: r.won, D: r.drawn, L: r.lost, GF: r.goalsFor, GA: r.goalsAgainst, GD: r.goalDifference, Pts: r.points, overridden: r.overridden || {} })),
    leaders: {
      scorers: leaders.topScorers.map((r: any) => ({ id: r.id, name: r.name, team: r.team, G: r.goals })),
      assists: leaders.topAssists.map((r: any) => ({ id: r.id, name: r.name, team: r.team, A: r.assists })),
      discipline: leaders.discipline.map((r: any) => ({ id: r.id, name: r.name, team: r.team, YC: r.yellow_cards, RC: r.red_cards })),
    },
  }
}
export async function GET(request: Request) {
  try {
    const { row } = await tournament(new URL(request.url).searchParams.get("tournamentId"))
    if (!row) return NextResponse.json({ standings: [], leaders: { scorers: [], assists: [], discipline: [] } })
    return NextResponse.json(await read(request, row.id))
  } catch {
    return NextResponse.json({ error: "Could not load statistics" }, { status: 503 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, table, id } = body
    const { db, row } = await tournament(body.tournamentId)
    if (!row) return NextResponse.json({ error: "Select an active tournament first." }, { status: 400 })
    if (action === "recompute") return NextResponse.json({ ok: true })
    if (action === "reset_overrides" && !table) {
      const { error } = await db.from("tournaments").update({ config: { ...row.config, stats_overrides: {} } }).eq("id", row.id)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }
    if (!Object.hasOwn(statsFields, table)) return NextResponse.json({ error: "Invalid statistics table" }, { status: 400 })
    const stats = await read(request, row.id)
    const rows = table === "standings" ? stats.standings : stats.leaders[table as keyof typeof stats.leaders]
    if (action === "export") {
      const fields = ["name", "team", ...statsFields[table]]
      return new NextResponse([fields.map(csvCell).join(","), ...rows.map((r: any) => fields.map((f) => csvCell(r[f])).join(","))].join("\n"), { headers: { "Content-Type": "text/csv" } })
    }
    const all = structuredClone(row.config?.stats_overrides || {})
    const patches = { ...(all[table] || {}) }
    const rowId = String(id || crypto.randomUUID())
    if (action === "reset_overrides" || action === "reset_row") {
      if (id) delete patches[rowId]
      else for (const key of Object.keys(patches)) delete patches[key]
    } else if (action === "delete_row") {
      patches[rowId] = { deleted: true }
    } else if (action === "override") {
      const value = Number(body.value)
      if (!statsFields[table].includes(body.field) || !Number.isInteger(value) || Math.abs(value) > 100000 || (body.field !== "GD" && value < 0)) {
        return NextResponse.json({ error: "Invalid statistic" }, { status: 400 })
      }
      patches[rowId] = { ...(patches[rowId] || {}), [body.field]: value }
    } else if (action === "add_row" || action === "update_meta") {
      const patch: Record<string, unknown> = { ...(patches[rowId] || {}) }
      for (const field of ["name", "team"]) if (body[field] !== undefined) {
        if (typeof body[field] !== "string" || body[field].length > 100) return NextResponse.json({ error: "Invalid name or team" }, { status: 400 })
        patch[field] = body[field].trim()
      }
      patches[rowId] = patch
    } else if (action === "save_table") {
      if (!Array.isArray(body.rows) || body.rows.length > 500) return NextResponse.json({ error: "Invalid rows" }, { status: 400 })
      for (const item of body.rows) {
        if (!item.id || typeof item.name !== "string" || !item.name.trim() || item.name.length > 100) return NextResponse.json({ error: "Every row needs a player name" }, { status: 400 })
        const previous = rows.find((r: any) => r.id === item.id)
        const patch = { ...(patches[item.id] || {}) }
        for (const field of ["name", "team", ...statsFields[table]]) {
          const value = item[field] ?? (field === "team" ? "-" : 0)
          if (statsFields[table].includes(field) && (!Number.isInteger(value) || Math.abs(value) > 100000 || (field !== "GD" && value < 0))) return NextResponse.json({ error: "Use whole-number statistics" }, { status: 400 })
          if (field === "team" && (typeof value !== "string" || value.length > 100)) return NextResponse.json({ error: "Invalid team" }, { status: 400 })
          if (!previous || previous[field] !== value) patch[field] = value
        }
        patches[item.id] = patch
      }
    } else return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    all[table] = patches
    const { data: saved, error } = await db.from("tournaments").update({ config: { ...row.config, stats_overrides: all } })
      .eq("id", row.id).eq("config", JSON.stringify(row.config)).select("id").maybeSingle()
    if (error) throw error
    if (!saved) return NextResponse.json({ error: "Statistics changed. Refresh and try again." }, { status: 409 })
    return NextResponse.json({ ok: true, id: rowId })
  } catch {
    return NextResponse.json({ error: "Could not save statistics" }, { status: 503 })
  }
}
