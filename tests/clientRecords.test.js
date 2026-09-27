import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('client records: staff bookings, invitation linking, privacy and history', async()=>{
  const db=new PGlite()
  const query=async(sql,args=[]) => (await db.query(sql,args)).rows
  const asUser=async n=>db.exec(`reset role; set request.jwt.claim.sub='00000000-0000-0000-0000-${String(n).padStart(12,'0')}'; set role authenticated`)
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`)
    await db.exec(await readFile(new URL('./fixtures/current-schema.sql',import.meta.url),'utf8'))
    await db.exec(`alter table auth.users add column email text;
      insert into auth.users(id,email) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'account'||n||'@example.test' from generate_series(1,3)n;
      insert into profiles(id,full_name,role) select id,'Existing '||right(id::text,1),case right(id::text,1) when '1' then 'staff' else 'client' end from auth.users;
      insert into services(name,price) values('Cleaning',500),('Filling',800);`)
    const migrate=async(file)=>db.exec((await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replaceAll('now()',"timestamptz '2030-01-07 02:00:00+00'"))
    for(const file of ['202609080001_functionality.sql','202609090001_walk_ins.sql','202609100001_multiple_services.sql','202609100002_early_completion.sql','202609100003_service_payments.sql','202609100004_legacy_single_service_payments.sql'])await migrate(file)
    await db.exec('update services set duration_minutes=30; update clinic_settings set booking_notice_minutes=1440')
    const ids=(await query('select id from services order by name')).map(s=>s.id)
    await asUser(1)
    const legacy=(await query('select book_walk_in($1,$2,$3,$4,$5,$6) id',[ids[0],'2030-01-07','10:15 AM - 10:45 AM','Historical walk-in',null,'10000000-0000-0000-0000-000000000001']))[0].id
    await db.exec('reset role')
    await migrate('202609270001_client_records.sql')
    await asUser(1)
    assert((await query('select client_record_id from appointments where id=$1',[legacy]))[0].client_record_id)
    const save=(id=null,version=null,name='New client',phone='+63 912 345 6789',email='new@example.test')=>query('select save_client_record($1,$2,$3,$4,$5,$6) id',[id,version,name,phone,email,null])
    const cid=(await save())[0].id
    assert.equal((await save(cid))[0].id,cid)
    await assert.rejects(()=>save(cid,null,'Different client'),/different details/)
    assert.equal((await query('select phone from client_records where id=$1',[cid]))[0].phone,'09123456789')
    await save(cid,1,'Updated client')
    await assert.rejects(()=>save(cid,1,'Stale'),/changed/)
    await assert.rejects(()=>save(null,null,'Bad','1'),/valid Philippine/)
    const slots=(source,date)=>query('select * from available_staff_slots($1,$2,$3)',[date,ids,source])
    assert.equal((await slots('walk_in','2030-01-08')).length,0)
    assert((await slots('call','2030-01-07')).some(s=>s.time_slot==='01:30 PM - 02:30 PM'))
    const args=[cid,ids,'2030-01-08','09:00 AM - 10:00 AM','call','20000000-0000-0000-0000-000000000001']
    const book=values=>query('select book_staff_appointment($1,$2,$3,$4,$5,$6) id',values)
    const visit=(await book(args))[0].id
    assert.equal((await book(args))[0].id,visit)
    await assert.rejects(()=>book(args.map((v,i)=>i===4?'text':v)),/already used/)
    await assert.rejects(()=>book(args.map((v,i)=>i===5?'20000000-0000-0000-0000-000000000002':v)),/no longer available/)
    assert.equal((await query('select * from appointment_services where appointment_id=$1',[visit])).length,2)
    assert.equal((await query('select status from appointments where id=$1',[visit]))[0].status,'confirmed')
    await book([cid,ids,'2030-01-09','09:00 AM - 10:00 AM','text','20000000-0000-0000-0000-000000000003'])
    assert.equal((await query('select * from appointments where client_record_id=$1',[cid])).length,2)
    await asUser(2)
    assert.equal((await query('select * from client_records')).length,1)
    assert.equal((await query('select * from appointments where client_record_id=$1',[cid])).length,0)
    await assert.rejects(()=>save(),/Management access/)
    await assert.rejects(()=>book(args),/Management access/)
    await assert.rejects(()=>slots('text','2030-01-08'),/Management access/)
    await assert.rejects(()=>query('select prepare_client_invitation($1)',[cid]),/Management access/)
    await assert.rejects(()=>query('update client_records set full_name=$1 where id=$2',['Attack',cid]),/permission denied/)
    await asUser(1)
    const invite=(await query('select prepare_client_invitation($1) data',[cid]))[0].data
    await db.exec("reset role; set request.jwt.claim.sub=''")
    await db.exec('create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user()')
    await query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[
      '00000000-0000-0000-0000-000000000004',invite.email,JSON.stringify({full_name:invite.name,clinic_invitation_token:invite.token,role:'owner'})])
    await asUser(4)
    const records=await query('select * from client_records')
    assert.equal(records.length,1);assert.equal(records[0].id,cid)
    assert.equal((await query('select role from profiles where id=auth.uid()'))[0].role,'client')
    assert.equal((await query('select * from appointments')).length,2)
    assert.equal((await query('select * from appointment_events')).length,2)
    assert.equal((await query('select * from appointment_services')).length,4)
    assert((await query('select walk_in_name,booking_source from appointments')).every(a=>a.walk_in_name===null && ['call','text'].includes(a.booking_source)))
    await asUser(2)
    assert.equal((await query('select * from appointments where client_record_id=$1',[cid])).length,0)
    await asUser(1)
    await assert.rejects(()=>query('select prepare_client_invitation($1)',[cid]),/already has a login/)
    const sameEmail=(await save(null,null,'Collision',null,'account2@example.test'))[0].id
    await assert.rejects(()=>query('select prepare_client_invitation($1)',[sameEmail]),/already has an account/)
    await db.exec("reset role; set request.jwt.claim.sub=''")
    await query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[
      '00000000-0000-0000-0000-000000000005','other@example.test',JSON.stringify({full_name:'Other',clinic_invitation_token:invite.token})])
    await asUser(5)
    assert.equal((await query('select * from appointments')).length,0)
    assert.notEqual((await query('select id from client_records'))[0].id,cid)
    const online=(await query('select book_appointment($1::uuid[],$2::date,$3::text) id',[ids,'2030-01-10','09:00 AM - 10:00 AM']))[0].id
    const onlineVisit=(await query('select client_record_id,booking_source from appointments where id=$1',[online]))[0]
    assert.equal(onlineVisit.client_record_id,(await query('select id from client_records'))[0].id)
    assert.equal(onlineVisit.booking_source,'online')
  } finally {await db.close()}
})
