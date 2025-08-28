import type { Fixture } from "@/lib/types"

export function generateRoundRobinFixtures(players: any[], rounds = 2, matchdaysPerWeekend = 2): Fixture[] {
  if (players.length < 2) return []

  const fixtures: Fixture[] = []
  let fixtureId = 1

  // Circle method for round-robin scheduling
  const teams = [...players]
  if (teams.length % 2 === 1) {
    // Add a "bye" team for odd number of players
    teams.push({ id: "bye", name: "BYE" })
  }

  const numTeams = teams.length
  const numRounds = numTeams - 1
  const matchesPerRound = numTeams / 2

  const pairKey = (a: string, b: string) => [a, b].sort().join("-")

  // Track duplicate pairings per leg (so two legs are allowed for DOUBLE)
  const seenPairsPerLeg: Array<Set<string>> = Array.from({ length: Math.max(1, rounds) }, () => new Set<string>())

  for (let round = 0; round < rounds; round++) {
    for (let matchday = 0; matchday < numRounds; matchday++) {
      const roundFixtures: Fixture[] = []

      for (let match = 0; match < matchesPerRound; match++) {
        let home: number, away: number

        if (match === 0) {
          // First match: team 0 vs team at position matchday + 1
          home = 0
          away = matchday + 1
        } else {
          // Other matches: calculate positions using circle method
          home = ((numRounds - matchday + match - 1) % numRounds) + 1
          away = ((matchday - match + numRounds) % numRounds) + 1
        }

        const homePlayer = teams[home]
        const awayPlayer = teams[away]

        // Skip if either player is "bye" or same player
        if (homePlayer.id === "bye" || awayPlayer.id === "bye" || String(homePlayer.id) === String(awayPlayer.id)) continue

        // For second leg, swap home/away
        const isSecondRound = round === 1
        const finalHome = isSecondRound ? awayPlayer : homePlayer
        const finalAway = isSecondRound ? homePlayer : awayPlayer

        // Avoid duplicate pairings WITHIN the same leg only
        const key = pairKey(String(finalHome.id), String(finalAway.id))
        const seenForLeg = seenPairsPerLeg[round] || seenPairsPerLeg[0]
        if (seenForLeg.has(key)) continue
        seenForLeg.add(key)

        roundFixtures.push({
          id: fixtureId.toString(),
          matchday: matchday + 1 + round * numRounds,
          homePlayer: finalHome.id,
          awayPlayer: finalAway.id,
          homeTeam: finalHome.assignedTeam || finalHome.preferredClub,
          awayTeam: finalAway.assignedTeam || finalAway.preferredClub,
          status: "SCHEDULED",
          scheduledDate: new Date(Date.now() + (matchday + round * numRounds) * 7 * 24 * 60 * 60 * 1000), // Weekly intervals
        })

        fixtureId++
      }

      fixtures.push(...roundFixtures)
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
