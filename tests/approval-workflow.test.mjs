import assert from 'node:assert/strict'
import test from 'node:test'
import * as flow from '../lib/admin/approval-workflow.ts'
function fixture({verified=true,status='pending',emailSent=true}={}) {
  const player = {id:'p1', name:'Player',email:'player@example.com',status}
  const events=[]
  const admin={auth:{admin:{getUserById:async()=>({data:{user:{id:player.id,email:player.email,email_confirmed_at:verified?'2026-10-07':null}},error:null})}},from(){
    let update
    const q={select(){return q},eq(){return q},update(patch){update=patch;return q},async single(){if(update){Object.assign(player,update);events.push('updated')}return{data:{...player},error:null}}}
    return q
  }}
  const dependencies={isEmailConfigured:()=>true,deliverApproval:async()=>{events.push('email');return emailSent?'sent':'failed'}}
  return{player,events,admin,dependencies}
}
test('admin approval rejects unverified auth email without modifying status or auth',async()=>{
  assert.equal(typeof flow.applyPlayerApproval,'function')
  const f=fixture({verified:false})
  const result=await flow.applyPlayerApproval(f.admin,{playerId:'p1',status:'approved',loginUrl:'https://weekendfc.site/auth/login'},f.dependencies)
  assert.equal(result.ok,false)
  assert.equal(result.statusCode,409)
  assert.equal(f.player.status,'pending')
  assert.deepEqual(f.events,[])
})
test('verified pending player can be approved and receive approval email',async()=>{
  assert.equal(typeof flow.applyPlayerApproval,'function')
  const f=fixture()
  const result=await flow.applyPlayerApproval(f.admin,{playerId:'p1',status:'approved',loginUrl:'https://weekendfc.site/auth/login'},f.dependencies)
  assert.equal(result.ok,true)
  assert.equal(result.emailSent,true)
  assert.deepEqual(f.events,['updated','email'])
})
test('SMTP failure reports approved status honestly and leaves durable delivery retryable',async()=>{
  assert.equal(typeof flow.applyPlayerApproval,'function')
  const f=fixture({emailSent:false})
  const result=await flow.applyPlayerApproval(f.admin,{playerId:'p1',status:'approved',loginUrl:'https://weekendfc.site/auth/login'},f.dependencies)
  assert.equal(result.ok,false)
  assert.equal(result.statusCode,502)
  assert.match(result.error,/approved.*retry/i)
  assert.equal(f.player.status,'approved')
})
test('already-approved users are preserved; rejection sends no approval message',async()=>{
  assert.equal(typeof flow.applyPlayerApproval,'function')
  const f=fixture({status:'approved'})
  f.dependencies.deliverApproval=async()=> 'ineligible'
  const result=await flow.applyPlayerApproval(f.admin,{playerId:'p1',status:'approved',loginUrl:'https://weekendfc.site/auth/login'},f.dependencies)
  assert.equal(result.ok,true)
  assert.equal(result.emailSent,false)
  const rejected=fixture({verified:false})
  assert.equal((await flow.applyPlayerApproval(rejected.admin,{playerId:'p1',status:'rejected',loginUrl:'https://weekendfc.site/auth/login'},rejected.dependencies)).ok,true)
  assert.deepEqual(rejected.events,['updated'])
})
test('new approval fails visibly if its required delivery was not queued',async()=>{
 const f=fixture()
 f.dependencies.deliverApproval=async()=> 'ineligible'
 const result=await flow.applyPlayerApproval(f.admin,{playerId:'p1',status:'approved',loginUrl:'https://weekendfc.site/auth/login'},f.dependencies)
 assert.equal(result.ok,false)
 assert.match(result.error,/queue/i)
})
