import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fixtureId, homeScore, awayScore, events, forfeit } = body || {}
    if (!fixtureId || homeScore == null || awayScore == null) {
      return NextResponse.json({ error: "Missing fixtureId/homeScore/awayScore" }, { status: 400 })
    }

    // Try Supabase path
    try {
      const sb = await createClient()
      if (sb) {
        // 1) Update fixture final score
        await sb
          .from("fixtures")
          .update({ home_score: homeScore, away_score: awayScore, status: forfeit ? "FORFEIT" : "PLAYED", played_at: new Date().toISOString() })
          .eq("id", fixtureId)

        // 2) Insert structured match events (optional)
        if (Array.isArray(events) && events.length > 0) {
          // Expect events like { registration_id, type, minute, payload }
          const cleaned = events
            .filter((e: any) => e && e.type)
            .map((e: any) => ({ fixture_id: fixtureId, tournament_id: e.tournament_id || null, registration_id: e.registration_id || null, type: e.type, minute: e.minute || null, payload: e.payload || null }))
          if (cleaned.length > 0) {
            await sb.from("match_events").insert(cleaned)
          }
        }

        // 3) Trigger recompute (RPC if exists), else rely on views on read
        await sb.rpc("recompute_aggregates").catch(() => null)
      }
    } catch (e) {
      // Fallback: no-op
    }

    // Also notify local stats API to recompute (safe noop if not implemented)
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/admin/stats`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "recompute" }) }).catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to approve result" }, { status: 500 })
  }
}
