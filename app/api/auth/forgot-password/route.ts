import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { passwordResetEmail } from "@/lib/email/templates"
import { absoluteUrl } from "@/lib/site-url"

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function ok() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const { email: rawEmail } = await request.json().catch(() => ({}))
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }

  const admin = createAdminClient()
  const resetPageUrl = new URL(absoluteUrl("/auth/reset-password", request.url))

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: absoluteUrl("/auth/callback?next=%2Fauth%2Freset-password", request.url),
    },
  })

  if (error || !data.properties?.hashed_token) {
    // Keep the response generic so this endpoint does not reveal whether an
    // email address has an account.
    console.warn("Could not generate password reset link:", error?.message || "missing token")
    return ok()
  }

  resetPageUrl.searchParams.set("token_hash", data.properties.hashed_token)
  resetPageUrl.searchParams.set("type", "recovery")

  const { data: player } = await admin
    .from("players")
    .select("name")
    .eq("email", email)
    .maybeSingle()

  const { subject, html } = passwordResetEmail(player?.name || "there", resetPageUrl.toString())
  const sent = await sendEmail(email, subject, html)

  if (!sent) {
    return NextResponse.json({ error: "Could not send the reset email. Check SMTP settings." }, { status: 502 })
  }

  return ok()
}
