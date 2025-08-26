import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit") || 10)
    const sb = await createClient()
    const { data, error } = await sb.from("fixtures").select("id,matchday,home_player,away_player,home_score,away_score,status,kickoff_at").order("kickoff_at").limit(limit)
    if (error) throw error
    const fixtures = (data || []).map((f: any) => ({ id: f.id, matchday: f.matchday, homePlayer: f.home_player, awayPlayer: f.away_player, homeScore: f.home_score, awayScore: f.away_score, status: f.status, match_date: f.kickoff_at }))
    return NextResponse.json({ fixtures })
  } catch {
    return NextResponse.json({ fixtures: [] })
  }
}
