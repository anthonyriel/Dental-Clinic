import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

async function fixture({authenticated=true,permitted=true,configured=true}={}) {
  const calls=[];let handler
  const env={APP_URL:configured?'https://clinic.example.test':undefined,SUPABASE_URL:'https://project.example.test',SUPABASE_ANON_KEY:'public-key',SUPABASE_SERVICE_ROLE_KEY:'server-key'}
  const source=await readFile(new URL('../supabase/functions/invite-client/index.ts',import.meta.url),'utf8')
  const caller={auth:{getUser:async()=>({data:{user:authenticated?{id:'staff'}:null},error:null})},rpc:async(name,args)=>{
    calls.push({type:'prepare',name,args});return permitted?{data:{email:'client@example.test',name:'Client',phone:null,token:'private-token'},error:null}:{error:{message:'Management access required.'}}
  }}
  const admin={auth:{admin:{inviteUserByEmail:async(email,options)=>{calls.push({type:'invite',email,options});return {error:null}}}}}
  vm.runInNewContext(stripTypeScriptTypes(source.replace(/^import[^\n]*\n/,'')),{
    Deno:{env:{get:key=>env[key]},serve:fn=>{handler=fn}},Response,
    createClient:(_url,key)=>key==='server-key'?admin:caller,
  })
  const request=(origin='https://clinic.example.test')=>new Request('https://project.example.test/functions/v1/invite-client',{method:'POST',headers:{Origin:origin,Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify({client_id:'00000000-0000-0000-0000-000000000001',redirectTo:'https://untrusted.test'})})
  return {handler,calls,request}
}

test('invitation endpoint validates authentication, staff access and allowed origins before sending',async()=>{
  for(const options of [{authenticated:false},{permitted:false}]){
    const f=await fixture(options);const response=await f.handler(f.request())
    assert(response.status>=400);assert(!f.calls.some(c=>c.type==='invite'))
  }
  const f=await fixture();assert.equal((await f.handler(f.request('https://untrusted.test'))).status,403)
  assert.equal(f.calls.length,0)
})
test('invitation endpoint uses the saved email and configured redirect, without returning tokens',async()=>{
  const f=await fixture();const response=await f.handler(f.request())
  assert.equal(response.status,200)
  const invite=f.calls.find(c=>c.type==='invite')
  assert.equal(invite.email,'client@example.test')
  assert.equal(invite.options.redirectTo,'https://clinic.example.test/reset-password')
  assert.equal(invite.options.data.clinic_invitation_token,'private-token')
  assert(!(await response.text()).includes('private-token'))
  const missing=await fixture({configured:false})
  assert((await missing.handler(missing.request())).status>=400)
  assert.equal(missing.calls.length,0)
})
