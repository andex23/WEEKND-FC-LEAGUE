import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validScore } from "@/lib/matches/validation"

export async function POST() {
  let approved = 0
  try {
    const db = createAdminClient()
    // Conflicting reports require individual review and must never be bulk approved.
    const { data: pending, error } = await db.from("fixtures")
      .select("id,reported_home_score,reported_away_score").eq("report_status", "PENDING")
    if (error) throw error
    for (const fixture of pending || []) {
      if (!validScore(fixture.reported_home_score) || !validScore(fixture.reported_away_score)) continue
      const { data: updated, error: updateError } = await db.from("fixtures").update({
        status: "PLAYED", report_status: "APPROVED", home_score: fixture.reported_home_score,
        away_score: fixture.reported_away_score, played_at: new Date().toISOString(),
      }).eq("id", fixture.id).eq("report_status", "PENDING")
        .eq("reported_home_score", fixture.reported_home_score).eq("reported_away_score", fixture.reported_away_score).select("id").maybeSingle()
      if (updateError) throw updateError
      if (updated) approved++
    }
    return NextResponse.json({ ok: true, approved })
  } catch {
    return NextResponse.json({ error: `Approved ${approved} reports before an error. Refresh and retry the remaining reports.`, approved }, { status: 500 })
  }
}
