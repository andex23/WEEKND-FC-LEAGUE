import { isEmailConfigured, sendEmail } from "@/lib/email"
import { approvalConfirmedEmail } from "@/lib/email/templates"
import { shouldSendApprovalConfirmationEmail } from "@/lib/admin/approval-email"

type AdminClient = {
  auth: {
    admin: {
      updateUserById: (
        userId: string,
        attributes: { email_confirm?: boolean },
      ) => Promise<{ error: { message?: string } | null }>
    }
  }
}

type PlayerForConfirmation = {
  id: string
  name?: string | null
  email?: string | null
  status?: string | null
}

type ApprovalStatus = "approved" | "rejected"

type ApprovalUpdateResult =
  | { ok: true; player: PlayerForConfirmation; status: ApprovalStatus; emailSent: boolean }
  | { ok: false; statusCode: number; error: string }

type ApprovalUpdateOptions = {
  playerId: string
  status: ApprovalStatus
  loginUrl: string
  patch?: Record<string, unknown>
}

export async function confirmApprovedPlayerAuthEmail(
  admin: AdminClient,
  player: PlayerForConfirmation,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.auth.admin.updateUserById(player.id, { email_confirm: true })
  if (error) {
    return { ok: false, error: error.message || "Could not confirm the player's email." }
  }
  return { ok: true }
}

export async function sendApprovalConfirmationEmail(
  player: PlayerForConfirmation,
  loginUrl: string,
): Promise<boolean> {
  if (!player.email) return false
  const { subject, html } = approvalConfirmedEmail(player.name || "Player", loginUrl)
  return sendEmail(player.email, subject, html)
}

export async function updatePlayerStatusWithApprovalEmail(
  admin: AdminClient & { from: (table: string) => any },
  options: ApprovalUpdateOptions,
): Promise<ApprovalUpdateResult> {
  const { playerId, status, loginUrl, patch = {} } = options
  const { data: currentPlayer, error: fetchError } = await admin
    .from("players")
    .select("id,name,email,status")
    .eq("id", playerId)
    .single()

  if (fetchError || !currentPlayer) {
    console.error("Error fetching player before status update:", fetchError)
    return { ok: false, statusCode: 500, error: "Failed to load player." }
  }

  const isNewApproval = shouldSendApprovalConfirmationEmail(currentPlayer, status)
  const isApprovalAttempt =
    status === "approved" && String(currentPlayer.status || "pending").toLowerCase() !== "approved"

  if (isApprovalAttempt && !currentPlayer.email) {
    return {
      ok: false,
      statusCode: 400,
      error: "Player has no email address, so the confirmation email cannot be sent.",
    }
  }

  if (isNewApproval && !isEmailConfigured()) {
    return {
      ok: false,
      statusCode: 502,
      error: "Approval email cannot be sent because SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    }
  }

  if (isNewApproval) {
    const confirmed = await confirmApprovedPlayerAuthEmail(admin, currentPlayer)
    if (!confirmed.ok) {
      console.error("Error confirming approved player auth email:", confirmed.error)
      return { ok: false, statusCode: 500, error: "Failed to confirm player email." }
    }
  }

  const { data: updatedPlayer, error: updateError } = await admin
    .from("players")
    .update({ ...patch, status, updated_at: new Date().toISOString() })
    .eq("id", playerId)
    .select("*")
    .single()

  if (updateError || !updatedPlayer) {
    console.error("Error updating player status:", updateError)
    return { ok: false, statusCode: 500, error: "Failed to update player." }
  }

  if (isNewApproval) {
    const sent = await sendApprovalConfirmationEmail(updatedPlayer, loginUrl)
    if (!sent) {
      await admin
        .from("players")
        .update({ status: currentPlayer.status || "pending", updated_at: new Date().toISOString() })
        .eq("id", playerId)

      return {
        ok: false,
        statusCode: 502,
        error: "Player was not approved because the confirmation email could not be sent.",
      }
    }
  }

  return { ok: true, player: updatedPlayer, status, emailSent: isNewApproval }
}
