import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("wfc_admin")?.value !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { playerId, action } = await request.json().catch(() => ({}))
  if (!playerId || !action) {
    return NextResponse.json({ error: "playerId and action are required" }, { status: 400 })
  }

  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null
  if (!status) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 })
  }

  const { error } = await createAdminClient()
    .from("players")
    .update({ status })
    .eq("id", playerId)
  if (error) {
    console.error("Error updating player status:", error)
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status })
}
