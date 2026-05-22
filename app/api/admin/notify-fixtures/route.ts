import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { fixturesEmail, type FixtureLine } from "@/lib/email/templates"

export const maxDuration = 60

function dateLabel(value: string | null): string {
  if (!value) return "Date TBC"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Date TBC"
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

// Admin-only (gated by middleware). Emails every approved player their own
// scheduled fixtures.
export async function POST(request: NextRequest) {
  const admin = createAdminClient()
  const origin = request.nextUrl.origin

  const { data: players } = await admin.from("players").select("id, name, email, status")
  const all = (players || []) as { id: string; name: string; email: string | null; status: string }[]
  const nameById = new Map(all.map((p) => [p.id, p.name]))
  const approved = all.filter((p) => p.status === "approved" && p.email)

  const { data: fixtures } = await admin
    .from("fixtures")
    .select("matchday, home_player_id, away_player_id, home_club, away_club, scheduled_date")
    .eq("status", "SCHEDULED")
    .order("matchday", { ascending: true })
  const allFixtures = (fixtures || []) as {
    matchday: number
    home_player_id: string
    away_player_id: string
    home_club: string | null
    away_club: string | null
    scheduled_date: string | null
  }[]

  const results = await Promise.all(
    approved.map((player) => {
      const lines: FixtureLine[] = allFixtures
        .filter((f) => f.home_player_id === player.id || f.away_player_id === player.id)
        .map((f) => {
          const isHome = f.home_player_id === player.id
          const opponentId = isHome ? f.away_player_id : f.home_player_id
          return {
            matchday: f.matchday,
            dateLabel: dateLabel(f.scheduled_date),
            opponent: nameById.get(opponentId) || "TBC",
            isHome,
            yourClub: (isHome ? f.home_club : f.away_club) || "—",
            oppClub: (isHome ? f.away_club : f.home_club) || "—",
          }
        })
      const { subject, html } = fixturesEmail(player.name, lines, `${origin}/dashboard`)
      return sendEmail(player.email as string, subject, html)
    }),
  )

  return NextResponse.json({
    ok: true,
    sent: results.filter(Boolean).length,
    recipients: approved.length,
  })
}
