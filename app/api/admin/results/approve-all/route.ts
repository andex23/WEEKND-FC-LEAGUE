import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    try {
      const sb = await createClient()
      // First set scores = reported where missing
      await sb.rpc("approve_all_reports")
      // Fallback if RPC not available: best-effort update
      await sb.from("fixtures").update({ status: "PLAYED", report_status: "APPROVED" }).in("report_status", ["PENDING", "CONFLICT"]) as any
      await sb.from("notifications").insert({ title: "Reports approved", body: "All pending reports approved.", user_id: null })
    } catch {}
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
