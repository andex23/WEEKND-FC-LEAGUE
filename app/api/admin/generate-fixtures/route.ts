import { type NextRequest, NextResponse } from "next/server"
import { generateRoundRobinFixtures } from "@/lib/utils/fixtures"
import { createAdminClient } from "@/lib/supabase/admin"

function toISOAt17Local(d: Date): string {
  const copy = new Date(d)
  copy.setHours(17, 0, 0, 0)
  return copy.toISOString()
}

function computeWeekendDates(startAt: string | null, count: number): string[] {
  const dates: string[] = []
  let d = startAt ? new Date(startAt) : new Date()
  const day = d.getDay() // 0 Sun .. 6 Sat
  if (day !== 0 && day !== 6) {
    const daysUntilSat = (6 - day + 7) % 7
    d.setDate(d.getDate() + (daysUntilSat === 0 ? 7 : daysUntilSat))
  }
  let isSat = d.getDay() === 6
  for (let i = 0; i < count; i++) {
    const use = new Date(d)
    if (isSat && use.getDay() !== 6) {
      const diff = (6 - use.getDay() + 7) % 7
      use.setDate(use.getDate() + diff)
    }
    if (!isSat && use.getDay() !== 0) {
      const diff = (7 - use.getDay()) % 7
      use.setDate(use.getDate() + diff)
    }
    dates.push(toISOAt17Local(use))
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
    const body = await request.json().catch(() => ({}))
    const { rounds = 2, matchdaysPerWeekend = 2, tournamentId } = body

    if (!tournamentId) {
      return NextResponse.json({ error: "tournamentId is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Build the roster from approved players (caller may also supply one).
    let roster: any[] = []
    if (Array.isArray(body.rosterRecords) && body.rosterRecords.length) {
      roster = body.rosterRecords
    } else {
      const { data: rows, error } = await admin
        .from("players")
        .select("id, name, preferred_club, status")
        .eq("status", "approved")
      if (error) console.error("generate-fixtures: players query error", error)
      roster = rows || []
    }

    if (roster.length < 2) {
      return NextResponse.json(
        {
          error: "Need at least 2 players",
          message: `Only ${roster.length} approved players found`,
          approvedCount: roster.length,
        },
        { status: 400 },
      )
    }

    const shaped = roster.map((p) => ({ id: String(p.id), name: p.name, assignedTeam: p.preferred_club || "" }))
    const randomized = shuffle(shaped)
    const fixtures = generateRoundRobinFixtures(randomized, rounds, matchdaysPerWeekend)

    // One weekend date (Sat/Sun alternating) per matchday.
    const maxMd = fixtures.reduce((m, f) => Math.max(m, Number(f.matchday || 1)), 1)
    const { data: t } = await admin
      .from("tournaments")
      .select("start_at")
      .eq("id", String(tournamentId))
      .maybeSingle()
    const weekendDates = computeWeekendDates((t as any)?.start_at || null, maxMd)

    // Regenerate cleanly: clear this tournament's fixtures, then insert the set.
    await admin.from("fixtures").delete().eq("tournament_id", tournamentId)

    const rows = fixtures.map((f) => {
      const md = Number(f.matchday || 1)
      return {
        tournament_id: tournamentId,
        matchday: md,
        home_player_id: String(f.homePlayer),
        away_player_id: String(f.awayPlayer),
        status: "SCHEDULED" as const,
        scheduled_date: weekendDates[Math.max(0, md - 1)] || weekendDates[0] || null,
      }
    })

    const { error: insertError } = await admin.from("fixtures").insert(rows)
    if (insertError) {
      console.error("generate-fixtures: insert error", insertError)
      return NextResponse.json(
        { error: "Failed to save fixtures", details: insertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Fixtures generated", totalFixtures: rows.length, posted: rows.length })
  } catch (error) {
    console.error("Error generating fixtures:", error)
    return NextResponse.json(
      { error: "Failed to generate fixtures", details: String((error as any)?.message || error) },
      { status: 500 },
    )
  }
}
