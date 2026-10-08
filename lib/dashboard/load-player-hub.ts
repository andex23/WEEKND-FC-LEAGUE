import type { HubPlayer, HubTournament, HubEntry, HubFixture, HubMessage } from "./player-hub"
import type { Standing } from "../types"

export type PlayerHubData = {
  player: HubPlayer
  activeTournament: HubTournament | null
  entries: HubEntry[]
  fixtures: HubFixture[]
  standings: Standing[]
  messages: HubMessage[]
  messagesError: string | null
}

export class PlayerHubAccessError extends Error {
  accessDenied = true
  constructor() {
    super("Please sign in again to check your account approval and access.")
  }
}

/** Reads existing endpoints only. Profile access is verified before any league data. */
export async function loadPlayerHub(
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<PlayerHubData> {
  const get = async (url: string, errorMessage: string) => {
    const response = await fetcher(url, { signal, cache: "no-store" })
    if (response.status === 401 || response.status === 403) throw new PlayerHubAccessError()
    if (!response.ok) throw new Error(errorMessage)
    return response.json()
  }
  const { player } = await get(
    "/api/player/profile",
    "We couldn’t load your player profile. Please try again.",
  )
  if (!player?.id || player.status !== "approved") throw new PlayerHubAccessError()

  const [{ activeTournament }, { entries }, notifications] = await Promise.all([
    get("/api/tournaments", "We couldn’t load the season. Please try again."),
    get("/api/player/tournament-entries", "We couldn’t load your invitations. Please try again."),
    get("/api/player/notifications", "Updates are temporarily unavailable.")
      .then((data) => ({ messages: data.messages || [], error: null }))
      .catch((error) => {
        if (error instanceof PlayerHubAccessError || signal?.aborted) throw error
        return {
          messages: [],
          error: "Updates are temporarily unavailable. Please try again shortly.",
        }
      }),
  ])
  const [{ fixtures }, { standings }] = activeTournament
    ? await Promise.all([
        get("/api/player/fixtures", "We couldn’t load your fixtures. Please try again."),
        get(
          `/api/standings?tournamentId=${encodeURIComponent(activeTournament.id)}`,
          "We couldn’t load the standings. Please try again.",
        ),
      ])
    : [{ fixtures: [] }, { standings: [] }]

  return {
    player,
    activeTournament,
    entries: entries || [],
    fixtures: fixtures || [],
    standings: standings || [],
    messages: notifications.messages,
    messagesError: notifications.error,
  }
}

/** Reconcile account and invitation state after authoritative mutation responses. */
export async function respondToInvitation(
  tournamentId: string,
  action: "accept" | "decline",
  selectedClub: string | undefined,
  refresh: () => Promise<void>,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher("/api/player/tournament-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, tournamentId, selectedClub }),
  })
  const result = await response.json().catch(() => ({}))
  if (response.ok || [401, 403, 409].includes(response.status)) await refresh()
  if (!response.ok) throw new Error(result.error || "Could not update tournament invitation")
}
