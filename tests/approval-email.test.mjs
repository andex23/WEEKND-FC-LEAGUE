import assert from "node:assert/strict"
import test from "node:test"

import { shouldSendApprovalConfirmationEmail } from "../lib/admin/approval-email.js"

test("sends approval confirmation when a non-approved player becomes approved", () => {
  assert.equal(
    shouldSendApprovalConfirmationEmail({ status: "pending", email: "player@example.com" }, "approved"),
    true,
  )
})

test("does not send approval confirmation when an approved player remains approved", () => {
  assert.equal(
    shouldSendApprovalConfirmationEmail({ status: "approved", email: "player@example.com" }, "approved"),
    false,
  )
})

test("does not send approval confirmation when a pending player is rejected", () => {
  assert.equal(
    shouldSendApprovalConfirmationEmail({ status: "pending", email: "player@example.com" }, "rejected"),
    false,
  )
})

test("does not send approval confirmation without a player email", () => {
  assert.equal(shouldSendApprovalConfirmationEmail({ status: "pending", email: null }, "approved"), false)
})
