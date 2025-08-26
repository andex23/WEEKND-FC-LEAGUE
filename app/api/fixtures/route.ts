import { type NextRequest, NextResponse } from "next/server"

let memoryFixtures: any[] | null = null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchday = searchParams.get("matchday")
    const status = searchParams.get("status")
    const playerId = searchParams.get("playerId")
    const tournamentId = searchParams.get("tournamentId")

    if (!memoryFixtures) {
      // Do not auto-seed; start empty until admin creates fixtures
      memoryFixtures = []
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

    return NextResponse.json({ fixtures: filteredFixtures, totalFixtures: filteredFixtures.length })
  } catch (error) {
    console.error("Error fetching fixtures:", error)
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // expected fields from admin UI
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
    }

    if (!fixture.season || !fixture.matchday || !fixture.homePlayer || !fixture.awayPlayer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!memoryFixtures) memoryFixtures = []
    const idx = memoryFixtures.findIndex((f) => String(f.id) === String(fixture.id))
    if (idx >= 0) memoryFixtures[idx] = { ...memoryFixtures[idx], ...fixture }
    else memoryFixtures.unshift(fixture)

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
      return NextResponse.json({ ok: true, cleared: true })
    }

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    if (id === "__all__") {
      memoryFixtures = []
      return NextResponse.json({ ok: true, cleared: true })
    }

    memoryFixtures = memoryFixtures.filter((f) => String(f.id) !== String(id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting fixture:", error)
    return NextResponse.json({ error: "Failed to delete fixture" }, { status: 500 })
  }
}
