import { type NextRequest, NextResponse } from "next/server"
import { registrationSchema } from "@/lib/validations"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CONN_ERROR = /fetch failed|network|ENOTFOUND|ECONNREFUSED|timeout|getaddrinfo/i

const SUCCESS = {
  message:
    "Registration submitted. An admin will review it and email you once you're approved.",
}
const CONN_MESSAGE =
  "Could not reach the league database. It may be offline or misconfigured — please try again shortly."

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

  // Create a pending, unconfirmed auth user without sending email. The approval
  // route confirms the auth email and sends the player the confirmation email.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: false,
    user_metadata: { username, name: data.name },
  })
  if (authError || !authData.user) {
    const msg = authError?.message || ""
    if (/already.*(registered|exists)|registered.*already|already been registered/i.test(msg)) {
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 })
    }
    if (CONN_ERROR.test(msg)) {
      return NextResponse.json({ error: CONN_MESSAGE }, { status: 503 })
    }
    return NextResponse.json({ error: msg || "Could not create your account." }, { status: 400 })
  }

  const { error: playerError } = await admin
    .from("players")
    .insert({ id: authData.user.id, ...playerRow })
  if (playerError) {
    console.error("Player profile creation failed:", playerError)
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => {})
    return NextResponse.json(
      { error: "Could not complete your registration. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json(SUCCESS, { status: 201 })
}
