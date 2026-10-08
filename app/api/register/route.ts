import { type NextRequest, NextResponse } from "next/server"
import { registrationSchema } from "@/lib/validations"
import { createAdminClient } from "@/lib/supabase/admin"
import { enforceRequestRateLimit } from "@/lib/security/rate-limit"
import { isEmailConfigured, sendEmail } from "@/lib/email"
import { registrationVerificationEmail } from "@/lib/email/templates"
import { generateRegistrationVerification, registerPendingPlayer } from "@/lib/auth/registration-workflow"
import { absoluteUrl } from "@/lib/site-url"
import { registrationAdminRecipient } from "@/lib/email/registration-delivery"

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const parsed = registrationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid registration details" }, { status: 400 })
  const limit = await enforceRequestRateLimit("register", request.headers, parsed.data.email.toLowerCase())
  if (!limit.allowed) return NextResponse.json({ error: limit.error }, { status: limit.status, headers: { "Retry-After": String(limit.retryAfter) } })
  if (!isEmailConfigured() || !registrationAdminRecipient()) return NextResponse.json({ error: "Registration email is temporarily unavailable. Please try registering again shortly." }, { status: 503 })
  try {
    const admin = createAdminClient()
    const result = await registerPendingPlayer(admin, parsed.data, {
      sendVerification: async (player) => {
        const verification = await generateRegistrationVerification(admin, player, absoluteUrl("/auth/verify-email", request.url))
        if (!verification.ok || !player.email) return false
        const email = registrationVerificationEmail(player.name || "Player", verification.url)
        return sendEmail(player.email, email.subject, email.html)
      },
    })
    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again shortly." }, { status: 503 })
  }
}
