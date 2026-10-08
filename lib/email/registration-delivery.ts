import type { RegistrationAdmin, RegistrationPlayer } from "../auth/registration-workflow"
export type DeliveryState = "sent" | "failed" | "pending" | "ineligible"
export type EmailSender = (to: string, subject: string, html: string) => Promise<boolean>
export type DeliveryAdmin = Pick<RegistrationAdmin, "auth"> & { from: (table: string) => any }
export function registrationAdminRecipient(): string | null {
  const value = process.env.REGISTRATION_ADMIN_EMAIL?.trim().toLowerCase() || ""
  return /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test(value) ? value : null
}

/** Claim a durable delivery once. Never reclaim a sending row automatically:
 * SMTP may have accepted it before a worker stopped. Reconcile those manually. */
export async function deliverRegistrationEmail(admin: { from: (table: string) => any }, playerId: string,
  kind: "verified_registration" | "approval", deliver: () => Promise<boolean>, enqueue = false): Promise<DeliveryState> {
  if (enqueue) {
    const { error } = await admin.from("registration_email_deliveries").insert({ player_id: playerId, kind, state: "pending" })
    if (error && error.code !== "23505") return "failed"
  }
  const { data: existing, error: lookupError } = await admin.from("registration_email_deliveries")
    .select("state").eq("player_id", playerId).eq("kind", kind).maybeSingle()
  if (lookupError) return "failed"
  if (!existing) return "ineligible"
  if (existing.state === "sent") return "sent"
  const claimId = crypto.randomUUID()
  const { data: claimed, error: claimError } = await admin.from("registration_email_deliveries")
    .update({ state: "sending", claim_id: claimId, updated_at: new Date().toISOString() })
    .eq("player_id", playerId).eq("kind", kind).in("state", ["pending", "failed"])
    .select("player_id").maybeSingle()
  if (claimError) return "failed"
  if (!claimed) return "pending"
  let sent: boolean
  try { sent = await deliver() } catch { return "pending" }
  const { data: recorded, error: recordError } = await admin.from("registration_email_deliveries")
    .update({ state: sent ? "sent" : "failed", updated_at: new Date().toISOString() })
    .eq("player_id", playerId).eq("kind", kind).eq("claim_id", claimId).eq("state", "sending")
    .select("player_id").maybeSingle()
  // A send whose completion cannot be recorded is ambiguous, not safe to retry.
  if (recordError || !recorded) return "pending"
  return sent ? "sent" : "failed"
}

export async function notifyVerifiedRegistration(admin: DeliveryAdmin, playerId: string, adminUrl: string,
  send: EmailSender, buildEmail: (name: string, platform: string, url: string) => { subject: string; html: string }): Promise<DeliveryState> {
  const [{ data: auth, error: authError }, { data: player, error: playerError }] = await Promise.all([
    admin.auth.admin.getUserById(playerId),
    admin.from("players").select("id,name,email,console,status").eq("id", playerId).maybeSingle(),
  ])
  if (authError || playerError) return "failed"
  const user = auth?.user
  if (!user?.email_confirmed_at || !user.email || !player || user.id !== player.id ||
      user.email.toLowerCase() !== player.email?.toLowerCase() || player.status !== "pending") return "ineligible"
  const recipient = registrationAdminRecipient()
  if (!recipient) return "failed"
  const content = buildEmail(String(player.name || "Player").slice(0, 50),
    ["PS5", "XBOX", "PC"].includes(player.console) ? player.console : "Not specified", adminUrl)
  return deliverRegistrationEmail(admin, playerId, "verified_registration",
    () => send(recipient, content.subject, content.html), true)
}
