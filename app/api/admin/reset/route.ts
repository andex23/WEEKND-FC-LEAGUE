import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { action } = body

  if (action === "clear_tournament") {
    const tournamentId = String(body.tournamentId || "")
    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 })
    }
    const { error } = await createAdminClient().from("fixtures").delete().eq("tournament_id", tournamentId)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, tournamentId })
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 })
}
