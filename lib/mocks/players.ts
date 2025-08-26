export type MockPlayer = {
  id: string
  name: string
  gamer_tag?: string
  console: "PS5" | "XBOX" | "PC"
  preferred_club?: string
  location?: string
  active: boolean
  created_at: string
}

let memPlayers: MockPlayer[] = []
const memTournamentPlayers: Record<string, string[]> = {}

export function listPlayers(): MockPlayer[] { return memPlayers }
export function setPlayers(rows: MockPlayer[]) { memPlayers = rows }
export function addPlayer(p: MockPlayer) { memPlayers = [p, ...memPlayers] }
export function updatePlayer(id: string, patch: Partial<MockPlayer>) {
  memPlayers = memPlayers.map((p) => (String(p.id) === String(id) ? { ...p, ...patch } : p))
}
export function deletePlayer(id: string) { memPlayers = memPlayers.filter((p) => String(p.id) !== String(id)) }
export function activePlayers(): MockPlayer[] { return memPlayers.filter((p) => p.active) }

export function snapshotTournamentPlayers(tournamentId: string) {
  const list = activePlayers().map((p) => p.id)
  memTournamentPlayers[tournamentId] = Array.from(new Set(list))
  return memTournamentPlayers[tournamentId]
}
export function getTournamentPlayers(tournamentId: string): string[] { return memTournamentPlayers[tournamentId] || [] }
export function syncTournamentPlayers(tournamentId: string) {
  const current = new Set(getTournamentPlayers(tournamentId))
  for (const p of activePlayers()) { current.add(p.id) }
  memTournamentPlayers[tournamentId] = Array.from(current)
  return memTournamentPlayers[tournamentId]
}
export function setTournamentPlayers(tournamentId: string, ids: string[]) { memTournamentPlayers[tournamentId] = ids }
