import type { RegistrationAdmin, RegistrationPlayer } from "../auth/registration-workflow"
export async function withRegistrationState<T extends RegistrationPlayer>(
  admin: Pick<RegistrationAdmin, "auth"> & { from: (table: string) => any }, players: T[],
): Promise<(T & { email_verified: boolean | null; approval_email_state: string | null })[]> {
  const result: (T & { email_verified: boolean | null; approval_email_state: string | null })[] = []
  // Bound concurrent Auth calls; never return Auth users, metadata or tokens.
  for (let start = 0; start < players.length; start += 8) {
    const chunk = players.slice(start, start + 8)
    const { data: deliveries } = await admin.from("registration_email_deliveries")
      .select("player_id,state").eq("kind", "approval").in("player_id", chunk.map((p) => p.id))
    const states = new Map((deliveries || []).map((row: {player_id: string; state: string}) => [row.player_id, row.state]))
    result.push(...await Promise.all(chunk.map(async (player) => {
      let emailVerified: boolean | null = null
      try {
        const { data, error } = await admin.auth.admin.getUserById(player.id)
        if (!error) emailVerified = Boolean(data.user?.id === player.id && data.user.email_confirmed_at &&
          data.user.email && data.user.email.toLowerCase() === player.email?.toLowerCase())
      } catch { /* Fail closed for approval controls, retain the rest of the roster. */ }
      return { ...player, email_verified: emailVerified, approval_email_state: (states.get(player.id) as string | undefined) || null }
    })))
  }
  return result
}

export function registrationApprovalAction(player: { status?: string | null; email_verified?: boolean | null; approval_email_state?: string | null }): "approve" | "retry" | "none" {
  if (player.email_verified !== true) return "none"
  if (player.status !== "approved") return "approve"
  return player.approval_email_state === "failed" || player.approval_email_state === "pending" ? "retry" : "none"
}
