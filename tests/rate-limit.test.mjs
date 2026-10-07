import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeRateLimits } from '../lib/security/rate-limit-core.ts'

test('uses shared atomic limits for both trusted client IP and normalized account', async () => {
  const calls = []
  const db = { rpc: async (name, args) => { calls.push({ name, args }); return { data: [{ allowed: true, retry_after: 0 }], error: null } } }
  const h = new Headers({ 'x-vercel-forwarded-for': '203.0.113.20', 'x-forwarded-for': 'attacker-supplied' })
  assert.deepEqual(await consumeRateLimits(db, 'register', h, ' PERSON@example.com ', true), { allowed: true })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].name, 'consume_request_rate_limit')
  assert.equal(calls[0].args.p_limit, 5)
  assert.equal(calls[0].args.p_window_seconds, 3600)
  assert.match(calls[0].args.p_key, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(calls).includes('example.com'), false)
  assert.equal(JSON.stringify(calls).includes('203.0.113'), false)
  const firstAccount = calls[1].args.p_key
  await consumeRateLimits(db, 'register', new Headers({ 'x-vercel-forwarded-for': '203.0.113.21' }), 'person@example.com', true)
  assert.equal(calls[3].args.p_key, firstAccount)
  assert.notEqual(calls[2].args.p_key, calls[0].args.p_key)
})

test('rate-limited requests stop before additional work and supply retry timing', async () => {
  let calls = 0
  const db = { rpc: async () => { calls++; return { data: [{ allowed: false, retry_after: 47 }], error: null } } }
  const result = await consumeRateLimits(db, 'password-reset', new Headers(), 'person@example.com', false)
  assert.equal(result.allowed, false)
  assert.equal(result.status, 429)
  assert.equal(result.retryAfter, 47)
  assert.equal(calls, 1)
})

test('missing migration, malformed RPC results and network failures fail closed', async () => {
  for (const answer of [{ data: null, error: { message: 'missing' } }, { data: [], error: null }, { data: [{ allowed: 'true' }], error: null }]) {
    const result = await consumeRateLimits({ rpc: async () => answer }, 'admin-login', new Headers(), 'admin', true)
    assert.equal(result.status, 503)
  }
  const result = await consumeRateLimits({ rpc: async () => { throw new Error('offline') } }, 'player-login', new Headers(), 'player', false)
  assert.equal(result.status, 503)
})

test('outside Vercel arbitrary forwarded headers do not create new IP buckets', async () => {
  const keys = []
  const db = { rpc: async (_, args) => { keys.push(args.p_key); return { data: [{ allowed: true }], error: null } } }
  await consumeRateLimits(db, 'verify-resend', new Headers({ 'x-forwarded-for': '1.1.1.1' }), undefined, false)
  await consumeRateLimits(db, 'verify-resend', new Headers({ 'x-forwarded-for': '2.2.2.2' }), undefined, false)
  assert.equal(keys.length, 2)
  assert.equal(keys[0], keys[1])
})
