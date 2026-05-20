import { type NextRequest, NextResponse } from "next/server"
import { registrationSchema } from "@/lib/validations"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

  // Create the auth user with the player's real email address.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: { data: { username, name: data.name } },
  })
  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || "Could not create your account." },
      { status: 400 },
    )
  }

  // Create the player profile. The service-role client bypasses RLS for this
  // initial insert.
  const admin = createAdminClient()
  const { error: playerError } = await admin.from("players").insert({
    id: authData.user.id,
    username,
    email,
    name: data.name,
    psn_id: data.psnName,
    location: data.location,
    console: data.console,
    preferred_club: data.preferredClub,
    role: "PLAYER",
    status: "pending",
  })
  if (playerError) {
    console.error("Player profile creation failed:", playerError)
    return NextResponse.json(
      { error: "Account created but profile setup failed. Please contact an admin." },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { message: "Registration submitted. An admin will review your account." },
    { status: 201 },
  )
}
