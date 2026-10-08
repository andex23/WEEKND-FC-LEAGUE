import { isEmailConfigured, sendEmail } from "@/lib/email"
import { approvalConfirmedEmail } from "@/lib/email/templates"
import { deliverRegistrationEmail } from "@/lib/email/registration-delivery"
import { applyPlayerApproval, type ApprovalUpdateOptions } from "@/lib/admin/approval-workflow"
import type { RegistrationAdmin, RegistrationPlayer } from "@/lib/auth/registration-workflow"

export async function sendApprovalConfirmationEmail(player: RegistrationPlayer, loginUrl: string): Promise<boolean> {
  if (!player.email) return false
  const { subject, html } = approvalConfirmedEmail(player.name || "Player", loginUrl)
  return sendEmail(player.email, subject, html)
}

export async function updatePlayerStatusWithApprovalEmail(
  admin: Pick<RegistrationAdmin, "auth"> & { from: (table: string) => any }, options: ApprovalUpdateOptions,
) {
  return applyPlayerApproval(admin, options, {
    isEmailConfigured,
    deliverApproval: (player, loginUrl) => deliverRegistrationEmail(admin, player.id, "approval",
      () => sendApprovalConfirmationEmail(player, loginUrl)),
  })
}
