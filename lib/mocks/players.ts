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

// Ensure single in-memory stores across hot reloads and route modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any
if (!g.__memPlayers) g.__memPlayers = [] as MockPlayer[]
if (!g.__memTournamentPlayers) g.__memTournamentPlayers = {} as Record<string, string[]>

let memPlayers: MockPlayer[] = g.__memPlayers
const memTournamentPlayers: Record<string, string[]> = g.__memTournamentPlayers

export function listPlayers(): MockPlayer[] { return memPlayers }
export function setPlayers(rows: MockPlayer[]) { memPlayers = rows; g.__memPlayers = memPlayers }
export function addPlayer(p: MockPlayer) { memPlayers = [p, ...memPlayers]; g.__memPlayers = memPlayers }
export function updatePlayer(id: string, patch: Partial<MockPlayer>) {
  memPlayers = memPlayers.map((p) => (String(p.id) === String(id) ? { ...p, ...patch } : p))
  g.__memPlayers = memPlayers
}
export function deletePlayer(id: string) { memPlayers = memPlayers.filter((p) => String(p.id) !== String(id)); g.__memPlayers = memPlayers }
export function clearPlayers() { memPlayers = []; g.__memPlayers = memPlayers }
export function activePlayers(): MockPlayer[] { return memPlayers.filter((p) => p.active) }

export function snapshotTournamentPlayers(tournamentId: string) {
  const list = activePlayers().map((p) => p.id)
  memTournamentPlayers[tournamentId] = Array.from(new Set(list))
  g.__memTournamentPlayers = memTournamentPlayers
  return memTournamentPlayers[tournamentId]
}
export function snapshotTournamentPlayersFromIds(tournamentId: string, ids: string[]) {
  const set = new Set(ids.map(String))
  memTournamentPlayers[tournamentId] = Array.from(set)
  g.__memTournamentPlayers = memTournamentPlayers
  return memTournamentPlayers[tournamentId]
}
export function getTournamentPlayers(tournamentId: string): string[] { return memTournamentPlayers[tournamentId] || [] }
export function syncTournamentPlayers(tournamentId: string) {
  const current = new Set(getTournamentPlayers(tournamentId))
  for (const p of activePlayers()) { current.add(p.id) }
  memTournamentPlayers[tournamentId] = Array.from(current)
  g.__memTournamentPlayers = memTournamentPlayers
  return memTournamentPlayers[tournamentId]
}
export function setTournamentPlayers(tournamentId: string, ids: string[]) { memTournamentPlayers[tournamentId] = ids; g.__memTournamentPlayers = memTournamentPlayers }
