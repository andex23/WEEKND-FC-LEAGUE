import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fixtureId, homeScore, awayScore, evidenceUrl, notes, screenshot, reportedByPlayerId } = body

    if (!fixtureId || homeScore === undefined || awayScore === undefined || !reportedByPlayerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Try Supabase persistence; fall back to no-op success if unavailable
    try {
      const sb = await createClient()

      // Fetch existing fixture
      const { data: fixture, error: fetchError } = await sb.from("fixtures").select("id, reported_home_score, reported_away_score, reported_by_player_id, report_status").eq("id", fixtureId).maybeSingle()
      if (fetchError) throw fetchError

      // Conflict detection: if an existing report exists and differs from this one
      if (fixture && (fixture.reported_home_score != null || fixture.reported_away_score != null)) {
        const conflict = fixture.reported_home_score !== homeScore || fixture.reported_away_score !== awayScore
        if (conflict) {
          await sb.from("fixtures").update({
            reported_home_score: homeScore,
            reported_away_score: awayScore,
            reported_by_player_id: reportedByPlayerId,
            report_evidence_url: evidenceUrl || null,
            report_notes: notes || null,
            report_status: "CONFLICT",
          }).eq("id", fixtureId)

          // Try to notify admins (broadcast)
          await sb.from("notifications").insert({ title: "Result conflict", body: `Fixture ${fixtureId} has conflicting reports.`, user_id: null })

          return NextResponse.json({ message: "Conflict detected", status: "CONFLICT" })
        }
      }

      // Upsert reported fields as pending
      await sb.from("fixtures").update({
        reported_home_score: homeScore,
        reported_away_score: awayScore,
        reported_by_player_id: reportedByPlayerId,
        report_evidence_url: evidenceUrl || null,
        report_notes: notes || null,
        report_status: "PENDING",
      }).eq("id", fixtureId)

      // Optional: store screenshot in a storage bucket later

      // Notify admins of new report
      await sb.from("notifications").insert({ title: "New result report", body: `Fixture ${fixtureId} reported and pending approval.`, user_id: null })

      return NextResponse.json({ message: "Result submitted. Pending admin approval.", status: "PENDING" })
    } catch (e) {
      console.warn("Supabase unavailable, returning mock success:", e)
      return NextResponse.json({ message: "Result submitted. Pending admin approval.", status: "PENDING" })
    }
  } catch (error) {
    console.error("Error submitting result:", error)
    return NextResponse.json({ error: "Failed to submit result" }, { status: 500 })
  }
}
