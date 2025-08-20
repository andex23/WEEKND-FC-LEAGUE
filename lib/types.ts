export interface Player {
  id: string
  name: string
  location: string
  console: "PS5" | "XBOX" | "PC"
  preferredClub: string
  assignedTeam?: string
  role: "PLAYER" | "ADMIN"
  createdAt: Date
}

export interface Fixture {
  id: string
  matchday: number
  homePlayer: string
  awayPlayer: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  status: "SCHEDULED" | "PLAYED" | "CANCELLED"
  scheduledDate?: Date
  playedDate?: Date
}

export interface Standing {
  playerId: string
  playerName: string
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  last5: ("W" | "D" | "L")[]
}

export interface League {
  id: string
  name: string
  status: "DRAFT" | "ACTIVE" | "COMPLETE"
  startDate?: Date
  endDate?: Date
  rounds: number
  matchdaysPerWeekend: number
  teamsLocked: boolean
}
