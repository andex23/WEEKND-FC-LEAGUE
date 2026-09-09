import assert from "node:assert/strict"
import test from "node:test"
import * as t from "../lib/email/templates.ts"

test("email content escapes player input and preserves action query parameters", () => {
  const { html } = t.passwordResetEmail(
    "<script>alert(1)</script>",
    "https://weekendfc.site/auth/reset-password?token_hash=abc&type=recovery",
  )
  assert.ok(!html.includes("<script>"))
  assert.ok(html.includes("&lt;script&gt;"))
  assert.ok(html.includes("token_hash=abc&amp;type=recovery"))
})
test("announcements escape markup while retaining paragraphs", () => {
  const { html } = t.announcementEmail(
    "<img src=x>",
    "Hello <script>bad()</script>\n\nNext matchday",
  )
  assert.ok(!html.includes("<script>"))
  assert.ok(html.includes("&lt;img src=x&gt;"))
  assert.ok(html.includes("Next matchday</p>"))
})
