import { validScore } from "@/lib/matches/validation"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { fixtureId, homeScore, awayScore, evidenceUrl, notes, screenshot } = body
    if (!fixtureId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!validScore(homeScore) || !validScore(awayScore)) {
      return NextResponse.json({ error: "Scores must be whole numbers between 0 and 99." }, { status: 400 })
    }
    if (screenshot && (typeof screenshot !== "string" || screenshot.length > 2800000 || !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(screenshot))) {
      return NextResponse.json({ error: "Use a PNG or JPEG screenshot smaller than 2 MB." }, { status: 400 })
    }
    if (evidenceUrl && (typeof evidenceUrl !== "string" || evidenceUrl.length > 2048 || !/^https?:\/\//i.test(evidenceUrl))) {
      return NextResponse.json({ error: "Enter a valid evidence link." }, { status: 400 })
    }
    if (notes && (typeof notes !== "string" || notes.length > 2000)) {
      return NextResponse.json({ error: "Keep notes under 2,000 characters." }, { status: 400 })
    }

    const { data: fixture, error: fetchError } = await supabase
      .from("fixtures")
      .select("id, status, home_player_id, away_player_id, reported_home_score, reported_away_score")
      .eq("id", fixtureId)
      .maybeSingle()
    if (fetchError) throw fetchError
    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    // Only a participant in the fixture may report its result.
    if (fixture.home_player_id !== user.id && fixture.away_player_id !== user.id) {
      return NextResponse.json({ error: "You are not part of this fixture" }, { status: 403 })
    }

    if (String(fixture.status).toUpperCase() !== "SCHEDULED") {
      return NextResponse.json({ error: "This match is already final or is not open for reporting." }, { status: 409 })
    }

    const hasExisting =
      fixture.reported_home_score != null || fixture.reported_away_score != null
    const conflict =
      hasExisting &&
      (fixture.reported_home_score !== homeScore || fixture.reported_away_score !== awayScore)

    const { error: updateError } = await supabase
      .from("fixtures")
      .update({
        reported_home_score: homeScore,
        reported_away_score: awayScore,
        reported_by_player_id: user.id,
        report_evidence_url: screenshot || evidenceUrl || null,
        report_notes: notes || null,
        report_status: conflict ? "CONFLICT" : "PENDING",
      })
      .eq("id", fixtureId)
    if (updateError) throw updateError

    // Notify admins (service-role client: players cannot insert notifications).
    await createAdminClient()
      .from("notifications")
      .insert({
        user_id: null,
        title: conflict ? "Result conflict" : "New result report",
        body: conflict
          ? `Fixture ${fixtureId} has conflicting reports and needs admin review.`
          : `Fixture ${fixtureId} reported and is pending approval.`,
      })

    if (conflict) {
      return NextResponse.json({
        message: "Opponent reported a different score. An admin will resolve it.",
        status: "CONFLICT",
      })
    }
    return NextResponse.json({
      message: "Result submitted. Pending admin approval.",
      status: "PENDING",
    })
  } catch (error) {
    console.error("Error submitting result:", error)
    return NextResponse.json({ error: "Failed to submit result" }, { status: 500 })
  }
}
