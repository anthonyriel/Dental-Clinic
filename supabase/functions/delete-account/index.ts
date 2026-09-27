import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

Deno.serve(async (request: Request) => {
  const appUrl = Deno.env.get('APP_URL')?.replace(/\/$/,'')
  const origin = request.headers.get('Origin') || ''
  const allowed = [appUrl, ...(Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(value => value.trim())].filter(Boolean)
  const headers = {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (appUrl || ''),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json', 'Vary': 'Origin',
  }
  const reply = (status: number, body: object) => new Response(JSON.stringify(body),{status,headers})
  if (origin && !allowed.includes(origin)) return reply(403,{error:'Origin not allowed.'})
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers})
  if (request.method !== 'POST') return reply(405,{error:'POST required.'})
  if (!appUrl) return reply(503,{error:'Configure APP_URL before using account deletion.'})
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const caller = createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{
      global:{headers:{Authorization:request.headers.get('Authorization') || ''}},
      auth:{persistSession:false,autoRefreshToken:false},
    })
    const {data:identity,error:authError} = await caller.auth.getUser()
    if (authError || !identity.user) return reply(401,{error:'Sign in again to continue.'})
    const {user_id,confirmation} = await request.json()
    if (typeof user_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id) || confirmation !== 'DELETE') return reply(400,{error:'Choose an account and type DELETE to confirm.'})
    const {data:prepared,error} = await caller.rpc('prepare_account_deletion',{p_user_id:user_id})
    if (error) return reply(400,{error:error.message})
    const admin = createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
    for (let offset=0; offset<prepared.avatar_paths.length; offset+=100) {
      const {error:storageError} = await admin.storage.from('avatars').remove(prepared.avatar_paths.slice(offset,offset+100))
      if (storageError) return reply(400,{error:'Photo cleanup failed. The account remains deactivated. Retry permanent deletion.'})
    }
    const {error:deleteError} = await admin.auth.admin.deleteUser(user_id,false)
    if (deleteError) return reply(400,{error:'Account deletion did not complete. The account remains deactivated. Retry permanent deletion. '+deleteError.message})
    return reply(200,{message:'Account and client history permanently deleted.'})
  } catch {
    return reply(500,{error:'The deletion result could not be confirmed. Refresh the account list; retry if the account is still listed.'})
  }
})
