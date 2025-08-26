import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const sb = await createClient()
    const { data, error } = await sb.from("profiles").select("id,name,preferred_club,console,avatar_url").limit(1).maybeSingle()
    if (error) throw error
    const player = data
      ? { id: data.id, name: data.name, preferredClub: data.preferred_club, console: data.console, avatar_url: data.avatar_url, season_name: "2024/25" }
      : { id: "1", name: "Player One", preferredClub: "Arsenal", console: "PS5", season_name: "2024/25" }
    return NextResponse.json({ player })
  } catch {
    return NextResponse.json({ player: { id: "1", name: "Player One", preferredClub: "Arsenal", console: "PS5", season_name: "2024/25" } })
  }
}
