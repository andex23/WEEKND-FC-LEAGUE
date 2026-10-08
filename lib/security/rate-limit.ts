import { createAdminClient } from '@/lib/supabase/admin'
import { consumeRateLimits, type RateLimitAction, type RateLimitResult } from './rate-limit-core'

export async function enforceRequestRateLimit(action: RateLimitAction, requestHeaders: Headers, identifier?: string): Promise<RateLimitResult> {
  try {
    return await consumeRateLimits(createAdminClient(), action, requestHeaders, identifier, process.env.VERCEL === '1')
  } catch {
    return { allowed: false, status: 503, retryAfter: 30, error: 'This action is temporarily unavailable. Please try again shortly.' }
  }
}
