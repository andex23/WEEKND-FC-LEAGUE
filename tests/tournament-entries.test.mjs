import assert from "node:assert/strict"
import test from "node:test"

import { acceptedEntriesToFixtureRoster, normalizeEntryStatus } from "../lib/tournaments/entries.js"

test("normalizes unknown entry status to invited", () => {
  assert.equal(normalizeEntryStatus("accepted"), "accepted")
  assert.equal(normalizeEntryStatus("DECLINED"), "declined")
  assert.equal(normalizeEntryStatus("bad-value"), "invited")
})

test("accepted entries with selected clubs become fixture roster rows", () => {
  const roster = acceptedEntriesToFixtureRoster([
    {
      id: "entry-1",
      player_id: "player-1",
      status: "accepted",
      selected_club: "Arsenal",
      players: { name: "Dru" },
    },
    {
      id: "entry-2",
      player_id: "player-2",
      status: "accepted",
      selected_club: "Chelsea",
      player: { name: "Maya" },
    },
  ])

  assert.deepEqual(roster, [
    {
      id: "player-1",
      name: "Dru",
      assignedTeam: "Arsenal",
      preferredClub: "Arsenal",
      entryId: "entry-1",
    },
    {
      id: "player-2",
      name: "Maya",
      assignedTeam: "Chelsea",
      preferredClub: "Chelsea",
      entryId: "entry-2",
    },
  ])
})

test("invited and declined entries are excluded from fixture roster", () => {
  const roster = acceptedEntriesToFixtureRoster([
    { player_id: "player-1", status: "invited", selected_club: "Arsenal", players: { name: "Dru" } },
    { player_id: "player-2", status: "declined", selected_club: "Chelsea", players: { name: "Maya" } },
    { player_id: "player-3", status: "accepted", selected_club: "Liverpool", players: { name: "Sam" } },
  ])

  assert.equal(roster.length, 1)
  assert.equal(roster[0].id, "player-3")
  assert.equal(roster[0].assignedTeam, "Liverpool")
})

test("accepted entries without a selected club are excluded from fixture roster", () => {
  const roster = acceptedEntriesToFixtureRoster([
    { player_id: "player-1", status: "accepted", selected_club: "", players: { name: "Dru" } },
    { player_id: "player-2", status: "accepted", selected_club: "Chelsea", players: { name: "Maya" } },
  ])

  assert.deepEqual(
    roster.map((row) => row.id),
    ["player-2"],
  )
})
