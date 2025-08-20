import { NextResponse } from "next/server"
import { getPlayers } from "@/lib/supabase/queries"

export async function GET() {
  try {
    const players = await getPlayers()

    return NextResponse.json({
      players,
      totalPlayers: players.length,
    })
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}
