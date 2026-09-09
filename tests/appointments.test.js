import test from 'node:test'
import assert from 'node:assert/strict'
import { clinicDate, isUpcoming, canRequestCancellation, allowedActions, sortAppointments, appointmentStart } from '../src/lib/appointments.js'
const appt = { appointment_date:'2026-09-15',time_slot:'09:00 AM - 10:00 AM',status:'confirmed' }
test('clinic date and appointment times are independent of device timezone',()=>{
  assert.equal(clinicDate(new Date('2026-09-08T17:00:00Z')),'2026-09-09')
  assert.equal(appointmentStart(appt).toISOString(),'2026-09-15T01:00:00.000Z')
})
test('cancellation cutoff uses exact appointment time',()=>{
  assert(canRequestCancellation(appt,168,new Date('2026-09-08T01:00:00Z')))
  assert(!canRequestCancellation(appt,168,new Date('2026-09-08T01:00:01Z')))
})
test('upcoming includes pending cancellations but excludes elapsed and terminal visits',()=>{
  assert(isUpcoming({...appt,status:'Cancellation Requested'},new Date('2026-09-08T00:00:00Z')))
  assert(!isUpcoming(appt,new Date('2026-09-16T00:00:00Z')))
  assert(!isUpcoming({...appt,status:'completed'},new Date('2026-09-08T00:00:00Z')))
})
test('staff can complete future visits but cannot mark them no-show or change terminal visits',()=>{
  assert.deepEqual(allowedActions({...appt,status:'completed'}),[])
  const now = new Date('2026-09-08T00:00:00Z')
  assert(allowedActions(appt,now).includes('completed'))
  assert(allowedActions({...appt,status:'pending'},now).includes('completed'))
  assert(!allowedActions(appt,now).includes('no_show'))
  assert(!allowedActions({...appt,status:'cancelled'},now).includes('completed'))
})
test('same-day appointments sort by actual time, including noon',()=>{
  const times=['01:30 PM - 02:30 PM','11:00 AM - 12:00 PM','09:00 AM - 10:00 AM']
  assert.deepEqual(sortAppointments(times.map(time_slot=>({...appt,time_slot}))).map(a=>a.time_slot),[times[2],times[1],times[0]])
})
