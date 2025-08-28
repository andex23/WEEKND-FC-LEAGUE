import type { Fixture, Standing } from "@/lib/types"

export function calculateStandings(fixtures: Fixture[], players: any[]): Standing[] {
  const standings: Record<string, Standing> = {}

  // Initialize standings for all players
  players.forEach((player) => {
    standings[player.id] = {
      playerId: player.id,
      playerName: player.name,
      team: player.assignedTeam || player.preferredClub,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      last5: [],
    }
  })

  // Process played fixtures
  fixtures
    .filter((fixture) => fixture.status === "PLAYED" && fixture.homeScore !== null && fixture.awayScore !== null)
    .forEach((fixture) => {
      const homeStanding = standings[fixture.homePlayer]
      const awayStanding = standings[fixture.awayPlayer]

      if (!homeStanding || !awayStanding) return

      // Update games played
      homeStanding.played++
      awayStanding.played++

      // Update goals
      homeStanding.goalsFor += fixture.homeScore!
      homeStanding.goalsAgainst += fixture.awayScore!
      awayStanding.goalsFor += fixture.awayScore!
      awayStanding.goalsAgainst += fixture.homeScore!

      // Determine result
      let homeResult: "W" | "D" | "L"
      let awayResult: "W" | "D" | "L"

      if (fixture.homeScore! > fixture.awayScore!) {
        // Home win
        homeStanding.won++
        awayStanding.lost++
        homeStanding.points += 3
        homeResult = "W"
        awayResult = "L"
      } else if (fixture.homeScore! < fixture.awayScore!) {
        // Away win
        awayStanding.won++
        homeStanding.lost++
        awayStanding.points += 3
        homeResult = "L"
        awayResult = "W"
      } else {
        // Draw
        homeStanding.drawn++
        awayStanding.drawn++
        homeStanding.points += 1
        awayStanding.points += 1
        homeResult = "D"
        awayResult = "D"
      }

      // Update last 5 results (keep only last 5)
      homeStanding.last5.unshift(homeResult)
      if (homeStanding.last5.length > 5) homeStanding.last5.pop()

      awayStanding.last5.unshift(awayResult)
      if (awayStanding.last5.length > 5) awayStanding.last5.pop()
    })

  // Calculate goal differences
  Object.values(standings).forEach((standing) => {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst
  })

  // Sort by tiebreaker rules: Points > Goal Difference > Goals For > Name (A→Z)
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return (a.playerName || "").localeCompare(b.playerName || "")
  })
}
