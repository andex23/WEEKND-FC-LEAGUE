import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const sb = await createClient()

    // Danger: only run in dev/preview
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV
    if (env === "production") {
      return NextResponse.json({ error: "Disabled in production" }, { status: 400 })
    }

    // Clear fixtures
    try {
      await sb.from("fixtures").delete().neq("id", "")
    } catch {
      // Best-effort cleanup for local/dev environments.
    }

    // Clear tournaments
    try {
      await sb.from("tournaments").delete().neq("id", "")
    } catch {
      // Best-effort cleanup for local/dev environments.
    }

    // Preserve users/profiles

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Clear failed", e)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
