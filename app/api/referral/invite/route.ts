import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { referralEmail } from "@/lib/email/templates"

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// Lets a signed-in player email a branded league invite to a friend.
export async function POST(request: NextRequest) {
  let body: { email?: string; note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const email = (body.email || "").trim().toLowerCase()
  const note = (body.note || "").trim().slice(0, 300)
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to send invites." }, { status: 401 })
  }

  const { data: player } = await supabase
    .from("players")
    .select("name")
    .eq("id", user.id)
    .maybeSingle()

  const { subject, html } = referralEmail({
    inviterName: player?.name || "A Weekend FC player",
    registerUrl: `${request.nextUrl.origin}/register`,
    note: note || undefined,
  })

  const ok = await sendEmail(email, subject, html)
  if (!ok) {
    return NextResponse.json({ error: "Couldn't send the invite. Please try again shortly." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
