import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendBroadcast } from "@/lib/email"
import { announcementEmail } from "@/lib/email/templates"

// Admin-only (gated by middleware). Emails an announcement to every approved
// player and records it as an in-app broadcast notification.
export async function POST(request: NextRequest) {
  let body: { subject?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const subject = (body.subject || "").trim()
  const message = (body.message || "").trim()
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are both required." }, { status: 400 })
  }

  const admin = createAdminClient()

  await admin.from("notifications").insert({ title: subject, body: message })

  const { data: players } = await admin.from("players").select("email").eq("status", "approved")
  const emails = ((players || []) as { email: string | null }[])
    .map((p) => p.email)
    .filter((e): e is string => Boolean(e))

  const { html } = announcementEmail(subject, message)
  const sent = await sendBroadcast(emails, subject, html)

  return NextResponse.json({ ok: true, sent, recipients: emails.length })
}
