import { type NextRequest, NextResponse } from "next/server"
import { generateRoundRobinFixtures } from "@/lib/utils/fixtures"
import { createAdminClient } from "@/lib/supabase/admin"
import { readTournamentEntries } from "@/lib/tournaments/entry-config"

function toISOAt17Local(d: Date): string {
  const copy = new Date(d)
  copy.setHours(17, 0, 0, 0)
  return copy.toISOString()
}

function computeWeekendDates(startAt: string | null, count: number, matchdaysPerWeekend: number): string[] {
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
    if (matchdaysPerWeekend === 1) {
      d = new Date(use)
      d.setDate(d.getDate() + 7)
      continue
    }
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

    if (![1, 2].includes(rounds) || ![1, 2].includes(matchdaysPerWeekend)) {
      return NextResponse.json({ error: "Choose one or two rounds and matchdays per weekend." }, { status: 400 })
    }
    const admin = createAdminClient()

    const { data: t, error: tournamentError } = await admin
      .from("tournaments")
      .select("start_at,config")
      .eq("id", String(tournamentId))
      .maybeSingle()

    if (tournamentError || !t) return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    const { count, error: existingError } = await admin.from("fixtures").select("id", { count: "exact", head: true }).eq("tournament_id", tournamentId)
    if (existingError) return NextResponse.json({ error: "Could not check existing fixtures" }, { status: 503 })
    if (count) return NextResponse.json({ error: "This tournament already has fixtures. Clear them explicitly before generating a new schedule." }, { status: 409 })

    // Build the roster from accepted tournament entries. If an old tournament
    // has no entries yet, fall back to approved players so existing local data
    // does not break while the admin migrates to the invite flow.
    let roster: any[] = []
    if (Array.isArray(body.rosterRecords) && body.rosterRecords.length) {
      roster = body.rosterRecords
    } else {
      const entries = readTournamentEntries((t as any)?.config)
      const acceptedEntries = entries.filter((entry) => entry.status === "accepted")

      if (entries.length > 0) {
        if (acceptedEntries.length < 2) {
          return NextResponse.json(
            {
              error: "Need at least 2 accepted players",
              message: `Only ${acceptedEntries.length} invited players accepted this tournament.`,
              acceptedCount: acceptedEntries.length,
            },
            { status: 400 },
          )
        }

        const playerIds = acceptedEntries.map((entry) => entry.player_id)
        const { data: rows, error } = await admin
          .from("players")
          .select("id, name")
          .in("id", playerIds)
        if (error) console.error("generate-fixtures: accepted players query error", error)
        const byId = new Map((rows || []).map((player) => [String(player.id), player]))
        roster = acceptedEntries.map((entry) => ({
          id: entry.player_id,
          name: byId.get(entry.player_id)?.name || "Player",
          selected_club: entry.selected_club,
        }))
      } else {
        const { data: rows, error } = await admin
          .from("players")
          .select("id, name, preferred_club, status")
          .eq("status", "approved")
        if (error) console.error("generate-fixtures: players query error", error)
        roster = rows || []
      }
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

    const shaped = roster.map((p) => ({
      id: String(p.id),
      name: p.name,
      assignedTeam: p.selected_club || p.preferred_club || "",
    }))
    const randomized = shuffle(shaped)
    const fixtures = generateRoundRobinFixtures(randomized, rounds, matchdaysPerWeekend)

    // One weekend date (Sat/Sun alternating) per matchday.
    const maxMd = fixtures.reduce((m, f) => Math.max(m, Number(f.matchday || 1)), 1)
    const weekendDates = computeWeekendDates((t as any)?.start_at || null, maxMd, matchdaysPerWeekend)


    const rows = fixtures.map((f) => {
      const md = Number(f.matchday || 1)
      return {
        tournament_id: tournamentId,
        matchday: md,
        home_player_id: String(f.homePlayer),
        away_player_id: String(f.awayPlayer),
        home_club: f.homeTeam || null,
        away_club: f.awayTeam || null,
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
