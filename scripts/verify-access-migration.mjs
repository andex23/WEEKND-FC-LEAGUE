// Local, synthetic Postgres verification. Never connects to a Supabase project.
// Use PostgreSQL 17 single-user mode in an isolated temporary cluster.
// Set POSTGRES_BIN, POSTGRES_DATA, and POSTGRES_DB. See docs/site-audit-2026-10-07.md.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { schemaFiles } from './schema-files.mjs'
import { spawnSync } from 'node:child_process'
// A private local data directory is mandatory; no sockets or hosted DBs are used.
if (!process.env.POSTGRES_DATA?.startsWith('/tmp/weekendfc-test-')) throw new Error('Use a synthetic /tmp/weekendfc-test- data directory only')
if (!/^weekendfc_test_[a-z0-9_]+$/.test(process.env.POSTGRES_DB || '')) throw new Error('Use a synthetic test database name')
let currentRole = null, currentId = null
const run = async (text, json = false) => {
  const prefix = currentRole ? `SET ROLE ${currentRole}; SELECT set_config('request.jwt.claim.sub', '${currentId || ''}', false);` : ''
  const query = json ? `WITH result AS (${text}) SELECT COALESCE(jsonb_agg(result), '[]'::jsonb) FROM result;` : text
  const serverMode = process.env.POSTGRES_MODE === 'server'
  if (serverMode && !process.env.PGHOST?.startsWith('/tmp/weekendfc-test-')) throw new Error('Use a private synthetic Unix socket')
  const executable = serverMode ? process.env.PSQL_BIN || 'psql' : process.env.POSTGRES_BIN || 'postgres'
  const args = serverMode ? ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', process.env.POSTGRES_DB] : ['--single', '-j', '-D', process.env.POSTGRES_DATA, process.env.POSTGRES_DB]
  const environment = {...process.env}; delete environment.PGHOSTADDR; delete environment.PGSERVICE; delete environment.PGSERVICEFILE
  const result = spawnSync(executable, args, {input: (prefix + query).replace(/\n\s*\n/g, '\n') + '\n', encoding: 'utf8', env: environment, maxBuffer: 8 * 1024 * 1024})
  if (result.status !== 0 || /(?:ERROR|FATAL):/.test(result.stderr)) throw new Error(result.stderr || result.error?.message || 'Local PostgreSQL query failed')
  if (!json) return result.stdout
  if (serverMode) return JSON.parse(result.stdout.trim().split('\n').at(-1))
  const match = result.stdout.match(/coalesce = "(.*)"/)
  if (!match) throw new Error('Missing Postgres JSON output: ' + result.stdout)
  return JSON.parse(match[1])
}
const sql = (text) => run(text)
const rows = (text) => run(text, true)
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
const D = '44444444-4444-4444-8444-444444444444'
const E = '55555555-5555-4555-8555-555555555555'
let checks = 0
const check = async (name, run) => { await run(); checks++; console.log(`PASS ${name}`) }
async function as(role, id, run) {
  currentRole = role; currentId = id
  try { return await run() } finally { currentRole = null; currentId = null }
}
await sql(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF; END $$;
CREATE SCHEMA auth; CREATE SCHEMA storage;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1, '/') $$;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT ALL ON storage.objects TO anon, authenticated, service_role;`)
// 0009 permissions depends on avatar_url introduced in 0010.
const baseline = schemaFiles.filter((file) => !file.startsWith('0011_') && !file.startsWith('0012_'))
for (const file of baseline) await sql(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'))
await sql(`INSERT INTO auth.users VALUES
('${A}','approved@example.test',now()),('${B}','pending@example.test',now()),
('${C}','unverified@example.test',null),('${D}','mismatch@example.test',now()),('${E}','unverified-approved@example.test',null);
INSERT INTO public.players (id,name,email,status,console) VALUES
('${A}','Approved','approved@example.test','approved','PS5'),('${B}','Pending','pending@example.test','pending','PS5'),
('${C}','Unverified','unverified@example.test','pending','PC'),('${D}','Mismatch','other@example.test','pending','XBOX'),('${E}','Legacy unverified','unverified-approved@example.test','approved','PC');
INSERT INTO public.fixtures (home_player_id,away_player_id,matchday,status,notes,report_notes,report_evidence_url)
VALUES('${A}','${B}',1,'SCHEDULED','Public schedule note','Private dispute note','https://evidence.example.test/private');
INSERT INTO public.notifications(user_id,title) VALUES(NULL,'Broadcast'),('${A}','A private'),('${B}','B private');
INSERT INTO public.messages(recipient_id,body) VALUES(NULL,'Broadcast'),('${A}','A private');`)
// Establish the original privacy exposure on synthetic data before the fix.
await as('anon', null, async () => assert.equal((await rows('SELECT report_notes FROM public.fixtures'))[0].report_notes, 'Private dispute note'))
console.log('BASELINE REPRODUCED: anonymous fixture report read succeeds before hardening')
if (!process.env.SKIP_HARDENING) await sql(await readFile(new URL('../supabase/migrations/0011_access_and_rate_limits.sql', import.meta.url), 'utf8'))
await check('anonymous fixture evidence/notes, config and private profiles are denied', async () => {
  await as('anon', null, async () => {
    await assert.rejects(rows('SELECT report_notes FROM public.fixtures'), /permission denied/)
    await assert.rejects(rows('SELECT report_evidence_url FROM public.fixtures'), /permission denied/)
    await assert.rejects(rows('SELECT config FROM public.tournaments'), /permission denied/)
    await assert.rejects(rows('SELECT integrations FROM public.league_settings'), /permission denied/)
    await assert.rejects(rows('SELECT email FROM public.players'), /permission denied/)
    assert.equal((await rows('SELECT matchday,notes FROM public.fixtures'))[0].notes, 'Public schedule note')
  })
})
const enforcesRls = await as('authenticated', B, async () => (await rows("SELECT row_security_active('public.notifications') AS active"))[0].active)
if (!enforcesRls) console.log('SKIP live RLS row enforcement: PostgreSQL standalone mode disables it; predicate and column grants still checked')
await check('approval predicate denies pending/unverified and permits verified approved identities', async () => {
  for (const id of [B,C,E]) await as('authenticated', id, async () => assert.equal((await rows('SELECT private.has_league_access() AS allowed'))[0].allowed, false))
  await as('authenticated', A, async () => assert.equal((await rows('SELECT private.has_league_access() AS allowed'))[0].allowed, true))
})
if (enforcesRls) await check('pending, unverified and revoked identities cannot read member broadcasts or write avatars', async () => {
  for (const id of [B,C,E]) await as('authenticated', id, async () => {
    assert.equal((await rows('SELECT * FROM public.notifications')).length, 0)
    assert.equal((await rows('SELECT * FROM public.messages')).length, 0)
    await assert.rejects(sql(`INSERT INTO storage.objects(bucket_id,name) VALUES('player-avatars','${id}/photo.png')`), /row-level security/)
    assert.equal((await rows(`UPDATE public.players SET avatar_url='https://example.test/x' WHERE id='${id}' RETURNING id`)).length, 0)
  })
})
if (enforcesRls) await check('verified approved player can read own plus broadcast notifications and manage own avatar', async () => {
  await as('authenticated', A, async () => {
    assert.equal((await rows('SELECT * FROM public.notifications')).length, 2)
    await sql(`INSERT INTO storage.objects(bucket_id,name) VALUES('player-avatars','${A}/photo.png')`)
    assert.equal((await rows(`UPDATE public.players SET avatar_url='https://example.test/photo' WHERE id='${A}' RETURNING id`)).length, 1)
    await assert.rejects(sql(`UPDATE public.players SET role='ADMIN' WHERE id='${A}'`), /permission denied/)
    await assert.rejects(sql(`UPDATE storage.objects SET name='${B}/photo.png' WHERE name='${A}/photo.png'`), /row-level security/)
  })
  await sql(`UPDATE public.players SET status='rejected' WHERE id='${A}'`)
  await as('authenticated', A, async () => assert.equal((await rows('SELECT * FROM public.notifications')).length, 0))
  await sql(`UPDATE public.players SET status='approved' WHERE id='${A}'`)
})
await check('durable rate counter enforces limits and is callable only by service role', async () => {
  const call = `SELECT * FROM public.consume_request_rate_limit('${'a'.repeat(64)}',2,60)`
  await as('anon', null, async () => { await assert.rejects(rows(call), /permission denied/) })
  await as('authenticated', A, async () => { await assert.rejects(rows(call), /permission denied/) })
  await as('service_role', null, async () => {
    assert.equal((await rows(call))[0].allowed, true)
    assert.equal((await rows(call))[0].allowed, true)
    const blocked = (await rows(call))[0]
    assert.equal(blocked.allowed, false); assert.ok(blocked.retry_after > 0)
    await assert.rejects(rows('SELECT * FROM auth.users'), /permission denied/)
  })
})
await sql(await readFile(new URL('../supabase/migrations/0012_registration_verification.sql', import.meta.url), 'utf8'))
await check('legacy approved users are not backfilled or emailed by ordinary updates', async () => {
  await sql(`UPDATE public.players SET name='Approved renamed' WHERE id='${A}'`)
  assert.equal((await rows('SELECT * FROM public.registration_email_deliveries')).length, 0)
})
await check('unverified or mismatched identity approval rolls back without queueing', async () => {
  for (const id of [C,D]) await as('service_role', null, async () => {
    await assert.rejects(sql(`UPDATE public.players SET status='approved' WHERE id='${id}'`), /verify their email/)
    assert.equal((await rows(`SELECT status FROM public.players WHERE id='${id}'`))[0].status, 'pending')
    assert.equal((await rows(`SELECT * FROM public.registration_email_deliveries WHERE player_id='${id}'`)).length, 0)
  })
})
await check('verified approval queues exactly one email and repeat updates cannot reset sent state', async () => {
  await as('service_role', null, async () => {
    await sql(`UPDATE public.players SET status='approved' WHERE id='${B}'`)
    assert.equal((await rows(`SELECT state FROM public.registration_email_deliveries WHERE player_id='${B}'`))[0].state, 'pending')
    currentId = B
    assert.equal((await rows('SELECT public.player_access_ready() AS ready'))[0].ready, false)
    await sql(`UPDATE public.registration_email_deliveries SET state='sent' WHERE player_id='${B}'; UPDATE public.players SET status='approved' WHERE id='${B}';`)
    const result = await rows(`SELECT state FROM public.registration_email_deliveries WHERE player_id='${B}'`)
    assert.equal(result.length, 1); assert.equal(result[0].state, 'sent')
    assert.equal((await rows('SELECT public.player_access_ready() AS ready'))[0].ready, true)
  })
  for (const role of ['anon','authenticated']) await as(role, A, async () => {
    await assert.rejects(rows('SELECT * FROM public.registration_email_deliveries'), /permission denied/)
    await assert.rejects(sql(`UPDATE public.registration_email_deliveries SET state='sent'`), /permission denied/)
  })
})
console.log(`${checks} synthetic Postgres checks passed`)
