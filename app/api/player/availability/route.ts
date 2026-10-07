import { requireApprovedPlayer } from "@/lib/security/player-request"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const access = await requireApprovedPlayer()
  if (!access.ok) return access.response
  const { user, supabase } = access

  const { available } = await request.json().catch(() => ({}))
  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "`available` must be a boolean" }, { status: 400 })
  }

  const { error } = await supabase.from("players").update({ available }).eq("id", user.id)
  if (error) {
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
  }

  return NextResponse.json({ success: true, available })
}
