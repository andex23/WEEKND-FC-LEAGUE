import { NextResponse } from "next/server"
import { getActiveTournament } from "@/lib/tournaments/active"

export async function GET() {
  try {
    return NextResponse.json({ activeTournament: await getActiveTournament() }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "Unable to load the league. Please try again." }, { status: 503 })
  }
}
