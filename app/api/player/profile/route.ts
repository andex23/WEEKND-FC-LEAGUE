import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Standing } from "@/lib/supabase/types"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("id,username,name,preferred_club,assigned_club,console,status,available")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
  if (!player) {
    return NextResponse.json({ error: "Player profile not found" }, { status: 404 })
  }

  // Season name (best effort) and the player's current league position.
  const { data: settings } = await supabase
    .from("league_settings")
    .select("season_name")
    .limit(1)
    .maybeSingle()

  const { data: table } = await supabase
    .from("v_standings")
    .select("id,points")
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false })

  const rows = (table as Pick<Standing, "id" | "points">[] | null) ?? []
  const index = rows.findIndex((r) => r.id === player.id)

  return NextResponse.json({
    player: {
      id: player.id,
      username: player.username,
      name: player.name,
      preferredClub: player.assigned_club || player.preferred_club,
      console: player.console,
      status: player.status,
      available: player.available,
      season_name: settings?.season_name ?? "Season 1",
      position: index >= 0 ? index + 1 : null,
      points: index >= 0 ? rows[index].points : 0,
    },
  })
}
