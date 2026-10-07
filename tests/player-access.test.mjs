import assert from 'node:assert/strict'
import test from 'node:test'
import { readPlayerAccess } from '../lib/security/player-access.ts'

function client({ user = { id: 'player-1', email_confirmed_at: '2026-01-01' }, status = 'approved', authError = null, profileError = null, missing = false, deliveryReady = true } = {}) {
  return {
    rpc: async (name) => { assert.equal(name, 'player_access_ready'); return { data: deliveryReady, error: null } },
    auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from: (table) => {
      assert.equal(table, 'players')
      return { select: (columns) => {
        assert.equal(columns, 'status') // role is deliberately not granted to the session client.
        return { eq: (field, id) => {
          assert.equal(field, 'id'); assert.equal(id, user.id)
          return { maybeSingle: async () => ({ data: missing ? null : { status }, error: profileError }) }
        } }
      } }
    },
  }
}

test('only an email-verified, approved player gets league access', async () => {
  const result = await readPlayerAccess(client())
  assert.equal(result.ok, true)
  assert.equal(result.user.id, 'player-1')
  for (const status of ['pending', 'rejected', '', 'APPROVED', null]) {
    assert.equal((await readPlayerAccess(client({ status }))).ok, false)
  }
})

test('normal missing-session responses are unauthenticated, while provider failures stay unavailable', async () => {
  const result = await readPlayerAccess(client({ user: null, authError: { name: 'AuthSessionMissingError', status: 400 } }))
  assert.equal(result.status, 401)
})

test('newly approved players wait for their approval notification to be sent', async () => {
  const result = await readPlayerAccess(client({ deliveryReady: false }))
  assert.equal(result.ok, false)
  assert.equal(result.code, 'approval_email_pending')
})

test('recovery or stale sessions cannot bypass email verification or approval', async () => {
  for (const status of ['pending', 'approved', 'rejected']) {
    const result = await readPlayerAccess(client({ user: { id: 'player-1', email_confirmed_at: null }, status }))
    assert.equal(result.ok, false)
    assert.equal(result.code, 'email_unverified')
  }
  const result = await readPlayerAccess(client({ status: 'pending' }))
  assert.equal(result.code, 'approval_pending')
  assert.equal(result.status, 403)
})

test('missing profiles and failed lookups fail closed, including former admin-role accounts', async () => {
  assert.equal((await readPlayerAccess(client({ missing: true }))).code, 'profile_missing')
  assert.equal((await readPlayerAccess(client({ profileError: { message: 'permission denied' } }))).status, 503)
  assert.equal((await readPlayerAccess(client({ authError: { message: 'offline' } }))).status, 503)
  assert.equal((await readPlayerAccess(client({ user: null }))).status, 401)
  assert.equal((await readPlayerAccess({ auth: { getUser: async () => { throw new Error('offline') } } })).status, 503)
})
