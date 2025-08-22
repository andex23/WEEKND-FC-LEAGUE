import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId, action } = await request.json()
    if (!userId || !action) return NextResponse.json({ error: "Missing userId/action" }, { status: 400 })
    const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null
    if (!status) return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    const sb = await createClient()
    if (!sb) throw new Error("Supabase not configured")

    const { error } = await sb.from("users").update({ status }).eq("id", userId)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Approve registration error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
