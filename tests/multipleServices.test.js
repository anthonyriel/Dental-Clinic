import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { appointmentServices, serviceName } from '../src/lib/appointments.js'

test('service labels retain selection order and support old records', () => {
  const appointment = { appointment_services: [{position:2,service_name:'Filling'},{position:1,service_name:'Cleaning'}] }
  assert.equal(serviceName(appointment),'Cleaning + Filling')
  assert.equal(appointmentServices(appointment)[0].position,1)
  assert.equal(appointment.appointment_services[0].position,2)
  assert.equal(serviceName({service_name:'Old name'}),'Old name')
})

test('multiple services reserve one interval with private immutable quotes and full-duration rescheduling', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`)
    await db.exec(await readFile(new URL('./fixtures/current-schema.sql',import.meta.url),'utf8'))
    await db.exec(`insert into auth.users(id) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,3)n;
      insert into public.profiles(id,role) select id,case right(id::text,1) when '1' then 'staff' else 'client' end from auth.users;
      insert into public.services(name,price) values('Cleaning',500),('Filling',800),('Unpriced',null);`)
    const migrate = async file => db.exec((await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replaceAll('now()',"timestamptz '2030-01-07 02:00:00+00'"))
    await migrate('202609080001_functionality.sql')
    await migrate('202609090001_walk_ins.sql')
    // Match the supplied live overload's return type: migration must replace void with text.
    await db.exec(`create function public.book_appointment(p_service_ids uuid[],p_date date,p_time_slot text) returns void language plpgsql as $$begin return; end$$;
      alter table public.appointments add column service_ids uuid[];`)
    const query = async (sql,args=[]) => (await db.query(sql,args)).rows
    const asUser = async id => db.exec(`reset role; set request.jwt.claim.sub='00000000-0000-0000-0000-${String(id).padStart(12,'0')}'; set role authenticated`)
    const services = await query('select * from public.services order by name')
    const [cleaning,filling,unpriced] = services.map(s=>s.id)
    await db.exec(`update public.services set duration_minutes=30 where name<>'Filling'`)
    await asUser(2)
    const old = (await query('select public.book_appointment($1::text,$2::date,$3::text) id',[cleaning,'2030-01-08','09:00 AM - 09:30 AM']))[0].id
    await db.exec('reset role')
    await migrate('202609100001_multiple_services.sql')
    await asUser(2)
    assert.equal((await query('select * from appointment_services where appointment_id=$1',[old])).length,1)
    const slots = async (ids,date='2030-01-08',exclude=null) => query('select * from public.available_service_slots($1,$2,$3)',[date,ids,exclude])
    const book = (ids,slot,date='2030-01-08') => query('select public.book_appointment($1::uuid[],$2::date,$3::text) id',[ids,date,slot])
    const available = await slots([cleaning,filling])
    assert(available.some(s=>s.time_slot==='09:30 AM - 11:00 AM'))
    assert(!available.some(s=>s.time_slot.startsWith('11:00 AM'))) // no crossing lunch
    await assert.rejects(()=>book([cleaning,filling],'09:30 AM - 10:00 AM'),/no longer available/)
    const id = (await book([cleaning,filling],'09:30 AM - 11:00 AM'))[0].id
    const parent = (await query('select * from appointments where id=$1',[id]))[0]
    assert.equal(parent.service_id,null)
    assert.equal(parent.duration_minutes,90)
    assert.equal(parent.quoted_price,'1300')
    assert.equal(new Date(parent.ends_at)-new Date(parent.starts_at),90*60000)
    assert.equal(new Date(parent.starts_at).toISOString(),'2030-01-08T01:30:00.000Z')
    assert.equal((await query('select * from appointments')).length,2)
    const lines = await query('select * from appointment_services where appointment_id=$1 order by position',[id])
    assert.deepEqual(lines.map(s=>s.service_name),['Cleaning','Filling'])
    assert.deepEqual(lines.map(s=>s.duration_minutes),[30,60])
    assert.equal((await query('select * from appointment_events where appointment_id=$1',[id])).length,1)
    await assert.rejects(()=>book([cleaning],'10:30 AM - 11:00 AM'),/no longer available/)
    await assert.rejects(()=>book([cleaning,cleaning],'01:30 PM - 02:30 PM'),/repeated/)
    await assert.rejects(()=>slots([]),/valid service/)
    await assert.rejects(()=>slots([null]),/valid service/)
    await assert.rejects(()=>slots([cleaning],'2030-01-08',id),/Only management/)
    await assert.rejects(()=>query('update appointment_services set quoted_price=0 where appointment_id=$1',[id]),/permission denied/)
    await asUser(3)
    assert.equal((await query('select * from appointment_services')).length,0)
    await assert.rejects(()=>query('select public.complete_appointment($1,1,$2,100)',[id,'Unauthorized']),/Management access/)
    assert(!(await slots([cleaning])).some(s=>s.time_slot.startsWith('10:30 AM')))
    await asUser(1)
    await assert.rejects(()=>query('select public.complete_appointment($1,1,$2,100)',[id,'Too early']),/confirmed visits/)
    await assert.rejects(()=>query('select public.complete_appointment($1,1,$2,-1)',[id,'Invalid charge']),/non-negative/)
    await query('update services set name=$1,price=900,duration_minutes=120,is_active=false where id=$2',['Renamed',filling])
    await assert.rejects(()=>book([cleaning,filling],'01:30 PM - 03:00 PM'),/unavailable/)
    assert((await slots([], '2030-01-09',id)).some(s=>s.time_slot==='09:00 AM - 10:30 AM'))
    await query('select public.reschedule_appointment($1,1,$2,$3,$4)',[id,'Move visit','2030-01-09','09:00 AM - 10:30 AM'])
    assert.deepEqual(await query('select * from appointment_services where appointment_id=$1 order by position',[id]),lines)
    await assert.rejects(()=>query('select public.reschedule_appointment($1,1,$2,$3,$4)',[id,'Stale edit','2030-01-10','09:00 AM - 10:30 AM']),/changed/)
    const unknown = (await book([cleaning,unpriced],'01:30 PM - 02:30 PM'))[0].id
    assert.equal((await query('select quoted_price from appointments where id=$1',[unknown]))[0].quoted_price,null)
    // Existing walk-in writer also records its service, and blocks online visits.
    const walk = (await query('select public.book_walk_in($1,$2,$3,$4,$5,$6) id',[cleaning,'2030-01-07','10:15 AM - 10:45 AM','Walk-in',null,'10000000-0000-0000-0000-000000000001']))[0].id
    assert.equal((await query('select * from appointment_services where appointment_id=$1',[walk])).length,1)
    await assert.rejects(()=>book([cleaning],'10:30 AM - 11:00 AM','2030-01-07'),/no longer available/)
    // Completion retains the final price and event, with optimistic status checks.
    await db.exec('reset role')
    const past = (await query(`insert into appointments(patient_id,appointment_date,time_slot,status,starts_at,ends_at,service_name)
      values('00000000-0000-0000-0000-000000000002','2030-01-06','09:00 AM - 10:00 AM','confirmed','2030-01-06 01:00+00','2030-01-06 02:00+00','Past visit') returning id`))[0].id
    await asUser(1)
    await query('select public.complete_appointment($1,1,$2,0)',[past,'No charge'])
    const completed = (await query('select * from appointments where id=$1',[past]))[0]
    assert.equal(completed.status,'completed')
    assert.equal(completed.price,'0')
    assert.equal(completed.version,2)
    assert(completed.completed_at)
    assert.equal((await query('select action from appointment_events where appointment_id=$1',[past]))[0].action,'completed')
    await assert.rejects(()=>query('select public.complete_appointment($1,1,$2,100)',[past,'Stale']),/changed/)
    // Exclusion remains a final defense even for a privileged writer bypassing the RPC.
    await db.exec('reset role')
    await assert.rejects(()=>query(`insert into appointments(patient_id,appointment_date,time_slot,status,starts_at,ends_at)
      values('00000000-0000-0000-0000-000000000002','2030-01-09','09:30 AM - 10:00 AM','pending','2030-01-09 01:30+00','2030-01-09 02:00+00')`),/clinic_no_overlap/)
    await db.exec('set role anon')
    await assert.rejects(()=>slots([cleaning]),/permission denied/)
  } finally { await db.close() }
})
