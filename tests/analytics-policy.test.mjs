import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldTrackPage, cleanReferrer } from '../lib/analytics-policy.ts'

test('only public production pages are tracked; auth tokens and private pages are excluded', () => {
  assert.equal(shouldTrackPage('weekendfc.site', '/register'), true)
  for (const path of ['/auth/verify-email', '/auth/reset-password', '/admin', '/admin/players', '/dashboard', '/report', '/refer']) {
    assert.equal(shouldTrackPage('weekendfc.site', path), false)
  }
  assert.equal(shouldTrackPage('localhost', '/'), false)
  assert.equal(shouldTrackPage('preview.vercel.app', '/'), false)
})

test('referrers never include query, fragment or authentication paths', () => {
  assert.equal(cleanReferrer('https://example.com/page?email=person#token'), 'https://example.com/page')
  assert.equal(cleanReferrer('https://weekendfc.site/auth/reset-password?token_hash=secret'), '')
  assert.equal(cleanReferrer('not-a-url'), '')
})
