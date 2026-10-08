import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import { readFileSync } from 'node:fs'
const state = globalThis.__callbackTest = { exchanges: 0 }
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'next/navigation') return { url: 'data:text/javascript,' + encodeURIComponent('export function redirect(location) { throw Object.assign(new Error("redirect"), {location}) }'), shortCircuit: true }
    if (specifier === '@/lib/supabase/server') return { url: 'data:text/javascript,' + encodeURIComponent('export async function createClient(){return {auth:{exchangeCodeForSession:async()=>{globalThis.__callbackTest.exchanges++;return {error:null}},signOut:async()=>{}}}}'), shortCircuit: true }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('/app/auth/callback/page.tsx')) return { format: 'module', source: stripTypeScriptTypes(readFileSync(process.env.CALLBACK_SOURCE || new URL(url), 'utf8')), shortCircuit: true }
    return next(url, context)
  },
})
const callback = (await import('../app/auth/callback/page.tsx')).default
const redirect = async (params) => { try { await callback({searchParams:Promise.resolve(params)}) } catch (error) { if(error.location) return error.location; throw error } }
test('recovery callback leaves PKCE exchange to the browser that can save its session cookies', async () => {
  state.exchanges=0
  const location = await redirect({code:'recovery-code',next:'/auth/reset-password'})
  assert.equal(location, '/auth/reset-password#code=recovery-code')
  assert.equal(state.exchanges, 0)
})
test('confirmation GET stays inert and cannot redirect to external destinations', async () => {
  state.exchanges=0
  assert.equal(await redirect({code:'signup-code',next:'https://external.invalid'}), '/auth/verify-email#code=signup-code')
  assert.equal(state.exchanges,0)
  assert.equal(await redirect({}),'/auth/login')
})
