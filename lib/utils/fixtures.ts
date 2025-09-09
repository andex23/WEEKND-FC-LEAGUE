import type { Fixture } from "@/lib/types"

export function generateRoundRobinFixtures(players: any[], rounds = 2, matchdaysPerWeekend = 2): Fixture[] {
  if (players.length < 2) return []

  const fixtures: Fixture[] = []
  let fixtureId = 1

  // For round robin, we need an even number of teams
  const teams = [...players]
  if (teams.length % 2 === 1) {
    // Add a "bye" team for odd number of players
    teams.push({ id: "bye", name: "BYE" })
  }

  const numTeams = teams.length
  const numRounds = numTeams - 1
  const matchesPerRound = numTeams / 2

  // Round-robin fixture generation for ${players.length} players, ${rounds} rounds

  // Generate fixtures for each round
  for (let round = 0; round < rounds; round++) {
    const roundTeams = [...teams];
    if (round === 1) {
      roundTeams.reverse();
    }

    for (let matchday = 0; matchday < numRounds; matchday++) {
      const pairings = [];
      const fixed = roundTeams[0];
      for (let i = 1; i < numTeams / 2; i++) {
        const homeIndex = i;
        const awayIndex = numTeams - i;
        pairings.push([roundTeams[homeIndex], roundTeams[awayIndex]]);
      }
      pairings.push([fixed, roundTeams[numTeams / 2]]);

      for (let [homePlayer, awayPlayer] of pairings) {
        if (homePlayer.id === "bye" || awayPlayer.id === "bye" || String(homePlayer.id) === String(awayPlayer.id)) {
          continue; // Skip invalid matches (bye or self-match)
        }

        fixtures.push({
          id: fixtureId.toString(),
          matchday: matchday + 1 + round * numRounds,
          homePlayer: homePlayer.id,
          awayPlayer: awayPlayer.id,
          homeTeam: homePlayer.assignedTeam || homePlayer.preferredClub,
          awayTeam: awayPlayer.assignedTeam || awayPlayer.preferredClub,
          status: "SCHEDULED",
          scheduledDate: new Date(Date.now() + (matchday + round * numRounds) * 7 * 24 * 60 * 60 * 1000),
        });
        fixtureId++;
      }

      // Rotate for next matchday
      const last = roundTeams.pop();
      roundTeams.splice(1, 0, last);
    }
  }

  return fixtures;
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
