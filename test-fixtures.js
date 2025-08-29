// Simple test for fixture generation
const players = [
  { id: "1", name: "Player 1", preferred_club: "Team 1" },
  { id: "2", name: "Player 2", preferred_club: "Team 2" },
  { id: "3", name: "Player 3", preferred_club: "Team 3" },
  { id: "4", name: "Player 4", preferred_club: "Team 4" },
  { id: "5", name: "Player 5", preferred_club: "Team 5" },
  { id: "6", name: "Player 6", preferred_club: "Team 6" },
  { id: "7", name: "Player 7", preferred_club: "Team 7" },
  { id: "8", name: "Player 8", preferred_club: "Team 8" },
  { id: "9", name: "Player 9", preferred_club: "Team 9" },
  { id: "10", name: "Player 10", preferred_club: "Team 10" },
];

function generateRoundRobinFixtures(players, rounds = 2) {
  if (players.length < 2) return []

  const fixtures = []
  let fixtureId = 1

  const teams = [...players]
  if (teams.length % 2 === 1) {
    teams.push({ id: "bye", name: "BYE" })
  }

  const numTeams = teams.length
  const numRounds = numTeams - 1
  const matchesPerRound = numTeams / 2

  console.log(`${players.length} players, ${numTeams} teams, ${numRounds} rounds, ${matchesPerRound} matches per round, ${rounds} total rounds`)
  console.log(`Expected fixtures: ${numRounds} × ${matchesPerRound} × ${rounds} = ${numRounds * matchesPerRound * rounds}`)

  for (let round = 0; round < rounds; round++) {
    const roundTeams = [...teams]
    
    if (round === 1) {
      roundTeams.reverse()
    }

    for (let matchday = 0; matchday < numRounds; matchday++) {
      if (matchday > 0) {
        const first = roundTeams[0]
        const rest = roundTeams.slice(1)
        const last = rest.pop()
        roundTeams[0] = first
        roundTeams[1] = last
        roundTeams.splice(2, 0, ...rest)
      }

      for (let i = 0; i < matchesPerRound; i++) {
        let homeIndex, awayIndex

        if (i === 0) {
          homeIndex = 0
          awayIndex = matchday + 1
        } else {
          homeIndex = ((numRounds - matchday + i - 1) % numRounds) + 1
          awayIndex = ((matchday - i + numRounds) % numRounds) + 1
        }

        const homePlayer = roundTeams[homeIndex]
        const awayPlayer = roundTeams[awayIndex]

        if (homePlayer.id === "bye" || awayPlayer.id === "bye") {
          console.log(`Skipping BYE match on matchday ${matchday} round ${round}: home=${homePlayer.id}, away=${awayPlayer.id}`)
          continue
        }

        fixtures.push({
          id: fixtureId.toString(),
          matchday: matchday + 1 + round * numRounds,
          homePlayer: homePlayer.id,
          awayPlayer: awayPlayer.id,
        })

        fixtureId++
      }
    }
  }

  console.log(`Generated ${fixtures.length} fixtures`)
  return fixtures
}

const result = generateRoundRobinFixtures(players, 2)
console.log(`Final result: ${result.length} fixtures`)
