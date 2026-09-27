import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

async function fixture({authenticated=true,permitted=true,storageFailure=false,authFailure=false}={}) {
  const calls=[];let handler
  const env={APP_URL:'https://clinic.example.test',SUPABASE_URL:'https://project.example.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'}
  const source=await readFile(new URL('../supabase/functions/delete-account/index.ts',import.meta.url),'utf8')
  const caller={auth:{getUser:async()=>({data:{user:authenticated?{id:'admin'}:null},error:null})},rpc:async(name,args)=>{
    calls.push({type:'prepare',name,args});return permitted?{data:{avatar_paths:['server-selected.jpg']},error:null}:{error:{message:'Not permitted'}}
  }}
  const admin={storage:{from:bucket=>({remove:async paths=>{calls.push({type:'storage',bucket,paths});return {error:storageFailure?{message:'Storage failed'}:null}}})},auth:{admin:{deleteUser:async(id,soft)=>{calls.push({type:'delete',id,soft});return {error:authFailure?{message:'Auth failed'}:null}}}}}
  vm.runInNewContext(stripTypeScriptTypes(source.replace(/^import[^\n]*\n/,'')),{Deno:{env:{get:key=>env[key]},serve:fn=>{handler=fn}},Response,createClient:(_url,key)=>key==='server'?admin:caller})
  const request=(body={},origin='https://clinic.example.test')=>new Request('https://project.example.test/functions/v1/delete-account',{method:'POST',headers:{Origin:origin,Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify({user_id:'00000000-0000-0000-0000-000000000002',confirmation:'DELETE',avatar_paths:['attacker-choice.jpg'],...body})})
  return {calls,handler,request}
}

test('account deletion requires session, permission, trusted origin and explicit confirmation',async()=>{
  for(const options of [{authenticated:false},{permitted:false}]) {
    const f=await fixture(options)
    assert((await f.handler(f.request())).status>=400)
    assert(!f.calls.some(call=>['storage','delete'].includes(call.type)))
  }
  const f=await fixture()
  assert.equal((await f.handler(f.request({},'https://other.test'))).status,403)
  assert.equal((await f.handler(f.request({confirmation:''}))).status,400)
  assert.equal((await f.handler(f.request({user_id:'bad-id'}))).status,400)
  assert.equal(f.calls.length,0)
})

test('account deletion removes only server-selected avatars before hard Auth deletion',async()=>{
  const f=await fixture()
  assert.equal((await f.handler(f.request())).status,200)
  assert.deepEqual(f.calls.map(c=>c.type),['prepare','storage','delete'])
  assert.equal(f.calls[1].bucket,'avatars')
  assert.deepEqual(f.calls[1].paths,['server-selected.jpg'])
  assert.equal(f.calls[2].id,'00000000-0000-0000-0000-000000000002')
  assert.equal(f.calls[2].soft,false)
})

test('storage failures stop account deletion; Auth failures remain visible for retry',async()=>{
  const f=await fixture({storageFailure:true})
  assert.equal((await f.handler(f.request())).status,400)
  assert(!f.calls.some(c=>c.type==='delete'))
  const g=await fixture({authFailure:true})
  const response=await g.handler(g.request())
  assert.equal(response.status,400)
  assert.match((await response.json()).error,/Retry permanent deletion/)
})
