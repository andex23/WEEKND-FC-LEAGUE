import { type NextRequest, NextResponse } from "next/server"
import { generateRoundRobinFixtures } from "@/lib/utils/fixtures"
import { getTournamentPlayers, listPlayers, syncTournamentPlayers, activePlayers } from "@/lib/mocks/players"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any

function toISOAt17Local(d: Date): string {
  const copy = new Date(d)
  copy.setHours(17, 0, 0, 0)
  return copy.toISOString()
}

function computeWeekendDates(startAt: string | null, count: number): string[] {
  const dates: string[] = []
  let d = startAt ? new Date(startAt) : new Date()
  // Move to upcoming weekend if needed
  const day = d.getDay() // 0 Sun .. 6 Sat
  if (day !== 0 && day !== 6) {
    const daysUntilSat = (6 - day + 7) % 7
    d.setDate(d.getDate() + (daysUntilSat === 0 ? 7 : daysUntilSat))
  }
  let isSat = d.getDay() === 6
  // Alternate Sat -> Sun -> Sat -> Sun ...
  for (let i = 0; i < count; i++) {
    const use = new Date(d)
    // Ensure correct weekend day
    if (isSat && use.getDay() !== 6) {
      // move to Saturday of this weekend
      const diff = (6 - use.getDay() + 7) % 7
      use.setDate(use.getDate() + diff)
    }
    if (!isSat && use.getDay() !== 0) {
      // move to Sunday of this weekend
      const diff = (7 - use.getDay()) % 7
      use.setDate(use.getDate() + diff)
    }
    dates.push(toISOAt17Local(use))
    // Advance: Sat->Sun +1 day, Sun->next Sat +6 days
    if (isSat) {
      d = new Date(use)
      d.setDate(d.getDate() + 1)
    } else {
      d = new Date(use)
      d.setDate(d.getDate() + 6)
    }
    isSat = !isSat
  }
  return dates
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rounds = 2, tournamentId } = body

    let rosterIds = tournamentId ? getTournamentPlayers(String(tournamentId)) : []
    // Auto-sync snapshot if too few players
    if ((rosterIds?.length || 0) < 6 && tournamentId) {
      rosterIds = syncTournamentPlayers(String(tournamentId))
    }
    let roster = rosterIds.map((id) => listPlayers().find((p) => p.id === id)).filter(Boolean) as any[]
    // Fallback to current active players if snapshot still insufficient
    if (roster.length < 6) {
      roster = activePlayers()
    }
    if (roster.length < 6) return NextResponse.json({ error: "Need at least 6 players" }, { status: 400 })

    let shaped = roster.map((p) => ({ id: String(p.id), name: p.name, assignedTeam: p.preferred_club || "" }))
    // If odd number of players, add BYE placeholder so algorithm can pair
    const byeId = `__BYE__${tournamentId || "GLOBAL"}`
    if (shaped.length % 2 !== 0) {
      shaped = [...shaped, { id: byeId, name: "BYE", assignedTeam: "" }]
    }
    // Shuffle players to randomize fixture generation on each request
    const randomized = shuffle(shaped)
    const rawFixtures = generateRoundRobinFixtures(randomized, rounds, 2)
    // Drop any BYE fixtures
    const fixtures = rawFixtures.filter((f: any) => f.homePlayer !== byeId && f.awayPlayer !== byeId)

    const base = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "http://localhost:3000"
    const season = body.season || "2024/25"

    // Weekend dates per matchday
    const maxMd = fixtures.reduce((m, f) => Math.max(m, Number(f.matchday || 1)), 1)
    const tournament = (g.__memTournaments || []).find((t: any) => String(t.id) === String(tournamentId)) || null
    const startAt = tournament?.start_at || null
    const weekendDates = computeWeekendDates(startAt, maxMd)

    for (const f of fixtures) {
      const md = Number(f.matchday || 1)
      const dateISO = weekendDates[Math.max(0, md - 1)] || weekendDates[0]
      await fetch(new URL("/api/fixtures", base), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        id: f.id,
        tournamentId,
        season,
        matchday: f.matchday,
        homeId: f.homePlayer,
        awayId: f.awayPlayer,
        status: "SCHEDULED",
        date: dateISO,
        // include labels for convenience
        homeName: randomized.find((p) => p.id === f.homePlayer)?.name,
        awayName: randomized.find((p) => p.id === f.awayPlayer)?.name,
        homeTeam: f.homeTeam || randomized.find((p) => p.id === f.homePlayer)?.assignedTeam || "",
        awayTeam: f.awayTeam || randomized.find((p) => p.id === f.awayPlayer)?.assignedTeam || "",
      }) })
    }

    return NextResponse.json({ message: "Fixtures generated", fixtures, totalFixtures: fixtures.length, season })
  } catch (error) {
    console.error("Error generating fixtures:", error)
    return NextResponse.json({ error: "Failed to generate fixtures" }, { status: 500 })
  }
}
