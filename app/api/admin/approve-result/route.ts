import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validScore } from "@/lib/matches/validation"

export async function POST(request: Request) {
  try {
    const { fixtureId, homeScore, awayScore, forfeit } = await request.json()
    if (!fixtureId || !validScore(homeScore) || !validScore(awayScore)) {
      return NextResponse.json({ error: "Choose a fixture and enter whole-number scores between 0 and 99." }, { status: 400 })
    }
    const { data, error } = await createAdminClient().from("fixtures").update({
      home_score: homeScore, away_score: awayScore, status: forfeit ? "FORFEIT" : "PLAYED",
      report_status: "APPROVED", played_at: new Date().toISOString(),
    }).eq("id", fixtureId).select("id").maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Couldn't save the result. Please try again." }, { status: 500 })
  }
}
