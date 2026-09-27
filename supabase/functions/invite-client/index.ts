import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

// Deploy in Supabase; never put the service role key in Vite/browser configuration.
Deno.serve(async (request: Request) => {
  const appUrl = Deno.env.get('APP_URL')?.replace(/\/$/,'')
  const origin = request.headers.get('Origin') || ''
  const allowed = [appUrl, ...(Deno.env.get('ALLOWED_ORIGINS') || '').split(',')].filter(Boolean)
  const headers = {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (appUrl || ''),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  }
  const reply = (status: number, body: object) => new Response(JSON.stringify(body),{status,headers})
  if (origin && !allowed.includes(origin)) return reply(403,{error:'Origin not allowed.'})
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers})
  if (request.method !== 'POST') return reply(405,{error:'POST required.'})
  if (!appUrl) return reply(503,{error:'The clinic invitation service needs its APP_URL configured.'})
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const key = Deno.env.get('SUPABASE_ANON_KEY')!
    const authorization = request.headers.get('Authorization') || ''
    const caller = createClient(url,key,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}})
    const {data:identity,error:identityError} = await caller.auth.getUser()
    if (identityError || !identity.user) return reply(401,{error:'Sign in again to continue.'})
    const {client_id} = await request.json()
    if (typeof client_id!=='string' || !/^[0-9a-f-]{36}$/i.test(client_id)) return reply(400,{error:'Select a valid client record.'})
    // RPC checks active staff/admin/owner status and refuses existing-account/email collisions.
    const {data:invite,error:prepareError} = await caller.rpc('prepare_client_invitation',{p_client_id:client_id})
    if (prepareError) return reply(400,{error:prepareError.message})
    const admin = createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
    const {error} = await admin.auth.admin.inviteUserByEmail(invite.email,{
      redirectTo:appUrl+'/reset-password',
      data:{full_name:invite.name,phone:invite.phone,clinic_invitation_token:invite.token},
    })
    if (error) return reply(400,{error:error.message})
    return reply(200,{message:'Account invitation sent. The client can set their own password using the email link.'})
  } catch {
    return reply(500,{error:'The invitation result could not be confirmed. Refresh the client record before trying again.'})
  }
})
