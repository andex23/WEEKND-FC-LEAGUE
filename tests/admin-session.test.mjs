import assert from "node:assert/strict"
import test from "node:test"
import { createAdminSession, verifyAdminSession, ADMIN_SESSION_SECONDS } from "../lib/admin/session.ts"

test("admin sessions reject forgery, expiry, and credentials changed after login", async () => {
  const previousEmail = process.env.ADMIN_EMAIL
  const previousPassword = process.env.ADMIN_PASSWORD
  try {
    process.env.ADMIN_EMAIL = "test@example.invalid"
    process.env.ADMIN_PASSWORD = "test-only-admin-password"
    const now = 1800000000000
    const token = await createAdminSession(now)
    assert.equal(await verifyAdminSession(token, now), true)
    assert.equal(await verifyAdminSession("1", now), false)
    assert.equal(await verifyAdminSession(undefined, now), false)
    assert.equal(await verifyAdminSession(token + "x", now), false)
    const parts = token.split(".")
    parts[1] = String(Number(parts[1]) - 1)
    assert.equal(await verifyAdminSession(parts.join("."), now), false)
    assert.equal(await verifyAdminSession(token, now + ADMIN_SESSION_SECONDS * 1000), false)
    process.env.ADMIN_PASSWORD = "changed-password"
    assert.equal(await verifyAdminSession(token, now), false)
    delete process.env.ADMIN_PASSWORD
    assert.equal(await verifyAdminSession(token, now), false)
  } finally {
    if (previousEmail === undefined) delete process.env.ADMIN_EMAIL
    else process.env.ADMIN_EMAIL = previousEmail
    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD
    else process.env.ADMIN_PASSWORD = previousPassword
  }
})
