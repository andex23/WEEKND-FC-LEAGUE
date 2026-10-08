import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRequestRateLimit } from '@/lib/security/rate-limit'
import { notifyVerifiedRegistration } from '@/lib/email/registration-delivery'
import { verifiedRegistrationAdminEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email'
import { absoluteUrl } from '@/lib/site-url'

/** Recovery can verify email ownership too, but never approves registration. */
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user?.email_confirmed_at) return NextResponse.json({ error: 'Verified session required' }, { status: 401 })
  const limit = await enforceRequestRateLimit('verify-resend', request.headers, user.id)
  if (!limit.allowed) return NextResponse.json({ error: limit.error }, { status: limit.status, headers: { 'Retry-After': String(limit.retryAfter) } })
  try {
    const delivery = await notifyVerifiedRegistration(createAdminClient(), user.id,
      absoluteUrl('/admin#registrations', request.url), sendEmail, verifiedRegistrationAdminEmail)
    return NextResponse.json({ ok: true, notificationPending: delivery === 'failed' || delivery === 'pending' })
  } catch {
    return NextResponse.json({ error: 'Review notification is temporarily unavailable' }, { status: 503 })
  }
}
