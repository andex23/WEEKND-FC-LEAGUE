import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("wfc_admin")?.value !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { playerId } = await request.json().catch(() => ({}))
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 })
  }

  const { data, error } = await createAdminClient()
    .from("players")
    .update({ role: "ADMIN" })
    .eq("id", playerId)
    .select("id,role")
    .maybeSingle()
  if (error || !data) {
    console.error("Error promoting player:", error)
    return NextResponse.json({ error: "Failed to promote player" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: "Player promoted to admin", player: data })
}
