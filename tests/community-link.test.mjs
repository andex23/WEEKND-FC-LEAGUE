import test from 'node:test'
import assert from 'node:assert/strict'
import { discordInvite } from '../lib/community-links.ts'
test('only configured secure Discord invites are shown; the verified-invalid invite is suppressed', () => {
  assert.equal(discordInvite('https://discord.gg/YZumc42p'), null)
  for (const value of ['', 'javascript:alert(1)', 'https://evil.test/invite/test', 'http://discord.gg/valid', 'https://user:pass@discord.gg/valid']) assert.equal(discordInvite(value), null)
  assert.equal(discordInvite('https://discord.gg/newInvite'), 'https://discord.gg/newInvite')
  assert.equal(discordInvite('https://discord.com/invite/newInvite'), 'https://discord.com/invite/newInvite')
})
