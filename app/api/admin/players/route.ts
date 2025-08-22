import { NextResponse } from "next/server"
import { getPlayers } from "@/lib/supabase/queries"

// In-memory demo players (fallback when Supabase is not configured)
// Note: ephemeral across deploys; suitable for UI testing
let memPlayers: any[] = []

export async function GET() {
  try {
    const players = await getPlayers()
    if (players && players.length > 0) {
      return NextResponse.json({ players, totalPlayers: players.length })
    }
    // Fallback to in-memory
    return NextResponse.json({ players: memPlayers, totalPlayers: memPlayers.length })
  } catch (error) {
    console.error("Error fetching players:", error)
    // Fallback to in-memory even on error
    return NextResponse.json({ players: memPlayers, totalPlayers: memPlayers.length })
  }
}

// Helper to allow seeding from sibling route
export function __setMemPlayers(list: any[]) {
  memPlayers = list
}

export function __updateMemPlayerStatus(id: string, status: string) {
  memPlayers = memPlayers.map((p) => (String(p.id) === String(id) ? { ...p, status } : p))
}
