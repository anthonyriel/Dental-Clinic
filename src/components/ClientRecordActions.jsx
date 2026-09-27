import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/auth'
import { result, errorMessage } from '../lib/data'
import Feedback from './Feedback'

export default function ClientRecordActions({ record, onChanged, onDeleted }) {
  const { role } = useAuth()
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [confirming,setConfirming] = useState(false)
  const [confirmation,setConfirmation] = useState('')
  if (record.profile_id || !['admin','owner'].includes(role)) return null

  async function toggle() {
    if (busy || !window.confirm(record.is_active === false ? 'Restore this client record? Its history will remain.' : 'Deactivate this client record? History and existing appointments will remain; new bookings and invitations will be blocked.')) return
    setBusy(true);setError('')
    try {
      await result(supabase.rpc('set_client_record_active',{p_id:record.id,p_version:record.version,p_active:record.is_active === false}))
      onChanged()
    } catch (err) {setError(errorMessage(err));onChanged()}
    finally {setBusy(false)}
  }
  async function remove(e) {
    e.preventDefault()
    if (busy || confirmation !== 'DELETE') return
    setBusy(true);setError('')
    try {
      await result(supabase.rpc('delete_client_record',{p_id:record.id,p_version:record.version,p_confirmation:confirmation}))
      onDeleted()
    } catch (err) {setError(errorMessage(err));onChanged()}
    finally {setBusy(false)}
  }
  return <div className="border-t border-slate-200 pt-4 space-y-3">
    <Feedback error={error}/>
    <div className="flex flex-wrap gap-3"><button disabled={busy || confirming} className="btn btn-secondary" onClick={toggle}>{record.is_active === false ? 'Restore record' : 'Deactivate record'}</button>{record.is_active === false && <button disabled={busy} className="btn bg-red-50 text-red-700 border border-red-200" onClick={()=>{setConfirming(true);setConfirmation('');setError('')}}>Permanently delete</button>}</div>
    {confirming && <form onSubmit={remove} className="rounded-2xl border border-red-200 bg-red-50/60 p-4 space-y-3">
      <h3 className="font-bold">Delete {record.full_name} permanently?</h3>
      <p className="text-sm">This deletes this client record and all its appointments, service payments and history. Reports will change. It cannot be restored.</p>
      <p className="text-xs break-all">Record ID: {record.id}</p>
      <label className="block text-sm font-semibold">Type DELETE to confirm<input autoFocus disabled={busy} value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off" className="block w-full min-h-11 mt-2 p-3 border border-slate-300 rounded-xl bg-white"/></label>
      <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className="btn btn-secondary" onClick={()=>setConfirming(false)}>Cancel</button><button disabled={busy || confirmation !== 'DELETE'} className="btn bg-red-700 text-white">{busy ? 'Deleting…' : 'Permanently delete record'}</button></div>
    </form>}
  </div>
}
