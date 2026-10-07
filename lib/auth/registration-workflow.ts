export type RegistrationPlayer = { id: string; email?: string | null; name?: string | null; console?: string | null; status?: string | null }
export type RegistrationAuthUser = { id: string; email?: string; email_confirmed_at?: string | null }
export type RegistrationAdmin = {
  auth: { admin: {
    getUserById: (id: string) => Promise<{ data: { user: RegistrationAuthUser | null }; error: unknown }>
    generateLink: (params: { type: "signup"; email: string; password: string }) => Promise<{
      data: { user: RegistrationAuthUser | null; properties: { hashed_token?: string; verification_type?: string } | null }; error: unknown
    }>
  } }
}

export function verifiedPlayerIdentity(user: RegistrationAuthUser | null, player: RegistrationPlayer): boolean {
  return Boolean(user && user.id === player.id && user.email_confirmed_at && user.email &&
    user.email.toLowerCase() === player.email?.toLowerCase())
}

export async function generateRegistrationVerification(admin: RegistrationAdmin, player: RegistrationPlayer, landingUrl: string) {
  const { data, error } = await admin.auth.admin.getUserById(player.id)
  if (error || !data.user || data.user.id !== player.id || !player.email ||
      data.user.email?.toLowerCase() !== player.email.toLowerCase() || data.user.email_confirmed_at) {
    return { ok: false as const }
  }
  // The account is already reserved with createUser. GoTrue's existing-user
  // signup-link branch leaves its password unchanged. Never pass metadata here.
  const generated = await admin.auth.admin.generateLink({ type: "signup", email: player.email, password: "" })
  const token = generated.data?.properties?.hashed_token
  if (generated.error || generated.data?.user?.id !== player.id || !token ||
      generated.data?.properties?.verification_type !== "signup") return { ok: false as const }
  const url = new URL(landingUrl)
  // Fragments stay out of HTTP request/access logs and Referer headers.
  url.hash = new URLSearchParams({ token_hash: token }).toString()
  return { ok: true as const, url: url.toString() }
}

export async function verifyRegistrationToken(auth: {
  verifyOtp: (params: { token_hash: string; type: "signup" }) => Promise<{ data: { user: RegistrationAuthUser | null }; error: unknown }>
  signOut: (options?: { scope: "local" }) => Promise<{ error: unknown }>
}, token: string) {
  if (!/^[a-fA-F0-9]{32,256}$/.test(token)) return { ok: false as const }
  try {
    const { data, error } = await auth.verifyOtp({ token_hash: token, type: "signup" })
    if (error || !data.user?.email_confirmed_at) return { ok: false as const }
    return { ok: true as const, user: data.user }
  } catch {
    return { ok: false as const }
  } finally {
    // This is a dedicated, nonpersisting client: no access/refresh token leaves
    // this request and no unrelated browser session is signed out.
    await auth.signOut({ scope: "local" }).catch(() => {})
  }
}

export async function registerPendingPlayer(admin: {
  auth: { admin: {
    createUser: (params: { email: string; password: string; email_confirm: false; user_metadata: {username: string; name: string} }) => Promise<{data: {user: {id: string} | null}; error: {message?: string} | null}>
    deleteUser: (id: string) => Promise<unknown>
  } }
  from: (table: string) => any
}, data: {
  username: string; email: string; password: string; name: string; psnName: string; location: string;
  console: string; preferredClub: string; downloadMbps: string; uploadMbps: string
}, dependencies: { sendVerification: (player: RegistrationPlayer) => Promise<boolean> }) {
  const failure = (status: number, error: string) => ({ status, body: { error } })
  const { data: settings, error: settingsError } = await admin.from("league_settings")
    .select("registration_open").limit(1).maybeSingle()
  if (settingsError || !settings) return failure(503, "Could not check registration availability. Please try again shortly.")
  if (settings.registration_open === false) return failure(400, "Registration is currently closed.")
  const username = data.username.toLowerCase()
  const email = data.email.toLowerCase()
  for (const [field, value, message] of [["username", username, "That username is already taken."],
    ["email", email, "That email is already registered. Sign in or resend your verification email."]]) {
    const { data: duplicate, error } = await admin.from("players").select("id").eq(field, value).maybeSingle()
    if (error) return failure(503, "Could not check account availability. Please try again.")
    if (duplicate) return failure(409, message)
  }
  // createUser rejects duplicate Auth emails even when no player row exists.
  // Calling generateLink directly could reuse an unverified existing account.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email, password: data.password, email_confirm: false, user_metadata: { username, name: data.name },
  })
  if (authError || !authData.user) {
    if (/already.*(registered|exists)|registered.*already/i.test(authError?.message || "")) {
      return failure(409, "That email is already registered. Sign in or resend your verification email.")
    }
    return failure(503, "Could not create your account. Please try again shortly.")
  }
  const player = { id: authData.user.id, username, email, name: data.name,
    psn_id: data.psnName, location: data.location, console: data.console, preferred_club: data.preferredClub,
    download_mbps: Number(data.downloadMbps), upload_mbps: Number(data.uploadMbps), role: "PLAYER", status: "pending" }
  const { error: playerError } = await admin.from("players").insert(player)
  if (playerError) {
    // This ID was created in this request, so cleanup cannot delete a duplicate.
    try { await admin.auth.admin.deleteUser(authData.user.id) } catch { /* Reconcile orphaned Auth IDs manually. */ }
    return failure(500, "Could not complete your registration. Please try again; if the email is already registered, contact the league admin.")
  }
  let sent = false
  try { sent = await dependencies.sendVerification(player) } catch { /* Keep the account available for resend. */ }
  return { status: 201, body: { verificationEmailSent: sent, message: sent
    ? "Check your email and verify your address. An admin will then review your registration and email you once approved."
    : "Your account was created, but the verification email could not be sent. Use resend verification; you do not need to register again." } }
}
