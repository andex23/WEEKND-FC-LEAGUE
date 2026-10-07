import type { RegistrationPlayer, RegistrationAdmin } from "../auth/registration-workflow"
import type { DeliveryState } from "../email/registration-delivery"
export type ApprovalUpdateOptions = { playerId: string; status: "approved" | "rejected"; loginUrl: string; patch?: Record<string, unknown> }
type ApprovalUpdateResult =
  | { ok: true; player: RegistrationPlayer; status: "approved" | "rejected"; emailSent: boolean }
  | { ok: false; statusCode: number; error: string }

export async function applyPlayerApproval(admin: Pick<RegistrationAdmin, "auth"> & { from: (table: string) => any },
  options: ApprovalUpdateOptions, dependencies: {
    isEmailConfigured: () => boolean
    deliverApproval: (player: RegistrationPlayer, loginUrl: string) => Promise<DeliveryState>
  }): Promise<ApprovalUpdateResult> {
  const { playerId, status, loginUrl, patch = {} } = options
  const { data: currentPlayer, error: fetchError } = await admin.from("players")
    .select("id,name,email,status").eq("id", playerId).single()
  if (fetchError || !currentPlayer) return { ok: false, statusCode: 500, error: "Failed to load player." }
  const isNewApproval = status === "approved" && currentPlayer.status !== "approved"
  if (isNewApproval) {
    const { data, error } = await admin.auth.admin.getUserById(playerId)
    if (error) return { ok: false, statusCode: 503, error: "Could not check email verification. Please try again." }
    if (!data.user?.email_confirmed_at || !data.user.email || data.user.id !== playerId ||
        data.user.email.toLowerCase() !== currentPlayer.email?.toLowerCase()) {
      return { ok: false, statusCode: 409, error: "The player must verify their email address before approval." }
    }
    if (!dependencies.isEmailConfigured()) {
      return { ok: false, statusCode: 502, error: "Approval email cannot be sent because SMTP is not configured." }
    }
  }
  // The database trigger checks verified ownership and atomically creates the
  // approval delivery. Never forge email_confirm or reset passwords on approval.
  const { data: updatedPlayer, error: updateError } = await admin.from("players")
    .update({ ...patch, status, updated_at: new Date().toISOString() })
    .eq("id", playerId).eq("status", currentPlayer.status)
    .select("*").single()
  if (updateError || !updatedPlayer) {
    return { ok: false, statusCode: 409, error: "The player changed or could not be updated. Refresh and try again." }
  }
  if (status !== "approved") return { ok: true, player: updatedPlayer, status, emailSent: false }
  const delivery = await dependencies.deliverApproval(updatedPlayer, loginUrl)
  if (isNewApproval && delivery === "ineligible") {
    return { ok: false, statusCode: 503, error: "Player is approved, but the approval email queue is missing. Ask the site operator to check the registration migration before retrying." }
  }
  if (delivery === "failed") {
    return { ok: false, statusCode: 502, error: "Player is approved, but the approval email could not be sent. Retry approval to retry the email." }
  }
  if (delivery === "pending") {
    return { ok: false, statusCode: 503, error: "Player is approved. The approval email is being sent or needs delivery review; do not repeatedly resend it." }
  }
  return { ok: true, player: updatedPlayer, status, emailSent: delivery === "sent" }
}
