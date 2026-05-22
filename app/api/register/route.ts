import { type NextRequest, NextResponse } from "next/server"
import { registrationSchema } from "@/lib/validations"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { confirmEmail } from "@/lib/email/templates"

const CONN_ERROR = /fetch failed|network|ENOTFOUND|ECONNREFUSED|timeout|getaddrinfo/i

const SUCCESS = {
  message:
    "Registration submitted. Check your email to confirm your account, then an admin will review it.",
}
const CONN_MESSAGE =
  "Could not reach the league database. It may be offline or misconfigured — please try again shortly."
const EMAIL_MESSAGE =
  "We couldn't send your confirmation email just now. Please try again in a few minutes — if it keeps happening, let an admin know."

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = registrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid registration details" },
      { status: 400 },
    )
  }
  const data = parsed.data

  const supabase = await createClient()

  // Registration must be open.
  const { data: settings } = await supabase
    .from("league_settings")
    .select("registration_open")
    .limit(1)
    .maybeSingle()
  if (settings && settings.registration_open === false) {
    return NextResponse.json({ error: "Registration is currently closed." }, { status: 400 })
  }

  const username = data.username.toLowerCase()
  const email = data.email.toLowerCase()

  // Username and email must be unique.
  const { data: existingUsername } = await supabase
    .from("players")
    .select("id")
    .eq("username", username)
    .maybeSingle()
  if (existingUsername) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 })
  }
  const { data: existingEmail } = await supabase
    .from("players")
    .select("id")
    .eq("email", email)
    .maybeSingle()
  if (existingEmail) {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 })
  }

  const admin = createAdminClient()
  const callbackUrl = `${request.nextUrl.origin}/auth/callback`

  // The player profile, minus the id (set once the auth user exists).
  const playerRow = {
    username,
    email,
    name: data.name,
    psn_id: data.psnName,
    location: data.location,
    console: data.console,
    preferred_club: data.preferredClub,
    download_mbps: Number(data.downloadMbps),
    upload_mbps: Number(data.uploadMbps),
    role: "PLAYER",
    status: "pending",
  }

  // Preferred path: when our own SMTP is configured, create the account and
  // send a branded confirmation email ourselves. This keeps sign-up working
  // even when Supabase's built-in email service is unavailable or rate-limited.
  if (isEmailConfigured()) {
    // generateLink creates the (unconfirmed) auth user and returns the
    // confirmation link without Supabase sending any email.
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password: data.password,
      options: {
        data: { username, name: data.name },
        redirectTo: callbackUrl,
      },
    })
    if (linkError || !linkData?.user) {
      const msg = linkError?.message || ""
      if (/already.*(registered|exists)|registered.*already/i.test(msg)) {
        return NextResponse.json({ error: "That email is already registered." }, { status: 409 })
      }
      if (CONN_ERROR.test(msg)) {
        return NextResponse.json({ error: CONN_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({ error: msg || "Could not create your account." }, { status: 400 })
    }

    const userId = linkData.user.id
    const confirmUrl = linkData.properties?.action_link

    // Create the player profile. The service-role client bypasses RLS.
    const { error: playerError } = await admin.from("players").insert({ id: userId, ...playerRow })
    if (playerError) {
      console.error("Player profile creation failed:", playerError)
      await admin.auth.admin.deleteUser(userId).catch(() => {})
      return NextResponse.json(
        { error: "Could not complete your registration. Please try again." },
        { status: 500 },
      )
    }

    const { subject, html } = confirmEmail(data.name, confirmUrl || callbackUrl)
    const sent = confirmUrl ? await sendEmail(email, subject, html) : false
    if (!sent) {
      // Roll the account back so the player can try again once email works,
      // rather than being permanently stuck on "already registered".
      await admin.from("players").delete().eq("id", userId)
      await admin.auth.admin.deleteUser(userId).catch(() => {})
      return NextResponse.json({ error: EMAIL_MESSAGE }, { status: 502 })
    }

    return NextResponse.json(SUCCESS, { status: 201 })
  }

  // Fallback: no app SMTP configured — let Supabase create the user and send
  // its own confirmation email. The link returns to /auth/callback.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: {
      data: { username, name: data.name },
      emailRedirectTo: callbackUrl,
    },
  })
  if (authError || !authData.user) {
    const msg = authError?.message || ""
    if (CONN_ERROR.test(msg)) {
      return NextResponse.json({ error: CONN_MESSAGE }, { status: 503 })
    }
    if (/sending.*email|confirmation email|smtp/i.test(msg)) {
      return NextResponse.json({ error: EMAIL_MESSAGE }, { status: 502 })
    }
    return NextResponse.json({ error: msg || "Could not create your account." }, { status: 400 })
  }

  const { error: playerError } = await admin
    .from("players")
    .insert({ id: authData.user.id, ...playerRow })
  if (playerError) {
    console.error("Player profile creation failed:", playerError)
    return NextResponse.json(
      { error: "Account created but profile setup failed. Please contact an admin." },
      { status: 500 },
    )
  }

  return NextResponse.json(SUCCESS, { status: 201 })
}
