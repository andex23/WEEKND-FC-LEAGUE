import assert from "node:assert/strict"
import test from "node:test"

import { buildPlayerHub } from "../lib/dashboard/player-hub.ts"

const hub = (overrides = {}) => {
  return buildPlayerHub({
    player: {
      id: "me",
      name: "Player",
      status: "approved",
      psn_id: "my-tag",
      console: "PS5",
      preferredClub: "Arsenal",
    },
    entries: [],
    activeTournament: null,
    fixtures: [],
    standings: [],
    ...overrides,
  })
}
const tournament = (overrides = {}) => ({
  id: "season",
  name: "Weekend League",
  status: "DRAFT",
  start_at: null,
  end_at: null,
  ...overrides,
})
const entry = (overrides = {}) => ({
  id: "entry",
  tournament_id: "season",
  status: "invited",
  selected_club: null,
  tournament: tournament(),
  ...overrides,
})
const fixture = (overrides = {}) => ({
  id: "fixture",
  matchday: 1,
  homePlayer: "Player",
  awayPlayer: "Opponent",
  homeScore: null,
  awayScore: null,
  status: "SCHEDULED",
  scheduledDate: null,
  isHome: true,
  ...overrides,
})

test("an approved player with no invitation sees a clear next step without match or ranking placeholders", () => {
  const state = hub()
  assert.equal(state.status.kind, "waiting")
  assert.equal(state.status.label, "Approved")
  assert.match(state.status.title, /Waiting for a tournament invitation/)
  assert.equal(state.next, null)
  assert.equal(state.recent, null)
  assert.equal(state.showStandings, false)
  assert.equal(state.canReport, false)
  assert.equal(state.startDate, "Date TBC")
})

test("pending, rejected and unknown approval states cannot masquerade as approved", () => {
  for (const status of ["pending", "rejected", undefined, "APPROVED"]) {
    const state = hub({ player: { id: "me", status } })
    assert.notEqual(state.status.label, "Approved")
    assert.equal(state.canReport, false)
    assert.equal(state.showStandings, false)
  }
})

test("an invitation points to club selection; acceptance uses that tournament’s actual club", () => {
  const invited = hub({ entries: [entry()] })
  assert.equal(invited.status.kind, "invited")
  assert.equal(invited.status.href, "#tournament-invites")
  assert.equal(invited.profile.club, "Arsenal")
  assert.equal(invited.profile.clubLabel, "Preferred club")
  const accepted = hub({ entries: [entry({ status: "accepted", selected_club: "Liverpool" })] })
  assert.equal(accepted.status.kind, "accepted")
  assert.equal(accepted.profile.club, "Liverpool")
  assert.equal(accepted.profile.clubLabel, "Tournament club")
})

test("completed and declined entries never leave an active invitation CTA", () => {
  const completed = hub({
    entries: [
      entry({
        status: "accepted",
        selected_club: "Liverpool",
        tournament: tournament({ status: "COMPLETE" }),
      }),
    ],
  })
  assert.equal(completed.status.kind, "completed")
  assert.equal(completed.canReport, false)
  const declined = hub({ entries: [entry({ status: "declined" })] })
  assert.equal(declined.status.kind, "declined")
  assert.notEqual(declined.status.href, "#tournament-invites")
  const expiredInvite = hub({
    entries: [entry({ tournament: tournament({ status: "COMPLETE" }) })],
  })
  assert.notEqual(expiredInvite.status.kind, "invited")
})

test("profile checklist reads the profile API fields and never invents a selected club", () => {
  const state = hub({
    player: {
      id: "me",
      status: "approved",
      psn_id: "  ",
      console: "",
      preferredClub: "",
      avatar_url: null,
    },
  })
  assert.equal(state.profile.gamertag, null)
  assert.equal(state.profile.club, null)
  assert.equal(state.profile.completed, 0)
  assert.equal(state.profile.checklist.length, 4)
  assert.match(state.profile.checklist.find((row) => row.key === "club").hint, /invitation/)
})

test("only real scheduled fixtures enable reporting; review and cancelled fixtures do not", () => {
  const active = tournament({ status: "ACTIVE" })
  const state = hub({
    activeTournament: active,
    fixtures: [
      fixture({ status: "CANCELLED" }),
      fixture({ id: "review", status: "PENDING", matchday: 1 }),
      fixture({ id: "later", matchday: 3 }),
      fixture({ id: "next", matchday: 2 }),
    ],
  })
  assert.equal(state.next.id, "next")
  assert.equal(state.status.kind, "scheduled")
  assert.equal(state.canReport, true)
  assert.equal(
    state.fixtures.some((row) => row.status === "CANCELLED"),
    false,
  )
  const review = hub({ activeTournament: active, fixtures: [fixture({ status: "PENDING" })] })
  assert.equal(review.status.kind, "review")
  assert.equal(review.canReport, false)
  const cancelled = hub({ activeTournament: active, fixtures: [fixture({ status: "CANCELLED" })] })
  assert.equal(cancelled.next, null)
  assert.equal(cancelled.canReport, false)
})

test("recent results require valid approved scores and form is newest first", () => {
  const fixtures = [
    fixture({ id: "old", status: "PLAYED", homeScore: 1, awayScore: 0, matchday: 1 }),
    fixture({ id: "new", status: "FORFEIT", homeScore: 0, awayScore: 3, matchday: 3 }),
    fixture({ id: "invalid", status: "PLAYED", homeScore: null, awayScore: 0, matchday: 4 }),
    fixture({ id: "pending", status: "PENDING", homeScore: 7, awayScore: 0, matchday: 5 }),
  ]
  const state = hub({ activeTournament: tournament({ status: "ACTIVE" }), fixtures })
  assert.equal(state.recent.id, "new")
  assert.deepEqual(state.form, ["L", "W"])
})

test("an empty or unplayed table does not manufacture a rank, and unrelated membership is not applied", () => {
  const active = tournament({ status: "ACTIVE" })
  const zero = { playerId: "me", played: 0, points: 0 }
  assert.equal(hub({ activeTournament: active, standings: [zero] }).showStandings, false)
  const actual = hub({ activeTournament: active, standings: [{ ...zero, played: 1, points: 3 }] })
  assert.equal(actual.showStandings, true)
  assert.equal(actual.position, 1)
  const outsider = hub({
    activeTournament: active,
    standings: [{ playerId: "other", played: 1, points: 3 }],
  })
  assert.equal(outsider.position, null)
})

test("season overview uses real dates and safely treats missing or invalid dates as TBC", () => {
  assert.equal(
    hub({ entries: [entry({ tournament: tournament({ start_at: "invalid" }) })] }).startDate,
    "Date TBC",
  )
  const state = hub({
    entries: [entry({ tournament: tournament({ start_at: "2026-10-16T19:00:00Z" }) })],
  })
  assert.match(state.startDate, /16 Oct 2026/)
  assert.equal(state.tournament.id, "season")
})

test("a player with completed active fixtures is caught up rather than waiting for the first schedule", () => {
  const active = tournament({ status: "ACTIVE" })
  const state = hub({
    activeTournament: active,
    entries: [entry({ status: "accepted", selected_club: "Liverpool", tournament: active })],
    fixtures: [fixture({ status: "PLAYED", homeScore: 1, awayScore: 0 })],
  })
  assert.equal(state.status.kind, "caught-up")
  assert.ok(!state.status.detail.includes("publishes your schedule"))
})

test("the status, season overview and selected club all refer to the same actionable entry", () => {
  const active = tournament({ id: "old", status: "ACTIVE" })
  const accepted = entry({ status: "accepted", selected_club: "Liverpool" })
  const declined = entry({
    id: "old-entry",
    tournament_id: "old",
    status: "declined",
    tournament: active,
  })
  const state = hub({ activeTournament: active, entries: [declined, accepted] })
  assert.equal(state.status.kind, "accepted")
  assert.equal(state.tournament.id, accepted.tournament_id)
  assert.equal(state.profile.club, "Liverpool")
  const invitation = entry({
    id: "new-entry",
    tournament_id: "new",
    tournament: tournament({ id: "new" }),
  })
  const invited = hub({
    activeTournament: active,
    entries: [{ ...declined, status: "accepted", selected_club: "Arsenal" }, invitation],
  })
  assert.equal(invited.status.kind, "invited")
  assert.equal(invited.tournament.id, invitation.tournament_id)
})

test("real active fixtures cannot be mislabeled with an archived tournament entry", () => {
  const active = tournament({ id: "current", status: "ACTIVE" })
  const old = entry({
    status: "accepted",
    selected_club: "Liverpool",
    tournament: tournament({ status: "COMPLETE" }),
  })
  const state = hub({ activeTournament: active, entries: [old], fixtures: [fixture()] })
  assert.equal(state.tournament.id, "current")
  assert.equal(state.profile.clubLabel, "Preferred club")
})

test("standings from another active tournament cannot appear under a draft season overview", () => {
  const active = tournament({ id: "old", status: "ACTIVE" })
  const state = hub({
    activeTournament: active,
    entries: [
      entry({ id: "old-entry", tournament_id: "old", status: "declined", tournament: active }),
      entry({ status: "accepted", selected_club: "Liverpool" }),
    ],
    standings: [{ playerId: "other", played: 1, points: 3 }],
  })
  assert.equal(state.tournament.id, "season")
  assert.equal(state.showStandings, false)
})
