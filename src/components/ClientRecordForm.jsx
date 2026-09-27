import { useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { result, errorMessage } from '../lib/data'
import { clinicDate } from '../lib/appointments'
import Feedback from './Feedback'

export default function ClientRecordForm({ record, onSaved, onCancel }) {
  const [form,setForm] = useState({name:record?.full_name || '',phone:record?.phone || '',email:record?.email || '',birthdate:record?.birthdate || ''})
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const newId = useRef(crypto.randomUUID())
  async function save(e) {
    e.preventDefault(); if(busy)return
    setBusy(true);setError('')
    try {
      const id = await result(supabase.rpc('save_client_record',{p_id:record?.id || newId.current,p_version:record?.version || null,p_name:form.name,p_phone:form.phone,p_email:form.email,p_birthdate:form.birthdate || null}))
      onSaved(id)
    } catch(err){setError(errorMessage(err))} finally{setBusy(false)}
  }
  return <form onSubmit={save} className="glass-panel p-5 sm:p-7 space-y-4">
    <h2 className="text-xl font-bold">{record?'Edit client record':'New client record'}</h2>
    <p className="text-sm text-slate-600">A clinic record does not require a login. Check for an existing record before adding someone again.</p>
    <Feedback error={error}/>
    <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-4 min-w-0">
      { [['name','Full name','text'],['phone','Mobile number (optional)','tel'],['email','Email for invitation (optional)','email'],['birthdate','Birthdate (optional)','date']].map(([field,label,type])=><label key={field} className="text-sm font-semibold">{label}<input required={field==='name'} maxLength={field==='name'?120:254} max={field==='birthdate'?clinicDate():undefined} type={type} value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})} className="mt-2 block w-full min-w-0 min-h-11 border border-slate-300 rounded-xl p-3 bg-white/80"/></label>)}
    </fieldset>
    {record?.profile_id && <p className="text-xs text-slate-600">Contact details here belong to the clinic record. Editing the email does not change the client's sign-in email.</p>}
    <div className="flex gap-3"><button disabled={busy} className="btn btn-primary">{busy?'Saving…':'Save record'}</button><button type="button" disabled={busy} onClick={onCancel} className="btn btn-secondary">Cancel</button></div>
  </form>
}
