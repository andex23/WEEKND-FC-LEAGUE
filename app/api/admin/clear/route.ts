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

    // Clear fixtures/reports-like fields from fixtures table if exists
    await sb.from("fixtures").delete().neq("id", "").catch(() => null)

    // Clear tournaments if exists
    await sb.from("tournaments").delete().neq("id", "").catch(() => null)

    // Clear users table but keep auth.users intact in dev (cannot delete via anon)
    await sb.from("users").delete().neq("id", "").catch(() => null)
    await sb.from("profiles").delete().neq("id", "").catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Clear failed", e)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
