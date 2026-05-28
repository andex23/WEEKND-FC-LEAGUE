import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { updatePlayerStatusWithApprovalEmail } from "@/lib/admin/approval-confirmation"
import { absoluteUrl } from "@/lib/site-url"

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

  const result = await updatePlayerStatusWithApprovalEmail(createAdminClient(), {
    playerId: String(playerId),
    status,
    loginUrl: absoluteUrl("/auth/login", request.url),
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode })
  }

  return NextResponse.json({ ok: true, status: result.status, emailSent: result.emailSent, player: result.player })
}
