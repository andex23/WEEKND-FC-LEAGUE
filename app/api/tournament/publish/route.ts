import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { config, setActive } = body

  // TODO: Persist to Supabase: tournaments row (config jsonb), set status, is_active; create tournament_teams; generate fixtures

  return NextResponse.json({ ok: true, setActive: Boolean(setActive), configSnapshot: config })
}
