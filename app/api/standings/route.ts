import { type NextRequest, NextResponse } from "next/server"
import { calculateStandings } from "@/lib/utils/standings"
import { activePlayers, getTournamentPlayers } from "@/lib/mocks/players"

export async function GET(request: NextRequest) {
  try {
    // Global in-memory stores
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any
    if (!g.__memoryFixtures) g.__memoryFixtures = []
    if (!g.__memPlayers) g.__memPlayers = []

    const { searchParams } = new URL(request.url)
    const consoleFilter = searchParams.get("console")
    let tournamentId = searchParams.get("tournamentId")

    if (!tournamentId) {
      const active = g.__adminSettings?.tournament?.active_tournament_id || null
      if (active) tournamentId = String(active)
    }

    // Filter fixtures to tournament (required for live data correctness)
    const allFixtures = (g.__memoryFixtures as any[]) || []
    const fixtures = tournamentId
      ? allFixtures.filter((f) => String(f.tournamentId || "") === String(tournamentId))
      : []

    // Build players list: prefer tournament snapshot, else active players, else players seen in fixtures
    let playerIds: string[] = []
    if (tournamentId) {
      try { playerIds = getTournamentPlayers(String(tournamentId)) } catch { playerIds = [] }
    }
    let players: any[]
    if (playerIds.length > 0) {
      const byId = new Map((g.__memPlayers as any[]).map((p: any) => [String(p.id), p]))
      players = playerIds.map((id) => byId.get(String(id))).filter(Boolean)
    } else {
      players = activePlayers()
      if (players.length === 0) {
        const seen = new Set<string>()
        for (const f of fixtures) { seen.add(String(f.homePlayer)); seen.add(String(f.awayPlayer)) }
        const byId = new Map((g.__memPlayers as any[]).map((p: any) => [String(p.id), p]))
        players = Array.from(seen).map((id) => byId.get(id)).filter(Boolean)
      }
    }

    // Optional console filter
    if (consoleFilter && consoleFilter !== "all") {
      players = players.filter((p) => String(p.console || "").toUpperCase() === String(consoleFilter).toUpperCase())
    }

    // Shape players to what calculateStandings expects
    const shapedPlayers = players.map((p) => ({
      id: String(p.id),
      name: p.name,
      assignedTeam: p.preferred_club || undefined,
      preferredClub: p.preferred_club || undefined,
      console: p.console,
    }))

    const standings = calculateStandings(fixtures as any, shapedPlayers)

    return NextResponse.json({
      standings,
      totalPlayers: shapedPlayers.length,
    })
  } catch (error) {
    console.error("Error fetching standings:", error)
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 })
  }
}
