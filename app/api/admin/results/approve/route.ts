import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    try {
      const sb = await createClient()
      // Pull reported scores
      const { data: fx, error: fe } = await sb.from("fixtures").select("id,reported_home_score,reported_away_score").eq("id", id).maybeSingle()
      if (fe) throw fe
      const updates: any = {
        report_status: "APPROVED",
        status: "PLAYED",
      }
      if (fx) {
        updates.home_score = fx.reported_home_score
        updates.away_score = fx.reported_away_score
      }
      await sb.from("fixtures").update(updates).eq("id", id)
      await sb.from("notifications").insert({ title: "Report approved", body: `Fixture ${id} approved.`, user_id: null })
      return NextResponse.json({ ok: true })
    } catch (e) {
      return NextResponse.json({ ok: true })
    }
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
