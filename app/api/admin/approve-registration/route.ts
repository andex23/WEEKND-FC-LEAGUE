import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { updatePlayerStatusWithApprovalEmail } from "@/lib/admin/approval-confirmation"
import { absoluteUrl } from "@/lib/site-url"

export async function POST(request: Request) {
  const { userId, action } = await request.json().catch(() => ({}))
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null
  if (!userId || !status) return NextResponse.json({ error: "A player ID and approve/reject action are required" }, { status: 400 })
  const result = await updatePlayerStatusWithApprovalEmail(createAdminClient(), {
    playerId: userId, status, loginUrl: absoluteUrl("/auth/login", request.url),
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.statusCode })
  return NextResponse.json({ ok: true, status, emailSent: result.emailSent })
}
