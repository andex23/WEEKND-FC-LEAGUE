import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root=fileURLToPath(new URL('../',import.meta.url))
const state=globalThis.__recoveryNotice={verified:true, notices:0, allowed:true}
const mocks={
 '@/lib/supabase/server':`export async function createClient(){return {auth:{getUser:async()=>({data:{user:{id:'pending-player',email_confirmed_at:globalThis.__recoveryNotice.verified?'2026-10-07':null}},error:null})}}}`,
 '@/lib/supabase/admin':`export function createAdminClient(){return {}}`,
 '@/lib/security/rate-limit':`export async function enforceRequestRateLimit(){return globalThis.__recoveryNotice.allowed?{allowed:true}:{allowed:false,status:429,retryAfter:60,error:'Try later'}}`,
 '@/lib/email/registration-delivery':`export async function notifyVerifiedRegistration(){globalThis.__recoveryNotice.notices++;return 'sent'}`,
 '@/lib/email':`export async function sendEmail(){throw new Error('No real mail allowed')}`,
}
registerHooks({resolve(s,c,next){if(mocks[s])return{url:'data:text/javascript,'+encodeURIComponent(mocks[s]),shortCircuit:true};if(s==='next/server')return next('next/server.js',c);if(s.startsWith('@/'))return next(pathToFileURL(path.join(root,s.slice(2)+'.ts')).href,c);return next(s,c)}})
const route=await import('../app/api/auth/recovery-complete/route.ts')
const request=(origin='https://weekendfc.site')=>new Request('https://weekendfc.site/api/auth/recovery-complete',{method:'POST',headers:{origin}})
test('verified recovery notifies the organizer without granting access or changing approval',async()=>{
 state.verified=true;state.notices=0;state.allowed=true
 const response=await route.POST(request())
 assert.equal(response.status,200);assert.equal(state.notices,1)
 assert.deepEqual(await response.json(),{ok:true,notificationPending:false})
})
test('unverified, cross-origin and rate-limited recovery cannot send a notice',async()=>{
 state.notices=0;state.verified=false
 assert.equal((await route.POST(request())).status,401)
 state.verified=true
 assert.equal((await route.POST(request('https://other.invalid'))).status,403)
 state.allowed=false
 assert.equal((await route.POST(request())).status,429)
 assert.equal(state.notices,0)
})
