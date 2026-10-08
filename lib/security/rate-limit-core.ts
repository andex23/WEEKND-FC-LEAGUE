import { isIP } from 'node:net'

export type RateLimitAction = 'register' | 'verify-resend' | 'password-reset' | 'admin-login' | 'player-login' | 'referral' | 'password-changed'
export type RateLimitResult = { allowed: true } | { allowed: false; status: 429 | 503; retryAfter: number; error: string }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: any; error: unknown }> }

const POLICIES: Record<RateLimitAction, { ip: number; account: number; seconds: number }> = {
  register: { ip: 5, account: 3, seconds: 3600 },
  'verify-resend': { ip: 20, account: 3, seconds: 900 },
  'password-reset': { ip: 20, account: 3, seconds: 900 },
  'admin-login': { ip: 10, account: 10, seconds: 600 },
  'player-login': { ip: 20, account: 10, seconds: 600 },
  referral: { ip: 20, account: 5, seconds: 3600 },
  'password-changed': { ip: 20, account: 3, seconds: 900 },
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Shared Postgres counters work across cold starts and concurrent serverless instances. */
export async function consumeRateLimits(db: RpcClient, action: RateLimitAction, headers: Headers, identifier?: string, vercel = false): Promise<RateLimitResult> {
  const policy = POLICIES[action]
  // Vercel owns this header. Do not trust user-supplied proxy headers elsewhere.
  const forwarded = vercel ? (headers.get('x-vercel-forwarded-for') || '').trim() : ''
  const ip = isIP(forwarded) ? forwarded : 'unknown-client'
  const scopes: [string, number][] = [[`ip:${ip}`, policy.ip]]
  if (identifier?.trim()) scopes.push([`account:${identifier.trim().toLowerCase()}`, policy.account])
  try {
    for (const [scope, limit] of scopes) {
      const { data, error } = await db.rpc('consume_request_rate_limit', {
        p_key: await digest(`weekendfc:${action}:${scope}`), p_limit: limit, p_window_seconds: policy.seconds,
      })
      const result = Array.isArray(data) ? data[0] : data
      if (error || typeof result?.allowed !== 'boolean') throw new Error('Rate limit unavailable')
      if (!result.allowed) return {
        allowed: false, status: 429,
        retryAfter: Number.isFinite(Number(result.retry_after)) ? Math.max(1, Math.ceil(Number(result.retry_after))) : policy.seconds,
        error: 'Too many attempts. Please wait and try again.',
      }
    }
    return { allowed: true }
  } catch {
    return { allowed: false, status: 503, retryAfter: 30, error: 'This action is temporarily unavailable. Please try again shortly.' }
  }
}
