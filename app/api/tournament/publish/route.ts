import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get("wfc_admin")?.value !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { config, setActive } = body
  if (!config || typeof config !== "object") {
    return NextResponse.json({ error: "A tournament config is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const name = config?.basics?.name || config?.name || "Weekend FC League"
  // Only one tournament can be active at a time.
  if (setActive) {
    await admin.from("tournaments").update({ is_active: false }).eq("is_active", true)
  }

  const { data: tournament, error: insertError } = await admin
    .from("tournaments")
    .insert({
      name,
      config,
      status: setActive ? "ACTIVE" : "DRAFT",
      is_active: Boolean(setActive),
    })
    .select()
    .single()
  if (insertError || !tournament) {
    console.error("Tournament publish failed:", insertError)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    tournament,
    setActive: Boolean(setActive),
    fixturesGenerated: false,
    message: "Tournament created. Invite players, then generate fixtures after enough players accept.",
  })
}
