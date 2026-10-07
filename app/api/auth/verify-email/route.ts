import { enforceRequestRateLimit } from "@/lib/security/rate-limit"
import { NextResponse } from "next/server"
import { createClient as createAuthClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyRegistrationToken } from "@/lib/auth/registration-workflow"
import { notifyVerifiedRegistration } from "@/lib/email/registration-delivery"
import { sendEmail } from "@/lib/email"
import { verifiedRegistrationAdminEmail } from "@/lib/email/templates"
import { absoluteUrl } from "@/lib/site-url"

export async function POST(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Open the verification link on this site to continue." }, { status: 403 })
  const body = await request.json().catch(() => null)
  if (!body || (typeof body.token_hash !== "string" && typeof body.code !== "string")) {
    return NextResponse.json({ error: "This verification link is invalid. Request a new one." }, { status: 400 })
  }
  const limit = await enforceRequestRateLimit("verify-resend", request.headers)
  if (!limit.allowed) return NextResponse.json({ error: limit.error }, { status: limit.status, headers: { "Retry-After": String(limit.retryAfter) } })
  try {
    let userId: string | null = null
    if (typeof body.token_hash === "string") {
      const auth = createAuthClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
      const result = await verifyRegistrationToken(auth.auth, body.token_hash)
      if (result.ok) userId = result.user.id
    } else if (/^[a-zA-Z0-9_-]{20,512}$/.test(body.code)) {
      // Legacy PKCE callbacks need the browser's verifier cookie. This route can
      // write cookies (the old Server Component could not), then clears them.
      const client = await createClient()
      let exchanged = false
      try {
        const { data, error } = await client.auth.exchangeCodeForSession(body.code)
        exchanged = !error
        if (exchanged && data.user?.email_confirmed_at) userId = data.user.id
      } finally { if (exchanged) await client.auth.signOut({ scope: "local" }).catch(() => {}) }
    }
    if (!userId) return NextResponse.json({ error: "This verification link is invalid or expired. Request a new link, or sign in if you already verified." }, { status: 400 })
    const delivery = await notifyVerifiedRegistration(createAdminClient(), userId, absoluteUrl("/admin#registrations", request.url), sendEmail, verifiedRegistrationAdminEmail)
    return NextResponse.json({ verified: true, notificationPending: delivery === "failed" || delivery === "pending",
      message: delivery === "failed" || delivery === "pending"
        ? "Your email is verified. The admin notification is delayed; use the resend page to retry notifying the admin. Your registration still needs approval."
        : "Your email is verified. Your registration still needs admin approval; we'll email you once approved." })
  } catch {
    return NextResponse.json({ error: "Could not finish verification. If your link is now used, request a new verification email to check your registration." }, { status: 503 })
  }
}
