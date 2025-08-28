import { type NextRequest, NextResponse } from "next/server"

// Global single store for fixtures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any
if (!g.__memoryFixtures) g.__memoryFixtures = [] as any[]
if (!g.__adminLeaders) g.__adminLeaders = { scorers: [] as any[], assists: [] as any[], discipline: [] as any[] }
let memoryFixtures: any[] | null = g.__memoryFixtures

function bumpLeadersFromFixture(fx: any) {
  try {
    const isPlayed = String(fx.status || "").toUpperCase() === "PLAYED"
    if (!isPlayed) return
    const { scorers } = g.__adminLeaders as { scorers: any[] }
    const ensure = (id: string, name?: string, team?: string) => {
      let row = scorers.find((r: any) => String(r.id) === String(id))
      if (!row) { row = { id: String(id), name: name || String(id), team: team || "-", G: 0, overridden: {} }; scorers.push(row) }
      return row
    }
    const h = ensure(String(fx.homePlayer), fx.homeName, fx.homeTeam)
    const a = ensure(String(fx.awayPlayer), fx.awayName, fx.awayTeam)
    h.G = Number(h.G || 0) + Number(fx.homeScore || 0)
    a.G = Number(a.G || 0) + Number(fx.awayScore || 0)
    g.__adminLeaders.scorers = scorers
  } catch {}
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchday = searchParams.get("matchday")
    const status = searchParams.get("status")
    const playerId = searchParams.get("playerId")
    let tournamentId = searchParams.get("tournamentId")

    if (!tournamentId) {
      const active = g.__adminSettings?.tournament?.active_tournament_id || null
      if (active) tournamentId = String(active)
      else return NextResponse.json({ fixtures: [], totalFixtures: 0 })
    }

    if (!memoryFixtures) {
      memoryFixtures = []
      g.__memoryFixtures = memoryFixtures
    }

    let filteredFixtures = memoryFixtures

    if (tournamentId) {
      filteredFixtures = filteredFixtures.filter((fixture) => String(fixture.tournamentId || "") === String(tournamentId))
    }

    if (matchday && matchday !== "all") {
      filteredFixtures = filteredFixtures.filter((fixture) => String(fixture.matchday) === matchday)
    }

    if (status && status !== "all") {
      filteredFixtures = filteredFixtures.filter((fixture) => fixture.status === status)
    }

    if (playerId) {
      filteredFixtures = filteredFixtures.filter(
        (fixture) => fixture.homePlayer === playerId || fixture.awayPlayer === playerId,
      )
    }

    // Enrich with player names/teams if missing
    const byId = new Map((g.__memPlayers || []).map((p: any) => [String(p.id), p]))
    const enriched = filteredFixtures.map((f) => {
      const hid = String(f.homePlayer)
      const aid = String(f.awayPlayer)
      const hp = byId.get(hid)
      const ap = byId.get(aid)
      return {
        ...f,
        homeName: f.homeName || hp?.name || hid,
        awayName: f.awayName || ap?.name || aid,
        homeTeam: f.homeTeam || hp?.preferred_club || null,
        awayTeam: f.awayTeam || ap?.preferred_club || null,
      }
    })

    return NextResponse.json({ fixtures: enriched, totalFixtures: enriched.length })
  } catch (error) {
    console.error("Error fetching fixtures:", error)
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (body?.action === "clear_for_tournament") {
      const tournamentId = String(body.tournamentId || "")
      memoryFixtures = (memoryFixtures || []).filter((f) => String(f.tournamentId || "") !== tournamentId)
      g.__memoryFixtures = memoryFixtures
      return NextResponse.json({ ok: true, cleared: true })
    }
    const fixture = {
      id: String(body.id || crypto.randomUUID()),
      tournamentId: body.tournamentId || null,
      season: body.season || "2024/25",
      matchday: Number(body.matchday || 1),
      homePlayer: String(body.homeId),
      awayPlayer: String(body.awayId),
      homeScore: body.homeScore ?? null,
      awayScore: body.awayScore ?? null,
      status: String(body.status || "SCHEDULED").toUpperCase(),
      scheduledDate: body.date || null,
      forfeitWinnerId: body.forfeitWinnerId || null,
      notes: body.notes || "",
      homeName: body.homeName || null,
      awayName: body.awayName || null,
      homeTeam: body.homeTeam || null,
      awayTeam: body.awayTeam || null,
    }

    if (!fixture.season || !fixture.matchday || !fixture.homePlayer || !fixture.awayPlayer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!memoryFixtures) memoryFixtures = []
    const idx = memoryFixtures.findIndex((f) => String(f.id) === String(fixture.id))
    if (idx >= 0) memoryFixtures[idx] = { ...memoryFixtures[idx], ...fixture }
    else memoryFixtures.unshift(fixture)
    g.__memoryFixtures = memoryFixtures

    bumpLeadersFromFixture(fixture)

    return NextResponse.json({ ok: true, fixture })
  } catch (error) {
    console.error("Error saving fixture:", error)
    return NextResponse.json({ error: "Failed to save fixture" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let id: string | null = null
    let tournamentId: string | null = null
    try {
      const body = await request.json()
      id = body?.id ? String(body.id) : null
      tournamentId = body?.tournamentId ? String(body.tournamentId) : null
    } catch {
      const { searchParams } = new URL(request.url)
      id = searchParams.get("id")
      tournamentId = searchParams.get("tournamentId")
    }

    if (!memoryFixtures) memoryFixtures = []

    if (tournamentId) {
      memoryFixtures = memoryFixtures.filter((f) => String(f.tournamentId || "") !== String(tournamentId))
      g.__memoryFixtures = memoryFixtures
      return NextResponse.json({ ok: true, cleared: true })
    }

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    if (id === "__all__") {
      memoryFixtures = []
      g.__memoryFixtures = memoryFixtures
      return NextResponse.json({ ok: true, cleared: true })
    }

    memoryFixtures = memoryFixtures.filter((f) => String(f.id) !== String(id))
    g.__memoryFixtures = memoryFixtures
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting fixture:", error)
    return NextResponse.json({ error: "Failed to delete fixture" }, { status: 500 })
  }
}
