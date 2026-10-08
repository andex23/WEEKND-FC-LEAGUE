import assert from 'node:assert/strict'
import test from 'node:test'
import * as state from '../lib/admin/registration-state.ts'
test('admin listing marks email ownership from Auth and exposes only delivery state',async()=>{
 assert.equal(typeof state.withRegistrationState,'function')
 const players=[{id:'p1',email:'player@example.com',status:'pending'},{id:'p2',email:'other@example.com',status:'pending'}]
 const admin={auth:{admin:{getUserById:async(id)=>({data:{user:{id,email:'player@example.com',email_confirmed_at:'2026-10-07'}},error:null})}},from(){const q={select(){return q},eq(){return q},in(){return q},then(resolve){return Promise.resolve({data:[{player_id:'p1',state:'failed'}],error:null}).then(resolve)}};return q}}
 const result=await state.withRegistrationState(admin,players)
 assert.equal(result[0].email_verified,true)
 assert.equal(result[0].approval_email_state,'failed')
 assert.equal(result[1].email_verified,false)
 assert.equal(result[1].approval_email_state,null)
 assert.ok(!('email_confirmed_at' in result[0]))
})
test('approval controls require verified email; unclaimed pending and failed deliveries are retryable',()=>{
 assert.equal(typeof state.registrationApprovalAction,'function')
 assert.equal(state.registrationApprovalAction({status:'pending',email_verified:false}),'none')
 assert.equal(state.registrationApprovalAction({status:'pending',email_verified:null}),'none')
 assert.equal(state.registrationApprovalAction({status:'pending',email_verified:true}),'approve')
 assert.equal(state.registrationApprovalAction({status:'approved',email_verified:true,approval_email_state:'failed'}),'retry')
 assert.equal(state.registrationApprovalAction({status:'approved',email_verified:true,approval_email_state:'pending'}),'retry')
 for(const delivery of ['sent','sending',null]) assert.equal(state.registrationApprovalAction({status:'approved',email_verified:true,approval_email_state:delivery}),'none')
})
