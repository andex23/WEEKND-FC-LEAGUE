import assert from "node:assert/strict"
import test from "node:test"
import { reminderDelivered } from "../lib/email/reminder-delivery.ts"

test("only complete reminder delivery marks a fixture sent", () => {
  assert.equal(reminderDelivered(true, true, [true, true]), true)
  for (const results of [[], [true], [true, false], [false, true], [false, false]]) {
    assert.equal(reminderDelivered(true, true, results), false)
  }
  assert.equal(reminderDelivered(false, true, [true]), false)
  assert.equal(reminderDelivered(true, false, [true]), false)
})
