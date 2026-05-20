import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { available } = await request.json().catch(() => ({}))
  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "`available` must be a boolean" }, { status: 400 })
  }

  const { error } = await supabase.from("players").update({ available }).eq("id", user.id)
  if (error) {
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
  }

  return NextResponse.json({ success: true, available })
}
