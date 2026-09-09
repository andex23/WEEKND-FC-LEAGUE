import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Keep the setup draft in the same durable configuration store as admin settings.
async function storage() {
  const db = createAdminClient()
  const { data, error } = await db.from("tournaments").select("id,config")
    .order("created_at", { ascending: true }).limit(1).maybeSingle()
  if (error) throw error
  return { db, row: data }
}

export async function GET() {
  try {
    const { row } = await storage()
    return NextResponse.json({ config: row?.config?.setup_draft || null })
  } catch {
    return NextResponse.json({ error: "Could not load setup draft" }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const { config } = await request.json()
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return NextResponse.json({ error: "A setup config is required" }, { status: 400 })
    }
    const { db, row } = await storage()
    const result = row
      ? await db.from("tournaments").update({ config: { ...row.config, setup_draft: config } }).eq("id", row.id)
      : await db.from("tournaments").insert({ name: "Weekend FC setup", status: "DRAFT", is_active: false, config: { setup_draft: config } })
    if (result.error) throw result.error
    return NextResponse.json({ ok: true, config })
  } catch {
    return NextResponse.json({ error: "Could not save setup draft" }, { status: 503 })
  }
}
