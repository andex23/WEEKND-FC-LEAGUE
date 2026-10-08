import type { HubPlayer, HubMessage } from "./player-hub"

export function isPlayerRoute(path: string) {
  return ["/dashboard", "/report", "/refer"].some(
    (route) => path === route || path.startsWith(`${route}/`),
  )
}
export type PlayerShellData = {
  player: HubPlayer
  messages: HubMessage[]
  notificationsError: string | null
}
export class PlayerShellAccessError extends Error {
  accessDenied = true
  constructor() {
    super("Your account access needs to be checked. Please sign in again.")
  }
}
export async function loadPlayerShell(
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<PlayerShellData> {
  const profile = await fetcher("/api/player/profile", { signal, cache: "no-store" })
  if ([401, 403].includes(profile.status)) throw new PlayerShellAccessError()
  if (!profile.ok) throw new Error("Your profile is temporarily unavailable.")
  const { player } = await profile.json()
  if (!player?.id || player.status !== "approved") throw new PlayerShellAccessError()
  try {
    const response = await fetcher("/api/player/notifications", { signal, cache: "no-store" })
    if ([401, 403].includes(response.status)) throw new PlayerShellAccessError()
    if (!response.ok) throw new Error("Notifications are temporarily unavailable.")
    const { messages } = await response.json()
    return { player, messages: messages || [], notificationsError: null }
  } catch (error) {
    if (error instanceof PlayerShellAccessError || signal?.aborted) throw error
    return {
      player,
      messages: [],
      notificationsError: "Notifications are temporarily unavailable. Try again shortly.",
    }
  }
}
export async function savePlayerAvailability(available: boolean, fetcher: typeof fetch = fetch) {
  const response = await fetcher("/api/player/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ available }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || "Could not update your availability.")
}

/** Panel-to-panel navigation must restore focus to the original outside opener. */
export function panelFocusTarget<T>(
  panelAlreadyOpen: boolean,
  original: T | null,
  trigger: T | null,
): T | null {
  return panelAlreadyOpen ? original : trigger
}
