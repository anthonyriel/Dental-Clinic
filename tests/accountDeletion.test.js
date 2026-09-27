import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('deactivated accounts restore normally; permanent deletion is authorized, isolated and retryable',async()=>{
  const db=new PGlite()
  const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0')
  const query=async(sql,args=[]) => (await db.query(sql,args)).rows
  const asUser=async n=>db.exec(`reset role; set request.jwt.claim.sub='${id(n)}'; set role authenticated`)
  const asServer=()=>db.exec("reset role; set request.jwt.claim.sub=''")
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`)
    await db.exec(await readFile(new URL('./fixtures/current-schema.sql',import.meta.url),'utf8'))
    await db.exec(`alter table auth.users add column email text;
      create schema storage; create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text);
      insert into auth.users(id,email) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'account'||n||'@example.test' from generate_series(1,6)n;
      insert into profiles(id,full_name,role) select id,'Person '||right(id::text,1),case right(id::text,1) when '1' then 'admin' when '3' then 'staff' when '4' then 'admin' when '5' then 'owner' when '6' then 'owner' else 'client' end from auth.users;
      insert into services(name,price) values('Cleaning',500);`)
    for(const file of ['202609080001_functionality.sql','202609090001_walk_ins.sql','202609100001_multiple_services.sql','202609100002_early_completion.sql','202609100003_service_payments.sql','202609100004_legacy_single_service_payments.sql','202609270001_client_records.sql','202609270002_account_deletion.sql']) {
      await db.exec((await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replaceAll('now()',"timestamptz '2030-01-07 02:00:00+00'"))
    }
    await db.exec((await readFile(new URL('../supabase/migrations/202609280001_walk_in_record_deletion.sql',import.meta.url),'utf8')).replaceAll('now()',"timestamptz '2030-01-07 02:00:00+00'"))
    await db.exec((await readFile(new URL('../supabase/migrations/202609280002_flow_checks.sql',import.meta.url),'utf8')).replaceAll('now()',"timestamptz '2030-01-07 02:00:00+00'"))
    const service=(await query('select id from services'))[0].id
    await asUser(1)
    const client=(await query('select id from client_records where profile_id=$1',[id(2)]))[0].id
    await assert.rejects(()=>query('select set_client_record_active($1,1,false)',[client]),/People & access/)
    await assert.rejects(()=>query("select delete_client_record($1,1,'DELETE')",[client]),/People & access/)
    const other=(await query('select save_client_record(null,null,$1,null,null,null) id',['Other client']))[0].id
    const book=async(cid,time,request)=>(await query('select book_staff_appointment($1,$2,$3,$4,$5,$6) id',[cid,[service],'2030-01-08',time,'call',id(request)]))[0].id
    const visit=await book(client,'09:00 AM - 10:00 AM',101)
    const retained=await book(other,'10:00 AM - 11:00 AM',102)
    await asUser(2)
    const onlineArgs=[[service],'2030-01-09','09:00 AM - 10:00 AM',id(200)]
    const online=async(args=onlineArgs)=>query('select book_patient_appointment($1,$2,$3,$4) id',args)
    const onlineId=(await online())[0].id
    assert.equal((await online())[0].id,onlineId)
    await assert.rejects(()=>online([[service],'2030-01-10','09:00 AM - 10:00 AM',id(200)]),/another booking/)
    await asUser(3)
    await assert.rejects(()=>online(),/another booking/)
    await assert.rejects(()=>query('select delete_closed_appointment($1,1)',[retained]),/Administrator/)
    await asUser(1)
    await assert.rejects(()=>query('select delete_closed_appointment($1,1)',[retained]),/Only cancelled/)
    const closed=await book(other,'01:30 PM - 02:30 PM',104)
    await query('select change_appointment($1,$2,1,$3)',[closed,'cancelled','Test cancellation'])
    await assert.rejects(()=>query('select delete_closed_appointment($1,1)',[closed]),/changed/)
    await query('select delete_closed_appointment($1,2)',[closed])
    assert.equal((await query('select count(*)::int n from appointment_events where appointment_id=$1',[closed]))[0].n,0)
    assert.equal((await query('select count(*)::int n from appointment_services where appointment_id=$1',[closed]))[0].n,0)
    const prepare=()=>query('select prepare_account_deletion($1) data',[id(2)])
    await assert.rejects(prepare,/Deactivate/)
    await assert.rejects(()=>query('select prepare_account_deletion($1)',[id(1)]),/own account/)
    await query('update profiles set is_active=false where id=$1',[id(2)])
    await query('update profiles set is_active=true where id=$1',[id(2)])
    assert.equal((await query('select count(*)::int n from appointments where id=$1',[visit]))[0].n,1)
    await query('update profiles set is_active=false where id=$1',[id(2)])
    await asUser(2);await assert.rejects(prepare,/Administrator/)
    await asUser(3);await assert.rejects(prepare,/Administrator/)
    await asUser(5)
    await query('update profiles set is_active=false where id=$1',[id(4)])
    await query('update profiles set is_active=false where id=$1',[id(6)])
    await asUser(1)
    for(const n of [4,6]) await assert.rejects(()=>query('select prepare_account_deletion($1)',[id(n)]),/Only an owner/)
    await asServer()
    await assert.rejects(()=>query('delete from auth.users where id=$1',[id(2)]),/permanent deletion action/)
    await query('insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)',['clinic-files','keep.jpg',id(2)])
    await asUser(1);await assert.rejects(prepare,/other clinic files/)
    assert.equal((await query('select deletion_pending from profiles where id=$1',[id(2)]))[0].deletion_pending,false)
    await asServer()
    await query('delete from storage.objects where owner_id=$1',[id(2)])
    await query('insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)',['avatars',id(2)+'-photo.jpg',id(2)])
    await asUser(1)
    assert.deepEqual((await prepare())[0].data.avatar_paths,[id(2)+'-photo.jpg'])
    assert.deepEqual((await prepare())[0].data.avatar_paths,[id(2)+'-photo.jpg'])
    await assert.rejects(()=>query('update profiles set is_active=true where id=$1',[id(2)]),/cannot be restored/)
    await assert.rejects(()=>query('update profiles set full_name=$1 where id=$2',['Changed',id(2)]),/cannot be restored/)
    await asServer()
    await assert.rejects(()=>query('delete from auth.users where id=$1',[id(2)]),/Storage API/)
    assert.equal((await query('select count(*)::int n from appointments where id=$1',[visit]))[0].n,1)
    await query('delete from storage.objects where owner_id=$1',[id(2)]) // simulate successful Storage API cleanup
    await db.exec('create table deletion_blocker(user_id uuid references auth.users(id) on delete restrict)')
    await query('insert into deletion_blocker values($1)',[id(2)])
    await assert.rejects(()=>query('delete from auth.users where id=$1',[id(2)]),/foreign key/)
    assert.equal((await query('select count(*)::int n from appointments where id=$1',[visit]))[0].n,1)
    assert.equal((await query('select count(*)::int n from appointment_services where appointment_id=$1',[visit]))[0].n,1)
    await db.exec('drop table deletion_blocker')
    await query('delete from auth.users where id=$1',[id(2)]) // simulate Auth Admin hard deletion
    for(const [table,column,value] of [['auth.users','id',id(2)],['profiles','id',id(2)],['client_records','id',client],['appointments','id',visit],['appointment_services','appointment_id',visit],['appointment_events','appointment_id',visit],['clinic_private.account_deletions','user_id',id(2)]]) {
      assert.equal((await query(`select count(*)::int n from ${table} where ${column}=$1`,[value]))[0].n,0,table)
    }
    assert.equal((await query('select count(*)::int n from appointments where id=$1',[retained]))[0].n,1)
    assert.equal((await query('select count(*)::int n from appointment_services where appointment_id=$1',[retained]))[0].n,1)
    assert.equal((await query('select count(*)::int n from services'))[0].n,1)
    assert.equal((await query('select count(*)::int n from profiles where id=$1',[id(1)]))[0].n,1)
    await asUser(1)
    const duplicate=(await query('select save_client_record(null,null,$1,null,null,null) id',['Other client']))[0].id
    await query('select save_client_record($1,1,$2,null,$3,null)',[other,'Other client','walkin@example.test'])
    await query('select prepare_client_invitation($1)',[other])
    const deactivate=()=>query('select set_client_record_active($1,2,false)',[other])
    await asUser(3);await assert.rejects(deactivate,/Administrator/)
    await assert.rejects(()=>query("select delete_client_record($1,2,'DELETE')",[other]),/Administrator/)
    await asUser(1)
    await assert.rejects(()=>query("select delete_client_record($1,2,'DELETE')",[other]),/Deactivate/)
    await deactivate()
    await assert.rejects(()=>book(other,'01:30 PM - 02:30 PM',103),/deactivated/)
    await assert.rejects(()=>query('select prepare_client_invitation($1)',[other]),/Restore/)
    await query('select set_client_record_active($1,3,true)',[other])
    assert.equal((await query('select count(*)::int n from appointments where id=$1',[retained]))[0].n,1)
    await query('select set_client_record_active($1,4,false)',[other])
    await assert.rejects(()=>query("select delete_client_record($1,4,'DELETE')",[other]),/changed/)
    await assert.rejects(()=>query("select delete_client_record($1,5,'wrong')",[other]),/Type DELETE/)
    await query("select delete_client_record($1,5,'DELETE')",[other])
    for(const [table,column,value] of [['client_records','id',other],['appointments','id',retained],['appointment_services','appointment_id',retained],['appointment_events','appointment_id',retained]]) {
      assert.equal((await query(`select count(*)::int n from ${table} where ${column}=$1`,[value]))[0].n,0,table)
    }
    assert.equal((await query('select count(*)::int n from client_records where id=$1',[duplicate]))[0].n,1)
  } finally {await db.close()}
})
