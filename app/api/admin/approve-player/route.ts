import { NextResponse } from "next/server"
import { updateMemRegistrationStatus, getMemRegistrations } from "@/lib/mocks/registrations"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const { playerId, action } = await request.json().catch(() => ({ }))
  if (!playerId || !action) return NextResponse.json({ error: "Missing" }, { status: 400 })

  if (process.env.MOCK_DEMO === "1") {
    updateMemRegistrationStatus(String(playerId), action === "approve" ? "approved" : "rejected")
    return NextResponse.json({ ok: true, registrations: getMemRegistrations() || [] })
  }

  try {
    const sb = await createClient()
    await sb.from("users").update({ status: action === "approve" ? "approved" : "rejected" }).eq("id", playerId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
