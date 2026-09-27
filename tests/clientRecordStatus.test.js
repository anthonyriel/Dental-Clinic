import test from 'node:test'
import assert from 'node:assert/strict'
import { clientRecordActive, clientRecordStatus } from '../src/lib/clientRecords.js'
import { bookingRequestRejected } from '../src/lib/errors.js'

test('client eligibility includes linked account access and pending deletion',()=>{
  assert(clientRecordActive({is_active:true,profile_id:null}))
  assert(!clientRecordActive({is_active:false,profile_id:null}))
  assert(clientRecordActive({is_active:true,profile_id:'p',profiles:{is_active:true}}))
  assert(!clientRecordActive({is_active:true,profile_id:'p',profiles:{is_active:false}}))
  assert(!clientRecordActive({is_active:true,profile_id:'p',profiles:null}))
  const pending={is_active:true,profile_id:'p',profiles:{is_active:false,deletion_pending:true}}
  assert(!clientRecordActive(pending))
  assert.equal(clientRecordStatus(pending),'Deletion pending')
})

test('uncertain booking failures keep the original request for safe retry',()=>{
  for(const error of [{message:'Failed to fetch'},{code:'08006'},{code:'XX000'},{code:'PGRST000'}]) assert(!bookingRequestRejected(error))
  for(const code of ['P0001','23505','23P01','42501','40001','40P01','PGRST202']) assert(bookingRequestRejected({code}))
})
