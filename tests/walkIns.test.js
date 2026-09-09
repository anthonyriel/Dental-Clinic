import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { patientName, patientPhone } from '../src/lib/appointments.js'

test('walk-in labels retain patient identity without an account', () => {
  assert.equal(patientName({walk_in_name:'Walk-in Patient'}), 'Walk-in Patient')
  assert.equal(patientPhone({walk_in_phone:'09123456789'}), '09123456789')
  assert.equal(patientName({profiles:{full_name:'Registered Patient'}}), 'Registered Patient')
})

test('walk-in migration: private, same-day, atomic, conflict-safe and idempotent', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`)
    await db.exec(await readFile(new URL('./fixtures/current-schema.sql',import.meta.url),'utf8'))
    await db.exec(`insert into auth.users(id) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,3)n;
      insert into public.profiles(id,role) select id,case right(id::text,1) when '2' then 'client' else 'staff' end from auth.users;
      insert into public.services(name,price) values('Cleaning',500);`)
    // Freeze SQL time to Monday 10 AM Manila so same-day tests work at any wall-clock time.
    for (const file of ['202609080001_functionality.sql','202609090001_walk_ins.sql']) {
      const sql = await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')
      await db.exec(sql.replaceAll('now()', "timestamptz '2030-01-07 02:00:00+00'"))
    }
    const query = async (sql, params=[]) => (await db.query(sql,params)).rows
    const service = (await query('select id from public.services'))[0].id
    await db.exec(`update public.services set duration_minutes=30; update public.clinic_settings set booking_notice_minutes=1440;
      update public.profiles set is_active=false where id='00000000-0000-0000-0000-000000000003';`)
    const asUser = async id => db.exec(`reset role; set request.jwt.claim.sub='00000000-0000-0000-0000-${String(id).padStart(12,'0')}'; set role authenticated`)
    const args = [service,'2030-01-07','10:15 AM - 10:45 AM','Walk-in Patient','+63 912 345 6789','10000000-0000-0000-0000-000000000001']
    const book = values => query('select public.book_walk_in($1,$2,$3,$4,$5,$6) as id',values)
    await asUser(2)
    await assert.rejects(()=>book(args), /Management access/)
    await assert.rejects(()=>query('select * from public.available_walk_in_slots($1,$2)',args.slice(1,2).concat(service)), /Management access/)
    await asUser(3)
    await assert.rejects(()=>book(args), /Management access/)
    await asUser(1)
    assert.equal((await query('select * from public.available_slots($1,$2)',['2030-01-07',service])).length,0)
    assert((await query('select * from public.available_walk_in_slots($1,$2)',['2030-01-07',service])).some(s=>s.time_slot===args[2]))
    await assert.rejects(()=>book(args.map((v,i)=>i===4?'09':v)), /valid Philippine/)
    await assert.rejects(()=>book(args.map((v,i)=>i===1?'2030-01-08':v)), /today/)
    const id = (await book(args))[0].id
    assert.equal((await book(args))[0].id,id)
    const record = (await query('select * from public.appointments where id=$1',[id]))[0]
    assert.equal(record.status,'confirmed'); assert.equal(record.patient_id,null)
    assert.equal(record.walk_in_phone,'09123456789'); assert.equal(record.service_name,'Cleaning')
    assert.equal(record.quoted_price,'500')
    assert.equal((await query('select * from public.appointment_events')).length,1)
    await assert.rejects(()=>book(args.map((v,i)=>i===5?'10000000-0000-0000-0000-000000000002':v)), /no longer available/)
    await db.exec('reset role')
    await assert.rejects(()=>query(`insert into public.appointments select * from public.appointments where id=$1`,[id]), /duplicate key/)
    await asUser(2)
    assert.equal((await query('select * from public.appointments')).length,0)
    assert.equal((await query('select * from public.appointment_events')).length,0)
    await assert.rejects(()=>query('select public.change_appointment($1,$2,$3,$4)',[id,'request_cancellation',1,'Cancel']), /not available/)
    await asUser(1)
    await query('select public.reschedule_appointment($1,$2,$3,$4,$5)',[id,1,'Reschedule','2030-01-08','10:15 AM - 10:45 AM'])
    await query('select public.change_appointment($1,$2,$3,$4)',[id,'cancelled',2,'Patient left'])
    assert.equal((await query('select status from public.appointments where id=$1',[id]))[0].status,'cancelled')
    // The cancelled reservation no longer blocks a new walk-in; phone may be absent.
    await book(args.map((v,i)=>i===4?null:i===5?'10000000-0000-0000-0000-000000000002':v))
    await db.exec('reset role')
    await query(`insert into public.clinic_closures values('2030-01-07','Closed')`)
    await asUser(1)
    assert.equal((await query('select * from public.available_walk_in_slots($1,$2)',['2030-01-07',service])).length,0)
  } finally { await db.close() }
})
