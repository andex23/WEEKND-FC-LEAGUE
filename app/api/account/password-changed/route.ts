import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { passwordChangedEmail } from "@/lib/email/templates"

// Sends a "your password was changed" security alert to the signed-in user.
// Called by the reset-password page right after a successful password update.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { data: player } = await supabase
    .from("players")
    .select("name")
    .eq("id", user.id)
    .maybeSingle()

  const { subject, html } = passwordChangedEmail(player?.name || "there")
  await sendEmail(user.email, subject, html)

  return NextResponse.json({ ok: true })
}
