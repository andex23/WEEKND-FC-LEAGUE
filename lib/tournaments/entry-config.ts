export type TournamentEntryStatus = "invited" | "accepted" | "declined"

export type StoredTournamentEntry = {
  id: string
  tournament_id: string
  player_id: string
  status: TournamentEntryStatus
  selected_club: string | null
  invited_at: string
  responded_at: string | null
  created_at: string
  updated_at: string
}

export type TournamentEntrySummary = {
  invited: number
  accepted: number
  declined: number
  total: number
}

export function normalizeEntryStatus(status: unknown): TournamentEntryStatus {
  const normalized = String(status || "invited").toLowerCase()
  if (normalized === "accepted" || normalized === "declined") return normalized
  return "invited"
}

export function readTournamentEntries(config: unknown): StoredTournamentEntry[] {
  const entries = (config as { entries?: unknown })?.entries
  if (!Array.isArray(entries)) return []

  return entries
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"))
    .filter((entry) => Boolean(entry.tournament_id && entry.player_id))
    .map((entry) => ({
      id: String(entry.id || `${entry.tournament_id}:${entry.player_id}`),
      tournament_id: String(entry.tournament_id),
      player_id: String(entry.player_id),
      status: normalizeEntryStatus(entry.status),
      selected_club: entry.selected_club ? String(entry.selected_club) : null,
      invited_at: String(entry.invited_at || entry.created_at || new Date().toISOString()),
      responded_at: entry.responded_at ? String(entry.responded_at) : null,
      created_at: String(entry.created_at || entry.invited_at || new Date().toISOString()),
      updated_at: String(entry.updated_at || entry.created_at || new Date().toISOString()),
    }))
}

export function withTournamentEntries(config: unknown, entries: StoredTournamentEntry[]): Record<string, unknown> {
  return {
    ...((config && typeof config === "object" ? config : {}) as Record<string, unknown>),
    entries,
  }
}

export function summarizeTournamentEntries(entries: StoredTournamentEntry[]): TournamentEntrySummary {
  return entries.reduce<TournamentEntrySummary>(
    (summary, entry) => {
      summary.total += 1
      summary[entry.status] += 1
      return summary
    },
    { invited: 0, accepted: 0, declined: 0, total: 0 },
  )
}

export function invitePlayersToTournament(
  entries: StoredTournamentEntry[],
  tournamentId: string,
  playerIds: string[],
): StoredTournamentEntry[] {
  const now = new Date().toISOString()
  const byPlayer = new Map(entries.map((entry) => [entry.player_id, entry]))

  for (const playerId of Array.from(new Set(playerIds.map(String)))) {
    if (!playerId) continue
    if (byPlayer.has(playerId)) continue
    byPlayer.set(playerId, {
      id: crypto.randomUUID(),
      tournament_id: tournamentId,
      player_id: playerId,
      status: "invited",
      selected_club: null,
      invited_at: now,
      responded_at: null,
      created_at: now,
      updated_at: now,
    })
  }

  return Array.from(byPlayer.values())
}

export function removeTournamentEntry(entries: StoredTournamentEntry[], entryId: string): StoredTournamentEntry[] {
  return entries.filter((entry) => entry.id !== entryId)
}

export function respondToTournamentEntry(
  entries: StoredTournamentEntry[],
  playerId: string,
  nextStatus: Extract<TournamentEntryStatus, "accepted" | "declined">,
  selectedClub?: string | null,
): { entries: StoredTournamentEntry[]; entry: StoredTournamentEntry | null; error?: string } {
  const now = new Date().toISOString()
  const club = String(selectedClub || "").trim()

  if (nextStatus === "accepted" && !club) {
    return { entries, entry: null, error: "Choose a club before accepting this tournament." }
  }

  let updated: StoredTournamentEntry | null = null
  const nextEntries = entries.map((entry) => {
    if (entry.player_id !== playerId) return entry
    updated = {
      ...entry,
      status: nextStatus,
      selected_club: nextStatus === "accepted" ? club : null,
      responded_at: now,
      updated_at: now,
    }
    return updated
  })

  if (!updated) {
    return { entries, entry: null, error: "Tournament invitation not found." }
  }

  return { entries: nextEntries, entry: updated }
}
