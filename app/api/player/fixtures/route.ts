import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type FixtureRow = {
  id: string
  matchday: number
  home_player_id: string
  away_player_id: string
  home_club: string | null
  away_club: string | null
  home_score: number | null
  away_score: number | null
  status: string
  scheduled_date: string | null
  home_player: { name: string } | null
  away_player: { name: string } | null
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const limit = Number(new URL(request.url).searchParams.get("limit") || 50)

  const { data, error } = await supabase
    .from("fixtures")
    .select(
      `id, matchday, home_player_id, away_player_id, home_club, away_club,
       home_score, away_score, status, scheduled_date,
       home_player:players!fixtures_home_player_id_fkey(name),
       away_player:players!fixtures_away_player_id_fkey(name)`,
    )
    .or(`home_player_id.eq.${user.id},away_player_id.eq.${user.id}`)
    .order("matchday", { ascending: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: "Failed to load fixtures" }, { status: 500 })
  }

  const rows = (data as unknown as FixtureRow[] | null) ?? []
  const fixtures = rows.map((f) => ({
    id: f.id,
    matchday: f.matchday,
    homePlayer: f.home_player?.name ?? "TBD",
    awayPlayer: f.away_player?.name ?? "TBD",
    homeClub: f.home_club,
    awayClub: f.away_club,
    homeScore: f.home_score,
    awayScore: f.away_score,
    status: f.status,
    scheduledDate: f.scheduled_date,
    isHome: f.home_player_id === user.id,
  }))

  return NextResponse.json({ fixtures })
}
