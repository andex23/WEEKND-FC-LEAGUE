import assert from "node:assert/strict"
import test from "node:test"
import { safeNextPath } from "../lib/safe-next-path.ts"
import { validScore } from "../lib/matches/validation.ts"

test("player login preserves player destinations and rejects admin or external redirects", () => {
  assert.equal(safeNextPath("/report"), "/report")
  assert.equal(safeNextPath("/dashboard?tab=fixtures"), "/dashboard?tab=fixtures")
  for (const path of ["/admin", "/admin/players", "//example.com", "/\\example.com", "/ dashboard", "https://example.com"]) {
    assert.equal(safeNextPath(path), "/dashboard")
  }
})

test("result scores must be bounded, nonnegative integers", () => {
  for (const score of [0, 3, 99]) assert.equal(validScore(score), true)
  for (const score of [null, undefined, "3", -1, 0.5, NaN, Infinity, 100]) assert.equal(validScore(score), false)
})
