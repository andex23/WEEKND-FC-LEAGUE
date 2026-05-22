import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { matchReminderEmail } from "@/lib/email/templates"

export const maxDuration = 60

function dateLabel(value: string | null): string {
  if (!value) return "Date TBC"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Date TBC"
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

type DueFixture = {
  id: string
  matchday: number
  home_player_id: string
  away_player_id: string
  home_club: string | null
  away_club: string | null
  scheduled_date: string | null
}

type PlayerRow = { id: string; name: string; email: string | null }

// Daily Vercel cron. Emails both players a reminder for fixtures scheduled
// within the next 48 hours, then marks the fixture so it is reminded only once.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const origin = request.nextUrl.origin
  const now = new Date()
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const { data: fixtures } = await admin
    .from("fixtures")
    .select("id, matchday, home_player_id, away_player_id, home_club, away_club, scheduled_date")
    .eq("status", "SCHEDULED")
    .is("reminder_sent_at", null)
    .not("scheduled_date", "is", null)
    .gte("scheduled_date", now.toISOString())
    .lte("scheduled_date", horizon.toISOString())
  const due = (fixtures || []) as DueFixture[]

  if (due.length === 0) return NextResponse.json({ ok: true, fixtures: 0, reminded: 0 })

  const ids = Array.from(new Set(due.flatMap((f) => [f.home_player_id, f.away_player_id])))
  const { data: players } = await admin.from("players").select("id, name, email").in("id", ids)
  const byId = new Map(((players || []) as PlayerRow[]).map((p) => [p.id, p]))

  let reminded = 0
  for (const f of due) {
    const home = byId.get(f.home_player_id)
    const away = byId.get(f.away_player_id)
    const label = dateLabel(f.scheduled_date)
    const tasks: Promise<boolean>[] = []

    if (home?.email) {
      const { subject, html } = matchReminderEmail({
        name: home.name,
        opponent: away?.name || "TBC",
        dateLabel: label,
        isHome: true,
        yourClub: f.home_club || "—",
        oppClub: f.away_club || "—",
        dashboardUrl: `${origin}/dashboard`,
      })
      tasks.push(sendEmail(home.email, subject, html))
    }
    if (away?.email) {
      const { subject, html } = matchReminderEmail({
        name: away.name,
        opponent: home?.name || "TBC",
        dateLabel: label,
        isHome: false,
        yourClub: f.away_club || "—",
        oppClub: f.home_club || "—",
        dashboardUrl: `${origin}/dashboard`,
      })
      tasks.push(sendEmail(away.email, subject, html))
    }

    const results = await Promise.all(tasks)
    reminded += results.filter(Boolean).length
    await admin
      .from("fixtures")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", f.id)
  }

  return NextResponse.json({ ok: true, fixtures: due.length, reminded })
}
