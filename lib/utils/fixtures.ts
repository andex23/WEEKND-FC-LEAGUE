import type { Fixture } from "@/lib/types"

export function generateRoundRobinFixtures(players: any[], rounds = 2, _matchdaysPerWeekend = 2): Fixture[] {
  if (players.length < 2) return []

  // Round-robin needs an even count; pad with a BYE that is skipped on output.
  const teams = [...players]
  if (teams.length % 2 === 1) teams.push({ id: "bye", name: "BYE" })
  const n = teams.length
  const matchdaysPerRound = n - 1
  const half = n / 2

  // Build a single round-robin (n-1 matchdays) with the circle method.
  const single: { home: any; away: any; matchday: number }[] = []
  const rot = [...teams]
  for (let md = 0; md < matchdaysPerRound; md++) {
    for (let i = 0; i < half; i++) {
      const a = rot[i]
      const b = rot[n - 1 - i]
      // Alternate sides by matchday so home/away is balanced within a round.
      const [home, away] = md % 2 === 0 ? [a, b] : [b, a]
      single.push({ home, away, matchday: md + 1 })
    }
    // Rotate every slot except the first.
    rot.splice(1, 0, rot.pop())
  }

  // Repeat for each requested round; odd rounds mirror home/away, guaranteeing
  // every pair plays once at home and once away across a double round-robin.
  const fixtures: Fixture[] = []
  let id = 1
  for (let round = 0; round < rounds; round++) {
    const mirror = round % 2 === 1
    for (const m of single) {
      const home = mirror ? m.away : m.home
      const away = mirror ? m.home : m.away
      if (home.id === "bye" || away.id === "bye" || String(home.id) === String(away.id)) {
        continue
      }
      fixtures.push({
        id: String(id++),
        matchday: m.matchday + round * matchdaysPerRound,
        homePlayer: home.id,
        awayPlayer: away.id,
        homeTeam: home.assignedTeam || home.preferredClub,
        awayTeam: away.assignedTeam || away.preferredClub,
        status: "SCHEDULED",
        scheduledDate: new Date(
          Date.now() + (m.matchday - 1 + round * matchdaysPerRound) * 7 * 24 * 60 * 60 * 1000,
        ),
      })
    }
  }

  return fixtures
}

export function assignTeamsAutomatically(players: any[], teamsLocked = false): any[] {
  const availableTeams = [
    "Arsenal",
    "Aston Villa",
    "Bournemouth",
    "Brentford",
    "Brighton",
    "Chelsea",
    "Crystal Palace",
    "Everton",
    "Fulham",
    "Ipswich Town",
    "Leicester City",
    "Liverpool",
    "Man City",
    "Man United",
    "Newcastle",
    "Nottingham Forest",
    "Southampton",
    "Spurs",
    "West Ham",
    "Wolves",
  ]

  const assignedTeams = new Set<string>()
  const updatedPlayers = [...players]

  updatedPlayers.forEach((player) => {
    if (!player.assignedTeam) {
      if (teamsLocked) {
        // Try to assign preferred club if available
        if (!assignedTeams.has(player.preferredClub)) {
          player.assignedTeam = player.preferredClub
          assignedTeams.add(player.preferredClub)
        } else {
          // Find first available team
          const availableTeam = availableTeams.find((team) => !assignedTeams.has(team))
          if (availableTeam) {
            player.assignedTeam = availableTeam
            assignedTeams.add(availableTeam)
          }
        }
      } else {
        // Allow duplicates, assign preferred club
        player.assignedTeam = player.preferredClub
      }
    }
  })

  return updatedPlayers
}
