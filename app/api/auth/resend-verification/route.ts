import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { enforceRequestRateLimit } from "@/lib/security/rate-limit"
import { isEmailConfigured, sendEmail } from "@/lib/email"
import { registrationVerificationEmail, verifiedRegistrationAdminEmail } from "@/lib/email/templates"
import { generateRegistrationVerification } from "@/lib/auth/registration-workflow"
import { notifyVerifiedRegistration } from "@/lib/email/registration-delivery"
import { absoluteUrl } from "@/lib/site-url"

const schema = z.object({ email: z.string().trim().email().max(254) })
const generic = { message: "If this email belongs to a registration awaiting verification, a new link has been sent. If you already verified, your registration remains in review." }
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  const email = parsed.data.email.toLowerCase()
  const limit = await enforceRequestRateLimit("verify-resend", request.headers, email)
  if (!limit.allowed) return NextResponse.json({ error: limit.error }, { status: limit.status, headers: { "Retry-After": String(limit.retryAfter) } })
  if (!isEmailConfigured()) return NextResponse.json({ error: "Verification email is temporarily unavailable. Please try again shortly." }, { status: 503 })
  try {
    const admin = createAdminClient()
    const { data: player, error } = await admin.from("players").select("id,name,email,status").eq("email", email).maybeSingle()
    if (error) throw new Error("Registration lookup unavailable")
    if (!player || player.status !== "pending") return NextResponse.json(generic)
    const { data: auth, error: authError } = await admin.auth.admin.getUserById(player.id)
    if (authError) throw new Error("Verification lookup unavailable")
    if (auth.user?.email_confirmed_at) {
      // Safe recovery for a failed admin alert after the verification token was
      // consumed. Server-confirmed ownership, fixed recipient, durable dedup.
      const notification = await notifyVerifiedRegistration(admin, player.id, absoluteUrl("/admin#registrations", request.url), sendEmail, verifiedRegistrationAdminEmail)
      if (notification === "failed") throw new Error("Admin notification unavailable")
    } else {
      const link = await generateRegistrationVerification(admin, player, absoluteUrl("/auth/verify-email", request.url))
      if (link.ok) {
        const content = registrationVerificationEmail(player.name || "Player", link.url)
        if (!(await sendEmail(player.email, content.subject, content.html))) throw new Error("Verification delivery unavailable")
      } else throw new Error("Verification generation unavailable")
    }
    // Keep unknown/approved/rejected/eligible outcomes indistinguishable.
    return NextResponse.json(generic)
  } catch {
    return NextResponse.json({ error: "Could not process verification requests. Please try again shortly." }, { status: 503 })
  }
}
