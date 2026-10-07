import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const state = globalThis.__registrationRouteTest = {
  allowed: false, adminCalls: 0, notifications: 0, authCalls: 0, signouts: 0, notificationState: 'sent',
}
const mocks = {
 '@/lib/security/rate-limit': `export async function enforceRequestRateLimit(){return globalThis.__registrationRouteTest.allowed ? {allowed:true} : {allowed:false,status:429,retryAfter:60,error:'Too many attempts'}}`,
 '@/lib/supabase/admin': `export function createAdminClient(){globalThis.__registrationRouteTest.adminCalls++;return {}}`,
 '@/lib/supabase/server': `export async function createClient(){return {auth:{exchangeCodeForSession:async()=>({data:{user:null},error:{message:'expired'}}),signOut:async()=>{globalThis.__registrationRouteTest.signouts++;return {error:null}}}}}`,
 '@/lib/email': `export function isEmailConfigured(){return true};export async function sendEmail(){throw new Error('No real email permitted')}`,
 '@/lib/email/registration-delivery': `export function registrationAdminRecipient(){return 'organizer@example.invalid'};export async function notifyVerifiedRegistration(){globalThis.__registrationRouteTest.notifications++;return globalThis.__registrationRouteTest.notificationState}`,
 '@supabase/supabase-js': `export function createClient(){globalThis.__registrationRouteTest.authCalls++;return {auth:{verifyOtp:async()=>({data:{user:{id:'verified-player',email:'player@example.invalid',email_confirmed_at:'2026-10-07'}},error:null}),signOut:async()=>{globalThis.__registrationRouteTest.signouts++;return {error:null}}}}}`,
}
registerHooks({resolve(specifier, context, nextResolve) {
 if(mocks[specifier]) return {url:'data:text/javascript,'+encodeURIComponent(mocks[specifier]),shortCircuit:true}
 if(specifier === 'next/server') return nextResolve('next/server.js',context)
 if(specifier.startsWith('@/')) return nextResolve(pathToFileURL(path.join(root,specifier.slice(2)+'.ts')).href,context)
 if(specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
  const target = fileURLToPath(new URL(specifier,context.parentURL))
  if(existsSync(target+'.ts')) return nextResolve(pathToFileURL(target+'.ts').href,context)
 }
 return nextResolve(specifier,context)
}})
const register = await import('../app/api/register/route.ts')
const resend = await import('../app/api/auth/resend-verification/route.ts')
const verify = await import('../app/api/auth/verify-email/route.ts')
const data={username:'PLAYER',email:'player@example.invalid',name:'Player',psnName:'player',location:'City',console:'PS5',preferredClub:'Arsenal',downloadMbps:'100',uploadMbps:'30',password:'TestOnly123',confirmPassword:'TestOnly123'}
const request=(path,body,origin='https://weekendfc.site')=>new Request('https://weekendfc.site'+path,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(body)})

test('registration and resend enforce durable rate limits before Auth/database/mail effects',async()=>{
 state.allowed=false;state.adminCalls=0
 for(const [route,url,body] of [[register,'/api/register',data],[resend,'/api/auth/resend-verification',{email:data.email}]]) {
  const response=await route.POST(request(url,body))
  assert.equal(response.status,429)
  assert.equal(response.headers.get('Retry-After'),'60')
 }
 assert.equal(state.adminCalls,0)
})
test('verification rejects cross-origin requests before token exchange',async()=>{
 state.authCalls=0
 const result=await verify.POST(request('/api/auth/verify-email',{token_hash:'a'.repeat(64)},'https://untrusted.invalid'))
 assert.equal(result.status,403)
 assert.equal(state.authCalls,0)
})
test('verification POST signs out before returning pending-approval success',async()=>{
 state.allowed=true;state.notifications=0;state.signouts=0;state.notificationState='sent'
 const response=await verify.POST(request('/api/auth/verify-email',{token_hash:'a'.repeat(64)}))
 assert.equal(response.status,200)
 assert.equal(state.signouts,1)
 assert.equal(state.notifications,1)
 const body=await response.json()
 assert.equal(body.verified,true)
 assert.match(body.message,/needs admin approval/)
 assert.equal(response.headers.get('set-cookie'),null)
})
test('verification exposes delayed notification without undoing verified email or granting access',async()=>{
 state.allowed=true;state.notificationState='failed'
 const response=await verify.POST(request('/api/auth/verify-email',{token_hash:'b'.repeat(64)}))
 const body=await response.json()
 assert.equal(body.verified,true)
 assert.equal(body.notificationPending,true)
 assert.match(body.message,/retry/)
 assert.equal(body.status,undefined)
})
test('an expired legacy confirmation code does not sign out an unrelated browser session', async () => {
 state.allowed=true;state.signouts=0;state.notifications=0
 const response=await verify.POST(request('/api/auth/verify-email',{code:'x'.repeat(36)}))
 assert.equal(response.status,400)
 assert.equal(state.signouts,0)
 assert.equal(state.notifications,0)
})
