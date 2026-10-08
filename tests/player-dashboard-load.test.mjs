import assert from "node:assert/strict"
import test from "node:test"
import { loadPlayerHub, respondToInvitation } from "../lib/dashboard/load-player-hub.ts"

const calls = []
const fetcher =
  (changes = {}) =>
  async (url) => {
    calls.push(url)
    const fixtures = {
      "/api/player/profile": { player: { id: "me", status: "approved" } },
      "/api/tournaments": { activeTournament: null },
      "/api/player/tournament-entries": { entries: [] },
      "/api/player/notifications": { messages: [] },
      ...changes,
    }
    const data = fixtures[url]
    assert.notEqual(data, undefined, `unexpected endpoint ${url}`)
    return data instanceof Response ? data : Response.json(data)
  }
const load = loadPlayerHub

test("profile gate is checked before any other endpoint and pending access fails closed", async () => {
  calls.length = 0
  await assert.rejects(
    () => load(fetcher({ "/api/player/profile": { player: { id: "me", status: "pending" } } })),
    /approval|approved|account/i,
  )
  assert.deepEqual(calls, ["/api/player/profile"])
})

test("no active season makes no match or statistics queries", async () => {
  calls.length = 0
  const result = await load(fetcher())
  assert.deepEqual(result.fixtures, [])
  assert.deepEqual(result.entries, [])
  assert.equal(result.messagesError, null)
  assert.equal(calls.includes("/api/player/fixtures"), false)
  assert.equal(
    calls.some((url) => url.includes("player-stats")),
    false,
  )
})

test("notification outage stays visibly unavailable while invitation failure cannot become a false empty state", async () => {
  const result = await load(
    fetcher({ "/api/player/notifications": new Response("", { status: 503 }) }),
  )
  assert.match(result.messagesError, /unavailable/i)
  await assert.rejects(
    () => load(fetcher({ "/api/player/tournament-entries": new Response("", { status: 503 }) })),
    /invitation/i,
  )
})

test("revoked access from any private read cannot leave a stale approved hub", async () => {
  for (const url of [
    "/api/player/profile",
    "/api/player/tournament-entries",
    "/api/player/notifications",
  ]) {
    await assert.rejects(
      () => load(fetcher({ [url]: new Response("", { status: 403 }) })),
      (error) => error.accessDenied === true,
    )
  }
})

test("active season reads scoped standings and the signed-in player fixture endpoint", async () => {
  calls.length = 0
  const result = await load(
    fetcher({
      "/api/tournaments": {
        activeTournament: { id: "season one", name: "Season", status: "ACTIVE" },
      },
      "/api/player/fixtures": { fixtures: [{ id: "real-fixture" }] },
      "/api/standings?tournamentId=season%20one": { standings: [{ playerId: "me", played: 1 }] },
    }),
  )
  assert.equal(result.fixtures[0].id, "real-fixture")
  assert.ok(calls.includes("/api/standings?tournamentId=season%20one"))
})

test("invitation responses refresh shared account and entry state on success, revoked access and stale schedule", async () => {
  for (const status of [200, 401, 403, 409]) {
    let refreshed = 0
    const request = async (url, options) => {
      assert.equal(url, "/api/player/tournament-entries")
      assert.deepEqual(JSON.parse(options.body), {
        action: "accept",
        tournamentId: "season",
        selectedClub: "Arsenal",
      })
      return Response.json(status === 200 ? { success: true } : { error: "Response rejected" }, {
        status,
      })
    }
    const response = respondToInvitation(
      "season",
      "accept",
      "Arsenal",
      async () => {
        refreshed++
      },
      request,
    )
    if (status === 200) await response
    else await assert.rejects(() => response, /Response rejected/)
    assert.equal(refreshed, 1)
  }
})
