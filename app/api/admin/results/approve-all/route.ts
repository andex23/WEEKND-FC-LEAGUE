import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const sb = await createClient()
    // Copy each pending report's reported scores into the official score columns.
    const { data: pending, error } = await sb
      .from("fixtures")
      .select("id,reported_home_score,reported_away_score")
      .in("report_status", ["PENDING", "CONFLICT"])
    if (error) throw error

    for (const fx of pending || []) {
      await sb
        .from("fixtures")
        .update({
          status: "PLAYED",
          report_status: "APPROVED",
          home_score: fx.reported_home_score,
          away_score: fx.reported_away_score,
          played_at: new Date().toISOString(),
        })
        .eq("id", fx.id)
    }

    await sb
      .from("notifications")
      .insert({ title: "Reports approved", body: "All pending reports approved.", user_id: null })

    return NextResponse.json({ ok: true, approved: (pending || []).length })
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
