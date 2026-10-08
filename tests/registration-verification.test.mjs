import assert from 'node:assert/strict'
import test from 'node:test'
import { verifiedRegistrationAdminEmail } from '../lib/email/templates.ts'
import * as flow from '../lib/auth/registration-workflow.ts'
import * as delivery from '../lib/email/registration-delivery.ts'
process.env.REGISTRATION_ADMIN_EMAIL = 'organizer@example.invalid'

function adminFixture({verified = false, deliveryState = undefined, sendResult = true} = {}) {
  const user = { id: 'player-id', email: 'player@example.com', email_confirmed_at: verified ? '2026-10-07T00:00:00Z' : null }
  const player = { id: user.id, email: user.email, name: '<Player>', console: 'PS5', status: 'pending' }
  const events = []
  let state = deliveryState
  let claim = null
  const admin = {
    auth: {admin: {
      getUserById: async () => ({data: {user}, error: null}),
      generateLink: async (params) => {events.push(['link', params]); return {data: {user, properties: {hashed_token: 'a'.repeat(64), verification_type: 'signup'}}, error: null}},
    }},
    from(table) {
      let op = 'read', patch, filters = []
      const query = {
        select(){return query}, eq(key, value){filters.push([key, value]); return query}, in(key, value){filters.push([key, value]); return query},
        insert(value){op = 'insert'; patch = value; return query}, update(value){op = 'update'; patch = value; return query},
        async maybeSingle(){return perform()}, async single(){return perform()},
        then(resolve, reject){return Promise.resolve(perform()).then(resolve, reject)},
      }
      function perform(){
        if(table === 'players') return {data: player, error: null}
        if(op === 'insert') {if(state) return {data: null, error:{code:'23505'}}; state = 'pending'; return {data:null,error:null}}
        if(op === 'update') {
          if(filters.some(([key, value]) => key === 'state' && !(Array.isArray(value) ? value.includes(state) : state === value))) return {data:null,error:null}
          if(filters.some(([key,value]) => key === 'claim_id' && claim !== value)) return {data:null,error:null}
          state = patch.state; if(patch.claim_id) claim = patch.claim_id
          return {data:{player_id:player.id,state,claim_id:claim},error:null}
        }
        return {data:state ? {player_id:player.id,state,claim_id:claim}:null,error:null}
      }
      return query
    },
  }
  const send = async (...args) => {events.push(['send', ...args]); return sendResult}
  return {admin, user, player, events, send, state: () => state}
}

test('signup verification link regeneration never supplies a replacement password or metadata', async () => {
  assert.equal(typeof flow.generateRegistrationVerification, 'function')
  const f = adminFixture()
  const result = await flow.generateRegistrationVerification(f.admin, f.player, 'https://weekendfc.site/auth/verify-email')
  assert.equal(result.ok, true)
  const params = f.events[0][1]
  assert.equal(params.type, 'signup')
  assert.equal(params.password, '')
  assert.equal(params.options, undefined)
  assert.equal(new URL(result.url).hash, '#token_hash=' + 'a'.repeat(64))
})

test('verification generation refuses verified accounts or mismatched identities', async () => {
  assert.equal(typeof flow.generateRegistrationVerification, 'function')
  for (const mismatch of [false, true]) {
    const f = adminFixture({verified: !mismatch})
    if(mismatch) f.user.email = 'another@example.com'
    assert.equal((await flow.generateRegistrationVerification(f.admin, f.player, 'https://weekendfc.site/auth/verify-email')).ok, false)
    assert.equal(f.events.length, 0)
  }
})

test('unverified accounts cannot send an admin notification', async () => {
  assert.equal(typeof delivery.notifyVerifiedRegistration, 'function')
  const f = adminFixture()
  const result = await delivery.notifyVerifiedRegistration(f.admin, f.user.id, 'https://weekendfc.site/admin', f.send, verifiedRegistrationAdminEmail)
  assert.equal(result, 'ineligible')
  assert.equal(f.events.length, 0)
})

test('verified registration sends only minimal details to the fixed admin address and deduplicates', async () => {
  assert.equal(typeof delivery.notifyVerifiedRegistration, 'function')
  const f = adminFixture({verified:true})
  assert.equal(await delivery.notifyVerifiedRegistration(f.admin, f.user.id, 'https://weekendfc.site/admin', f.send, verifiedRegistrationAdminEmail), 'sent')
  assert.equal(await delivery.notifyVerifiedRegistration(f.admin, f.user.id, 'https://weekendfc.site/admin', f.send, verifiedRegistrationAdminEmail), 'sent')
  const sent = f.events.filter(([kind]) => kind === 'send')
  assert.equal(sent.length, 1)
  assert.equal(sent[0][1], 'organizer@example.invalid')
  assert.ok(!sent[0][3].includes(f.player.email))
  assert.ok(sent[0][3].includes('PS5'))
  assert.ok(sent[0][3].includes('&lt;Player&gt;'))
})

test('parallel notification requests claim delivery only once', async () => {
  assert.equal(typeof delivery.notifyVerifiedRegistration, 'function')
  const f = adminFixture({verified:true})
  await Promise.all(Array.from({length:5}, () => delivery.notifyVerifiedRegistration(f.admin, f.user.id, 'https://weekendfc.site/admin', f.send, verifiedRegistrationAdminEmail)))
  assert.equal(f.events.filter(([kind])=>kind==='send').length, 1)
})

test('failed delivery stays retryable and in-flight delivery is never blindly repeated', async () => {
  assert.equal(typeof delivery.notifyVerifiedRegistration, 'function')
  const f = adminFixture({verified:true, sendResult:false})
  assert.equal(await delivery.notifyVerifiedRegistration(f.admin, f.user.id, 'https://weekendfc.site/admin', f.send, verifiedRegistrationAdminEmail), 'failed')
  assert.equal(f.state(), 'failed')
  const inflight = adminFixture({verified:true, deliveryState:'sending'})
  assert.equal(await delivery.notifyVerifiedRegistration(inflight.admin, inflight.user.id, 'https://weekendfc.site/admin', inflight.send, verifiedRegistrationAdminEmail), 'pending')
  assert.equal(inflight.events.length, 0)
})

test('verification always signs out the transient session and cannot approve a player', async () => {
  assert.equal(typeof flow.verifyRegistrationToken, 'function')
  const f = adminFixture({verified:true})
  const events = []
  const auth = {verifyOtp: async (args)=>{events.push(args); return {data:{user:f.user,session:{access_token:'not-persisted'}},error:null}}, signOut: async(options)=>{assert.deepEqual(options, {scope:'local'});events.push('signed-out');return {error:null}}}
  const result = await flow.verifyRegistrationToken(auth, 'a'.repeat(64))
  assert.equal(result.ok, true)
  assert.deepEqual(events, [{token_hash:'a'.repeat(64),type:'signup'}, 'signed-out'])
  assert.equal(f.player.status, 'pending')
})

test('invalid/expired tokens fail honestly and do not report email confirmation', async () => {
  assert.equal(typeof flow.verifyRegistrationToken, 'function')
  const auth = {verifyOtp:async()=>({data:{user:null,session:null},error:{message:'expired'}}),signOut:async()=>({error:null})}
  assert.equal((await flow.verifyRegistrationToken(auth, 'a'.repeat(64))).ok, false)
  assert.equal((await flow.verifyRegistrationToken(auth, 'bad')).ok, false)
})

function signupFixture({duplicate=false,sendResult=true,rateAllowed=true}={}) {
 const events=[]
 const data={username:'PLAYER',email:'PLAYER@example.com',name:'Player',psnName:'player',location:'City',console:'PS5',preferredClub:'Arsenal',downloadMbps:'100',uploadMbps:'30',password:'TestOnly123',confirmPassword:'TestOnly123'}
 const admin={auth:{admin:{createUser:async(params)=>{events.push(['create',params]);return duplicate?{data:{user:null},error:{message:'User already registered'}}:{data:{user:{id:'new-player'}},error:null}},deleteUser:async()=>{events.push(['delete']);return{error:null}}}},from(table){
   let operation='read'
   const q={select(){return q},limit(){return q},eq(){return q},insert(value){operation='insert';events.push(['insert',value]);return q},async maybeSingle(){return{data:table==='league_settings'?{registration_open:true}:null,error:null}},then(resolve){return Promise.resolve({error:null}).then(resolve)}}
   return q
 }}
 const dependencies={sendVerification:async(player)=>{events.push(['verify',player]);return sendResult}}
 return {events,data,admin,dependencies}
}
test('duplicate auth account is never overwritten or given a new player profile',async()=>{
 assert.equal(typeof flow.registerPendingPlayer,'function')
 const f=signupFixture({duplicate:true})
 const result=await flow.registerPendingPlayer(f.admin,f.data,f.dependencies)
 assert.equal(result.status,409)
 assert.deepEqual(f.events.map(([e])=>e),['create'])
})
test('new registration is unverified, pending, and sends verification before any review alert',async()=>{
 assert.equal(typeof flow.registerPendingPlayer,'function')
 const f=signupFixture()
 const result=await flow.registerPendingPlayer(f.admin,f.data,f.dependencies)
 assert.equal(result.status,201)
 assert.equal(f.events[0][1].email_confirm,false)
 assert.equal(f.events[1][1].status,'pending')
 assert.equal(f.events[1][1].role,'PLAYER')
 assert.deepEqual(f.events.map(([e])=>e),['create','insert','verify'])
 assert.equal(result.body.verificationEmailSent,true)
})
test('SMTP failure keeps the created profile and tells the player to resend verification',async()=>{
 assert.equal(typeof flow.registerPendingPlayer,'function')
 const f=signupFixture({sendResult:false})
 const result=await flow.registerPendingPlayer(f.admin,f.data,f.dependencies)
 assert.equal(result.status,201)
 assert.equal(result.body.verificationEmailSent,false)
 assert.match(result.body.message,/resend/i)
 assert.ok(!f.events.some(([e])=>e==='delete'))
})
