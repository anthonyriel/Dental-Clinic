import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('database with supplied UUID schema: booking, privacy, status transitions, archive history and account permissions', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
    `)
    await db.exec(await readFile(new URL('./fixtures/current-schema.sql',import.meta.url),'utf8'))
    await db.exec(`
      insert into auth.users(id) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,5) n;
      insert into auth.users(id) values ('00000000-0000-0000-0000-000000000099');
      insert into public.profiles(id,role,full_name) values
        ('00000000-0000-0000-0000-000000000001','client','Patient One'),
        ('00000000-0000-0000-0000-000000000002','client','Patient Two'),
        ('00000000-0000-0000-0000-000000000003','staff','Staff'),
        ('00000000-0000-0000-0000-000000000004','admin','Admin'),
        ('00000000-0000-0000-0000-000000000005','owner','Owner');
      insert into public.services(name,price) values ('Cleaning',500);
      insert into public.appointments(patient_id,service_id,appointment_date,time_slot,status)
      select '00000000-0000-0000-0000-000000000001'::uuid,id,'2025-01-06','09:00 AM - 10:00 AM',s
      from public.services cross join (values ('confirmed'),('cancelled')) old_status(s);
    `)
    await db.exec(await readFile(new URL('./fixtures/signup-trigger.sql',import.meta.url),'utf8'))
    await db.exec(await readFile(new URL('../supabase/migrations/202609080001_functionality.sql',import.meta.url),'utf8'))
    await db.query(`insert into auth.users(id,raw_user_meta_data) values($1,$2)`,[
      '00000000-0000-0000-0000-000000000100',
      JSON.stringify({username:'signup-test',full_name:'Synthetic Signup',role:'owner',birthdate:'2000-01-01',region:'Test region',phone:'09123456789'})
    ])
    const signup = (await db.query(`select role,country,region,full_name,is_active from public.profiles where id='00000000-0000-0000-0000-000000000100'`)).rows
    assert.equal(signup.length,1)
    assert.deepEqual(signup[0],{role:'client',country:'Philippines',region:'Test region',full_name:'Synthetic Signup',is_active:true})
    assert.equal((await db.query(`select count(*)::int as count from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal`)).rows[0].count,1)
    const legacy = (await db.query(`select status,quote_is_estimate,starts_at from public.appointments order by status`)).rows
    assert.deepEqual(legacy.map(a=>a.status),['cancelled','confirmed'])
    assert(legacy.every(a=>a.quote_is_estimate && a.starts_at))
    await db.exec(`set role anon`)
    await assert.rejects(()=>db.query('select * from public.profiles'),/permission denied/)
    await db.exec('reset role')
    async function asUser(id) {
      await db.exec(`reset role; set request.jwt.claim.sub = '00000000-0000-0000-0000-${String(id).padStart(12,'0')}'; set role authenticated`)
    }
    const query = async (sql, params=[]) => (await db.query(sql,params)).rows
    await db.exec(`
      create schema storage;
      create function auth.role() returns text language sql stable as $$ select current_user::text $$;
      create table storage.buckets(id text primary key,file_size_limit bigint,allowed_mime_types text[]);
      insert into storage.buckets(id) values('avatars');
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid default auth.uid());
      alter table storage.objects enable row level security;
      grant usage on schema storage to anon,authenticated;
      grant select,insert,update,delete on storage.objects to anon,authenticated;
      create policy "Authenticated users can upload avatars" on storage.objects for insert with check(bucket_id='avatars' and auth.role()='authenticated');
      create policy "Avatar images are publicly accessible" on storage.objects for select using(bucket_id='avatars');
      create policy "Users can update own avatars" on storage.objects for update using(bucket_id='avatars' and auth.uid()=owner);
    `)
    await db.exec(await readFile(new URL('../supabase/avatar-policies.sql',import.meta.url),'utf8'))
    await asUser(1)
    await query(`insert into storage.objects(bucket_id,name) values('avatars','00000000-0000-0000-0000-000000000001-test.jpg')`)
    await assert.rejects(()=>query(`insert into storage.objects(bucket_id,name) values('avatars','00000000-0000-0000-0000-000000000002-test.jpg')`),/row-level security/)
    await assert.rejects(()=>query(`update storage.objects set name='00000000-0000-0000-0000-000000000002-renamed.jpg' where owner=auth.uid()`),/row-level security/)
    await db.exec('reset role')
    const serviceId = (await query('select id from public.services limit 1'))[0].id
    const future = (await query(`select ((now() at time zone 'Asia/Manila')::date+14)::text as day`))[0].day
    // Use all weekdays in the fixture so the test is deterministic on every run date.
    await db.exec('update public.clinic_settings set opening_days=array[0,1,2,3,4,5,6]')
    await query('update public.services set duration_minutes=30 where id=$1',[serviceId])
    await asUser(1)
    const shortSlots = await query('select * from public.available_slots($1,$2)',[future,serviceId])
    assert(shortSlots.some(s=>s.time_slot==='09:00 AM - 09:30 AM'))
    assert(!shortSlots.some(s=>s.time_slot==='09:00 AM - 10:00 AM'))
    await db.exec('reset role')
    await query('update public.services set duration_minutes=60 where id=$1',[serviceId])
    await asUser(1)
    const slots = await query('select * from public.available_slots($1,$2)',[future,serviceId])
    assert(slots.length > 0)
    assert(slots.some(s=>s.time_slot==='09:00 AM - 10:00 AM'))
    assert(!slots.some(s=>s.time_slot.startsWith('01:00 PM')))
    assert(!slots.some(s=>s.time_slot.startsWith('11:15 AM')))
    const id = (await query('select public.book_appointment($1,$2,$3) as id',[serviceId,future,'09:00 AM - 10:00 AM']))[0].id
    assert.equal((await query('select quote_is_estimate from public.appointments where id=$1',[id]))[0].quote_is_estimate,false)
    await assert.rejects(()=>query('select public.book_appointment($1,$2,$3)',[serviceId,future,'09:30 AM - 10:30 AM']),/no longer available/)
    await db.exec('reset role')
    await assert.rejects(()=>query(`insert into public.appointments(patient_id,service_id,appointment_date,time_slot,status,starts_at,ends_at) select patient_id,service_id,appointment_date,time_slot,status,starts_at,ends_at from public.appointments where id=$1`,[id]),/exclusion constraint/)
    await query(`insert into public.profiles(id,role,is_active) values ('00000000-0000-0000-0000-000000000099','owner',false)`)
    const forced = (await query(`select role,is_active from public.profiles where id='00000000-0000-0000-0000-000000000099'`))[0]
    assert.equal(forced.role,'client'); assert.equal(forced.is_active,true)
    await asUser(1)
    await assert.rejects(()=>query(`update public.profiles set role='owner' where id=auth.uid()`),/authorized management/)
    await assert.rejects(()=>query(`update public.appointments set status='confirmed' where id=$1`,[id]),/permission denied/)
    await asUser(2)
    assert.equal((await query('select * from public.appointments')).length,0)
    assert.equal((await query('select * from public.profiles')).length,1)
    assert(!(await query('select * from public.available_slots($1,$2)',[future,serviceId])).some(s=>s.time_slot.startsWith('09:00 AM')))
    await assert.rejects(()=>query('select public.change_appointment($1,$2,$3,$4)',[id,'request_cancellation',1,'Cannot attend']),/not available/)
    await asUser(1)
    await query('select public.change_appointment($1,$2,$3,$4)',[id,'request_cancellation',1,'Cannot attend'])
    await asUser(3)
    await query('select public.change_appointment($1,$2,$3,$4)',[id,'reject_cancellation',2,'Please contact us'])
    assert.equal((await query('select status from public.appointments where id=$1',[id]))[0].status,'pending')
    await assert.rejects(()=>query('select public.change_appointment($1,$2,$3,$4)',[id,'confirmed',1,'Confirmed']),/changed/)
    await query('select public.change_appointment($1,$2,$3,$4)',[id,'confirmed',3,'Confirmed'])
    await assert.rejects(()=>query('select public.change_appointment($1,$2,$3,$4)',[id,'completed',4,'Completed']),/have started/)
    await query('select public.reschedule_appointment($1,$2,$3,$4,$5)',[id,4,'Patient requested change',future,'10:00 AM - 11:00 AM'])
    await assert.rejects(()=>query('select public.set_clinic_closure($1,$2,$3)',[future,'Holiday',true]),/existing appointments/)
    await query('update public.services set price=900,is_active=false where id=$1',[serviceId])
    assert.equal((await query('select quoted_price from public.appointments where id=$1',[id]))[0].quoted_price,'500')
    await assert.rejects(()=>query('select public.book_appointment($1,$2,$3)',[serviceId,future,'11:00 AM - 12:00 PM']),/no longer available/)
    await query('select public.change_appointment($1,$2,$3,$4)',[id,'cancelled',5,'Clinic cancelled'])
    await assert.rejects(()=>query('select public.change_appointment($1,$2,$3,$4)',[id,'confirmed',6,'Reopen']),/future pending/)
    await query('select public.set_clinic_closure($1,$2,$3)',[future,'Holiday',true])
    await asUser(4)
    await assert.rejects(()=>query(`update public.profiles set role='owner' where id='00000000-0000-0000-0000-000000000002'`),/Only an owner/)
    await asUser(5)
    await assert.rejects(()=>query(`update public.profiles set is_active=false where id=auth.uid()`),/own role/)
    await query(`update public.profiles set is_active=false where id='00000000-0000-0000-0000-000000000001'`)
    await asUser(1)
    assert.equal((await query('select * from public.appointments')).length,0)
    await assert.rejects(()=>query(`insert into storage.objects(bucket_id,name) values('avatars','00000000-0000-0000-0000-000000000001-inactive.jpg')`),/row-level security/)
    await assert.rejects(()=>query('select * from public.available_slots($1,$2)',[future,serviceId]),/active account/)
    await asUser(2)
    assert.equal((await query('select * from public.appointment_events')).length,0)
  } finally { await db.close() }
})
