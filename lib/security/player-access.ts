export type AuthUser = { id: string; email?: string; email_confirmed_at?: string | null }

type AccessClient = {
  auth: { getUser: () => Promise<{ data: { user: AuthUser | null }; error?: unknown }> }
  from: (table: string) => any
  rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }>
}

export type PlayerAccess =
  | { ok: true; user: AuthUser }
  | { ok: false; status: 401 | 403 | 503; code: string; error: string }

const unavailable = (): PlayerAccess => ({
  ok: false, status: 503, code: 'access_unavailable',
  error: 'We could not check your account access. Please try again shortly.',
})

/** Recheck current state for every protected request, including recovery sessions. */
export async function readPlayerAccess(client: AccessClient): Promise<PlayerAccess> {
  try {
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError && !(typeof authError === 'object' && authError !== null &&
      'name' in authError && authError.name === 'AuthSessionMissingError' && !user)) return unavailable()
    if (!user) return { ok: false, status: 401, code: 'not_authenticated', error: 'Sign in to continue.' }
    if (!user.email_confirmed_at) return {
      ok: false, status: 403, code: 'email_unverified',
      error: 'Verify your email first. Then an admin can review your registration.',
    }
    // Only status is needed. The browser/session role cannot read privileged role data.
    const { data: player, error } = await client.from('players').select('status').eq('id', user.id).maybeSingle()
    if (error) return unavailable()
    if (!player) return { ok: false, status: 403, code: 'profile_missing', error: 'Your player profile is unavailable. Contact the organizer.' }
    if (player.status === 'approved') {
      const delivery = await client.rpc('player_access_ready')
      if (delivery.error || typeof delivery.data !== 'boolean') return unavailable()
      if (!delivery.data) return { ok: false, status: 403, code: 'approval_email_pending',
        error: 'Your registration is approved. Your approval email is still being delivered; please try again shortly.' }
      return { ok: true, user }
    }
    if (player.status === 'rejected') return {
      ok: false, status: 403, code: 'registration_rejected',
      error: 'Your registration was not approved. Contact the organizer if you think this is a mistake.',
    }
    return { ok: false, status: 403, code: 'approval_pending', error: 'Your email is verified. An admin still needs to approve your registration.' }
  } catch {
    return unavailable()
  }
}
