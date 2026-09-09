import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const sb = createAdminClient()
    const { data, error } = await sb
      .from("fixtures")
      .select("id,matchday,home_player_id,away_player_id,reported_home_score,reported_away_score,report_status,report_evidence_url,report_notes,reported_by_player_id,updated_at,created_at")
      .in("report_status", ["PENDING", "CONFLICT"]) as any
    if (error) throw error
    const results = (data || []).map((r: any) => ({
      id: r.id,
      homePlayer: r.home_player_id,
      awayPlayer: r.away_player_id,
      homeScore: r.reported_home_score,
      awayScore: r.reported_away_score,
      status: r.report_status || "PENDING",
      submittedBy: r.reported_by_player_id,
      evidenceUrl: r.report_evidence_url,
      reason: r.report_notes,
      created_at: r.created_at || r.updated_at || new Date().toISOString(),
      matchday: r.matchday,
    }))
    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ error: "Unable to load result reports" }, { status: 503 })
  }
}
