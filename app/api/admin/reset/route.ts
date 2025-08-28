import { NextResponse } from "next/server"

// Minimal in-memory stores referencing existing endpoints
let memNotifications: any[] = []

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { action } = body
  if (action === "clear_tournament") {
    const tournamentId = String(body.tournamentId || "")
    // Clear fixtures for tournament
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/fixtures`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear_for_tournament", tournamentId }) })
    // Stats clearing hook (when stats API added)
    return NextResponse.json({ ok: true, tournamentId })
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 })
}
