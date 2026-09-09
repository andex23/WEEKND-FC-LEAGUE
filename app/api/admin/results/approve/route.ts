import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validScore } from "@/lib/matches/validation"

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Missing fixture ID" }, { status: 400 })
    const db = createAdminClient()
    const { data: fixture, error } = await db.from("fixtures")
      .select("id,report_status,reported_home_score,reported_away_score").eq("id", id).maybeSingle()
    if (error) throw error
    if (!fixture) return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    if (!["PENDING", "CONFLICT"].includes(fixture.report_status) || !validScore(fixture.reported_home_score) || !validScore(fixture.reported_away_score)) {
      return NextResponse.json({ error: "This fixture has no valid pending report." }, { status: 409 })
    }
    const { data: updated, error: updateError } = await db.from("fixtures").update({
      report_status: "APPROVED", status: "PLAYED", home_score: fixture.reported_home_score,
      away_score: fixture.reported_away_score, played_at: new Date().toISOString(),
    }).eq("id", id).eq("report_status", fixture.report_status)
      .eq("reported_home_score", fixture.reported_home_score).eq("reported_away_score", fixture.reported_away_score).select("id").maybeSingle()
    if (updateError) throw updateError
    if (!updated) return NextResponse.json({ error: "The report changed. Refresh before approving." }, { status: 409 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Couldn't approve the result. Please try again." }, { status: 500 })
  }
}
