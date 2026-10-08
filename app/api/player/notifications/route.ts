import { requireApprovedPlayer } from "@/lib/security/player-request"
import { NextResponse } from "next/server"

export async function GET() {
  const access = await requireApprovedPlayer()
  if (!access.ok) return access.response
  const { user, supabase } = access

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,created_at,read_at,user_id")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }

  return NextResponse.json({ messages: data ?? [] })
}
