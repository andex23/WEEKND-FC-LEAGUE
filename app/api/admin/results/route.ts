import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const sb = await createClient()
    const { data, error } = await sb
      .from("fixtures")
      .select("id,matchday,home_player,away_player,reported_home_score,reported_away_score,report_status,reported_by_player_id,updated_at,created_at")
      .in("report_status", ["PENDING", "CONFLICT"]) as any
    if (error) throw error
    const results = (data || []).map((r: any) => ({
      id: r.id,
      homePlayer: r.home_player,
      awayPlayer: r.away_player,
      homeScore: r.reported_home_score,
      awayScore: r.reported_away_score,
      status: r.report_status || "PENDING",
      submittedBy: r.reported_by_player_id,
      created_at: r.created_at || r.updated_at || new Date().toISOString(),
      matchday: r.matchday,
    }))
    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ results: [] })
  }
}
