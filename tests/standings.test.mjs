import assert from "node:assert/strict"
import test from "node:test"
import { calculateStandings } from "../lib/utils/standings.ts"

const players = [{ id: "a", name: "A" }, { id: "b", name: "B" }]
const fixture = (values = {}) => ({ id: "f", matchday: 1, homePlayer: "a", awayPlayer: "b", status: "PLAYED", homeScore: 2, awayScore: 1, ...values })

test("a recorded forfeit awards points, goals and form", () => {
  const [winner, loser] = calculateStandings([fixture({ status: "FORFEIT", homeScore: 3, awayScore: 0 })], players)
  assert.equal(winner.points, 3)
  assert.equal(winner.played, 1)
  assert.equal(winner.goalDifference, 3)
  assert.deepEqual(winner.last5, ["W"])
  assert.equal(loser.lost, 1)
  assert.equal(loser.goalsAgainst, 3)
})

test("incomplete, invalid, cancelled and scheduled scores do not affect standings", () => {
  const fixtures = [fixture({ homeScore: undefined }), fixture({ awayScore: null }), fixture({ homeScore: -1 }), fixture({ homeScore: 1.5 }), fixture({ status: "CANCELLED" }), fixture({ status: "SCHEDULED" })]
  for (const row of calculateStandings(fixtures, players)) {
    assert.equal(row.played, 0)
    assert.equal(row.points, 0)
    assert.equal(row.goalsFor, 0)
  }
})

test("form is newest first even when fixtures arrive out of order", () => {
  const fixtures = [fixture({ matchday: 2, homeScore: 0, awayScore: 1 }), fixture({ matchday: 1 })]
  assert.deepEqual(calculateStandings(fixtures, players).find((p) => p.playerId === "a").last5, ["L", "W"])
})
