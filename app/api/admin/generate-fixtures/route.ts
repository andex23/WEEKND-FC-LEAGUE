import { type NextRequest, NextResponse } from "next/server"
import { generateRoundRobinFixtures } from "@/lib/utils/fixtures"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get("debug") === "1"

    const getSelfBase = (req: NextRequest): string => {
      const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim()
      const base = env || new URL(req.url).origin
      // Normalize localhost to 127.0.0.1 to avoid IPv6 (::1) mismatch when server binds to 127.0.0.1
      return base.replace("localhost", "127.0.0.1")
    }

    // Build roster from Supabase (status = approved)
    const client = await createClient()
    const admin = createAdminClient()
    let roster: any[] = []
    // Allow caller-provided roster
    if (Array.isArray(body.rosterRecords) && body.rosterRecords.length) {
      roster = body.rosterRecords
    }
    if (roster.length === 0) {
      // Prefer admin client to bypass any RLS issues
      const { data: rows, error } = await admin
        .from("players")
        .select("id, name, preferred_club, status")
        .eq("status", "approved")
      if (error) {
        console.error("generate-fixtures: players query error", error)
      }
      roster = (rows || [])
    }

    // Skip registrations entirely - we work directly with players table
    console.log(`Using ${roster.length} players directly from players table (no registrations needed)`)
    
      // Skip trying to modify schema - we'll handle constraint errors differently
  console.log("Note: Skipping schema modification - will handle constraints in fixtures API")
    if (roster.length < 2) {
      return NextResponse.json({ error: "Need at least 2 players", approvedCount: roster.length }, { status: 400 })
    }

    let shaped = roster.map((p) => ({ id: String(p.id), name: p.name, assignedTeam: p.preferred_club || "" }))
    // If odd number of players, add BYE placeholder so algorithm can pair
    const byeId = `__BYE__${tournamentId || "GLOBAL"}`
    if (shaped.length % 2 !== 0) {
      shaped = [...shaped, { id: byeId, name: "BYE", assignedTeam: "" }]
    }
    // Shuffle players to randomize fixture generation on each request
    const randomized = shuffle(shaped)
    console.log(`DEBUG: Calling generateRoundRobinFixtures with ${randomized.length} players, rounds=${rounds}`)
    const rawFixtures = generateRoundRobinFixtures(randomized, rounds, 2)
    console.log(`DEBUG: generateRoundRobinFixtures returned ${rawFixtures.length} fixtures`)
    // Drop any BYE fixtures
    const fixtures = rawFixtures.filter((f: any) => f.homePlayer !== byeId && f.awayPlayer !== byeId)
    console.log(`DEBUG: After filtering BYE fixtures: ${fixtures.length} fixtures`)

    const base = getSelfBase(request)
    const season = body.season || "2024/25"

    // Weekend dates per matchday
    const maxMd = fixtures.reduce((m, f) => Math.max(m, Number(f.matchday || 1)), 1)
    // Fetch tournament start date from DB
    let startAt: string | null = null
    if (tournamentId) {
      const { data: t, error: tErr } = await admin.from("tournaments").select("start_at").eq("id", String(tournamentId)).single()
      if (tErr) console.error("generate-fixtures: tournaments query error", tErr)
      startAt = (t as any)?.start_at || null
    }
    const weekendDates = computeWeekendDates(startAt, maxMd)

    let posted = 0
    const errors: any[] = []
    for (const f of fixtures) {
      try {
        const md = Number(f.matchday || 1)
        const dateISO = weekendDates[Math.max(0, md - 1)] || weekendDates[0]
        const res = await fetch(new URL("/api/fixtures", base), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
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
        if (!res.ok) {
          const txt = await res.text().catch(() => "")
          throw new Error(`POST /api/fixtures ${res.status} ${txt}`)
        }
        posted++
      } catch (e: any) {
        errors.push(String(e?.message || e))
        if (!debug) throw e
      }
    }

    return NextResponse.json({ message: "Fixtures generated", fixtures, totalFixtures: fixtures.length, posted, errors: debug ? errors : undefined, season })
  } catch (error) {
    console.error("Error generating fixtures:", error)
    return NextResponse.json({ error: "Failed to generate fixtures", details: String((error as any)?.message || error) }, { status: 500 })
  }
}
