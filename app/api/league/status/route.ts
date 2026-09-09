import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const db = createAdminClient()
    const [settings, active, players, storage] = await Promise.all([
      db.from("league_settings").select("*").limit(1).maybeSingle(),
      db.from("tournaments").select("*").eq("status", "ACTIVE").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("players").select("id", { count: "exact", head: true }).eq("status", "approved"),
      db.from("tournaments").select("config").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ])
    if (settings.error || active.error || players.error || storage.error) throw new Error("Database unavailable")
    const league = settings.data
    const options = storage.data?.config?.league_options || {}
    return NextResponse.json({
      id: league?.id || "default", name: active.data?.name || league?.season_name || "Weekend FC League",
      status: active.data?.status || league?.status || "DRAFT", startDate: active.data?.start_at || league?.start_date || null,
      endDate: active.data?.end_at || league?.end_date || null, rounds: options.rounds || 2,
      matchdaysPerWeekend: options.matchdaysPerWeekend || 3, teamsLocked: league?.teams_locked || false,
      totalPlayers: players.count || 0, maxPlayers: options.maxPlayers || 20, activeTournamentId: active.data?.id || null,
    })
  } catch {
    return NextResponse.json({ error: "Could not load league status" }, { status: 503 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    if (body.status !== undefined && !["DRAFT", "ACTIVE", "INACTIVE", "COMPLETED"].includes(body.status)) return NextResponse.json({ error: "Invalid league status" }, { status: 400 })
    if ((body.rounds !== undefined && ![1, 2].includes(body.rounds)) || (body.matchdaysPerWeekend !== undefined && ![1, 2, 3].includes(body.matchdaysPerWeekend))) return NextResponse.json({ error: "Choose 1–2 rounds and 1–3 matchdays" }, { status: 400 })
    if (body.teamsLocked !== undefined && typeof body.teamsLocked !== "boolean") return NextResponse.json({ error: "Invalid teamsLocked value" }, { status: 400 })
    const db = createAdminClient()
    const { data: league, error } = await db.from("league_settings").select("id").limit(1).maybeSingle()
    if (error || !league) throw new Error("League settings unavailable")
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [input, column] of Object.entries({ status: "status", teamsLocked: "teams_locked", startDate: "start_date", endDate: "end_date" })) {
      if (body[input] !== undefined) patch[column] = body[input]
    }
    const { error: saveError } = await db.from("league_settings").update(patch).eq("id", league.id)
    if (saveError) throw saveError
    if (body.rounds !== undefined || body.matchdaysPerWeekend !== undefined) {
      const { data: storage, error: readError } = await db.from("tournaments").select("id,config").order("created_at", { ascending: true }).limit(1).maybeSingle()
      if (readError || !storage) throw new Error("Create a tournament before saving its schedule")
      const options = { ...storage.config?.league_options }
      if (body.rounds !== undefined) options.rounds = body.rounds
      if (body.matchdaysPerWeekend !== undefined) options.matchdaysPerWeekend = body.matchdaysPerWeekend
      const { error: optionError } = await db.from("tournaments").update({ config: { ...storage.config, league_options: options } }).eq("id", storage.id)
      if (optionError) throw optionError
    }
    return NextResponse.json({ message: "League settings saved" })
  } catch {
    return NextResponse.json({ error: "Could not save league settings" }, { status: 503 })
  }
}
