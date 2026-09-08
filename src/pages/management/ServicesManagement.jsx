import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadServices } from '../../lib/queries'
import { result, updateOne, errorMessage } from '../../lib/data'
import Feedback from '../../components/Feedback'
const emptyForm = { name: '', description: '', price: '', duration_minutes: 60 }
export default function ServicesManagement() {
  const services = useQuery(loadServices, [])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const changes = { name: form.name.trim(), description: form.description.trim(), price: Number(form.price), duration_minutes: Number(form.duration_minutes) }
      if (!changes.name || !changes.description) throw new Error('Name and description cannot be blank.')
      if (editing) await updateOne('services',editing,changes)
      else await result(supabase.from('services').insert(changes).select().single())
      services.refresh(); setEditing(null); setForm(emptyForm)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  async function toggle(service) {
    if (busy || !window.confirm(service.is_active === false ? 'Make this service available for booking?' : 'Archive this service? Existing appointments will remain unchanged.')) return
    setBusy(true); setError('')
    try { await updateOne('services',service.id,{is_active:service.is_active === false}); services.refresh() }
    catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Services Management</h1><Feedback error={error || services.error} onRetry={() => { setError(''); services.refresh() }} />
    <div className="grid lg:grid-cols-3 gap-6"><form onSubmit={save} className="bg-white border rounded-2xl p-6 space-y-4 h-fit"><h2 className="font-bold">{editing ? 'Edit service' : 'Add service'}</h2>
      <label className="block text-sm">Name<input required maxLength={200} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="block border rounded p-2 w-full" /></label>
      <label className="block text-sm">Description<textarea required maxLength={2000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="block border rounded p-2 w-full" /></label>
      <label className="block text-sm">Starting price (₱)<input required type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="block border rounded p-2 w-full" /></label>
      <label className="block text-sm">Duration (minutes)<input required type="number" min="15" max="240" step="15" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:e.target.value})} className="block border rounded p-2 w-full" /></label>
      <button disabled={busy} className="bg-emerald-600 text-white p-3 rounded-lg">{busy ? 'Saving...' : 'Save service'}</button>
      {editing && <button type="button" className="ml-3" disabled={busy} onClick={()=>{setEditing(null);setForm(emptyForm)}}>Cancel edit</button>}
    </form><div className="lg:col-span-2 space-y-3">{services.loading ? <p>Loading services...</p> : !services.error && services.data.map(service=><article key={service.id} className="bg-white border rounded-xl p-5 space-y-2"><h2 className="font-bold">{service.name} {service.is_active === false && '(Archived)'}</h2><p>{service.description}</p><p>₱{Number(service.price).toLocaleString()} · {service.duration_minutes || 60} minutes</p><button disabled={busy} onClick={()=>{setEditing(service.id);setForm({...emptyForm,...service});setError('')}} className="underline mr-4">Edit</button><button disabled={busy} onClick={()=>toggle(service)} className="underline">{service.is_active === false ? 'Restore' : 'Archive'}</button></article>)}</div></div>
  </div>
}

