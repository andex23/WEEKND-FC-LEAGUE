import { type NextRequest, NextResponse } from "next/server"
import { generateRoundRobinFixtures } from "@/lib/utils/fixtures"
import { getTournamentPlayers, listPlayers } from "@/lib/mocks/players"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rounds = 2, tournamentId } = body

    const rosterIds = tournamentId ? getTournamentPlayers(String(tournamentId)) : []
    const roster = rosterIds.map((id) => listPlayers().find((p) => p.id === id)).filter(Boolean) as any[]
    if (roster.length < 6) return NextResponse.json({ error: "Need at least 6 players" }, { status: 400 })
    if (roster.length % 2 !== 0) return NextResponse.json({ error: "Even number required" }, { status: 400 })

    const shaped = roster.map((p) => ({ id: p.id, name: p.name, assignedTeam: p.preferred_club || "" }))
    const fixtures = generateRoundRobinFixtures(shaped, rounds, 2)

    for (const f of fixtures) {
      await fetch("/api/fixtures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        id: f.id,
        tournamentId,
        season: body.season || "2024/25",
        matchday: f.matchday,
        homeId: f.homeId,
        awayId: f.awayId,
        status: "SCHEDULED",
        date: null,
      }) })
    }

    return NextResponse.json({ message: "Fixtures generated", fixtures, totalFixtures: fixtures.length })
  } catch (error) {
    console.error("Error generating fixtures:", error)
    return NextResponse.json({ error: "Failed to generate fixtures" }, { status: 500 })
  }
}
