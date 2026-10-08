import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readPlayerAccess } from './player-access'

/** Every private route calls this before reading private data or performing writes. */
export async function requireApprovedPlayer() {
  const supabase = await createClient()
  const access = await readPlayerAccess(supabase)
  if (!access.ok) return {
    ok: false as const,
    response: NextResponse.json({ error: access.error, code: access.code }, {
      status: access.status, headers: { 'Cache-Control': 'no-store' },
    }),
  }
  return { ok: true as const, user: access.user, supabase }
}
