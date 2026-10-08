import assert from "node:assert/strict"
import test from "node:test"
import * as module from "../lib/dashboard/player-shell.ts"
const read = async (...args) => {
  assert.equal(typeof module.loadPlayerShell, "function")
  return module.loadPlayerShell(...args)
}

test("player shell reads only approved self profile before real notifications", async () => {
  const calls = []
  const data = await read(async (url) => {
    calls.push(url)
    return Response.json(
      url.endsWith("profile")
        ? { player: { id: "me", status: "approved", available: true } }
        : { messages: [{ id: "real" }] },
    )
  })
  assert.deepEqual(calls, ["/api/player/profile", "/api/player/notifications"])
  assert.equal(data.messages[0].id, "real")
  const denied = []
  await assert.rejects(
    () =>
      read(async (url) => {
        denied.push(url)
        return Response.json({ player: { id: "me", status: "pending" } })
      }),
    /access|approved/i,
  )
  assert.deepEqual(denied, ["/api/player/profile"])
})
test("notifications outage is honest and revocation fails closed", async () => {
  const fetcher = (status) => async (url) =>
    url.endsWith("profile")
      ? Response.json({ player: { id: "me", status: "approved" } })
      : new Response("", { status })
  const data = await read(fetcher(503))
  assert.match(data.notificationsError, /unavailable/i)
  await assert.rejects(
    () => read(fetcher(403)),
    (error) => error.accessDenied === true,
  )
})
test("availability changes use the existing authenticated endpoint and fail visibly", async () => {
  assert.equal(typeof module.savePlayerAvailability, "function")
  for (const available of [true, false])
    await module.savePlayerAvailability(available, async (url, options) => {
      assert.equal(url, "/api/player/availability")
      assert.equal(options.method, "POST")
      assert.deepEqual(JSON.parse(options.body), { available })
      return Response.json({ success: true, available })
    })
  await assert.rejects(
    () =>
      module.savePlayerAvailability(true, async () =>
        Response.json({ error: "Access denied" }, { status: 403 }),
      ),
    /Access denied/,
  )
})

test("switching panels inside the mobile drawer preserves the external focus return target", () => {
  assert.equal(typeof module.panelFocusTarget, "function")
  const hamburger = { id: "mobile-navigation" }
  const settingsButton = { id: "settings-inside-drawer" }
  const avatar = { id: "avatar-menu" }
  assert.equal(module.panelFocusTarget(false, null, hamburger), hamburger)
  assert.equal(module.panelFocusTarget(true, hamburger, settingsButton), hamburger)
  assert.equal(module.panelFocusTarget(false, hamburger, avatar), avatar)
})
