import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { playerId, available } = await request.json()

    const { error } = await supabase.from("players").update({ available_this_weekend: available }).eq("id", playerId)

    if (error) {
      console.error("Error updating availability:", error)
      return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in availability API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
