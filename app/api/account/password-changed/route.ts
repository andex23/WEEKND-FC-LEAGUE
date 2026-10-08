import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { passwordChangedEmail } from "@/lib/email/templates"
import { enforceRequestRateLimit } from "@/lib/security/rate-limit"

// Sends a "your password was changed" security alert to the signed-in user.
// Called by the reset-password page right after a successful password update.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const limit = await enforceRequestRateLimit("password-changed", request.headers, user.id)
  if (!limit.allowed) return NextResponse.json({ error: limit.error }, { status: limit.status, headers: { "Retry-After": String(limit.retryAfter) } })

  const { data: player } = await supabase
    .from("players")
    .select("name")
    .eq("id", user.id)
    .maybeSingle()

  const { subject, html } = passwordChangedEmail(player?.name || "there")
  const sent = await sendEmail(user.email, subject, html)
  return NextResponse.json({ ok: sent }, { status: sent ? 200 : 502 })
}
