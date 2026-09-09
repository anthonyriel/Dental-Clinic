import { useState, useRef } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadServices } from '../../lib/queries'
import { result, updateOne, errorMessage } from '../../lib/data'
import Feedback from '../../components/Feedback'
import { Edit3, Archive, RotateCcw, Clock, Tag } from 'lucide-react'

const emptyForm = { name: '', description: '', price: '', duration_minutes: 60 }

export default function ServicesManagement() {
  const services = useQuery(loadServices, [])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  
  const formRef = useRef(null)

  async function save(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const changes = { 
        name: form.name.trim(), 
        description: form.description.trim(), 
        price: Number(form.price), 
        duration_minutes: Number(form.duration_minutes) 
      }
      if (!changes.name || !changes.description) throw new Error('Name and description cannot be blank.')
      if (editing) await updateOne('services', editing, changes)
      else await result(supabase.from('services').insert(changes).select().single())
      services.refresh(); setEditing(null); setForm(emptyForm)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  async function toggle(service) {
    if (busy || !window.confirm(service.is_active === false ? 'Make this service available for booking?' : 'Archive this service? Existing appointments will remain unchanged.')) return
    setBusy(true); setError('')
    try { 
      await updateOne('services', service.id, { is_active: service.is_active === false })
      services.refresh() 
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  function handleStartEdit(service) {
    setEditing(service.id)
    setForm({ ...emptyForm, ...service })
    setError('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC CATALOG</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Services Management</h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">Configure treatment offerings, pricing estimates, and active booking availability.</p>
        </div>
      </div>

      <Feedback error={error || services.error} onRetry={() => { setError(''); services.refresh() }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <form ref={formRef} onSubmit={save} className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#67c4c7]" /> {editing ? 'Edit Service' : 'Add New Service'}
            </h2>
            {editing && (
              <span className="text-xs font-bold px-2.5 py-1 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full border border-[#67c4c7]/20">
                Editing Mode
              </span>
            )}
          </div>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
            Service Name <span className="text-red-500">*</span>
            <input 
              required 
              maxLength={200} 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              placeholder="e.g., Dental Consultation" 
              className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 transition" 
            />
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
            Description <span className="text-red-500">*</span>
            <textarea 
              required 
              maxLength={2000} 
              rows={4}
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              placeholder="Detailed overview of the procedure..." 
              className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 resize-none transition" 
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
              Starting Price (₱) <span className="text-red-500">*</span>
              <input 
                required 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.price} 
                onChange={e => setForm({ ...form, price: e.target.value })} 
                placeholder="500" 
                className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 font-mono transition" 
              />
            </label>

            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
              Duration (mins) <span className="text-red-500">*</span>
              <input 
                required 
                type="number" 
                min="15" 
                max="240" 
                step="15" 
                value={form.duration_minutes} 
                onChange={e => setForm({ ...form, duration_minutes: e.target.value })} 
                placeholder="60" 
                className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 font-mono transition" 
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              disabled={busy} 
              className="flex-1 py-3 bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold rounded-xl transition shadow-md text-sm disabled:opacity-50"
            >
              {busy ? 'Saving...' : editing ? 'Update Service' : 'Save Service'}
            </button>
            {editing && (
              <button 
                type="button" 
                disabled={busy} 
                onClick={() => { setEditing(null); setForm(emptyForm); setError('') }} 
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {services.loading ? (
            <p className="text-sm text-slate-500 font-normal py-8 text-center">Loading services...</p>
          ) : !services.error && (
            services.data.map(service => (
              <article key={service.id} className={`bg-white/90 backdrop-blur-md border rounded-3xl p-6 space-y-3 shadow-sm transition ${service.is_active === false ? 'opacity-60 border-slate-200 bg-slate-50/50' : 'border-slate-200/90 hover:border-[#67c4c7]/50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      {service.name} 
                      {service.is_active === false && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">Archived</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-3">
                      <span className="font-bold text-slate-700">₱{Number(service.price).toLocaleString()}</span> 
                      <span>·</span>
                      <span className="inline-flex items-center gap-1"><Clock size={13}/> {service.duration_minutes || 60} minutes</span>
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 font-normal leading-relaxed">{service.description}</p>

                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <button 
                    disabled={busy} 
                    onClick={() => handleStartEdit(service)} 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#67c4c7] hover:underline"
                  >
                    <Edit3 size={15}/> Edit Details
                  </button>
                  <button 
                    disabled={busy} 
                    onClick={() => toggle(service)} 
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${service.is_active === false ? 'text-emerald-600 hover:underline' : 'text-red-600 hover:underline'}`}
                  >
                    {service.is_active === false ? <><RotateCcw size={15}/> Restore Service</> : <><Archive size={15}/> Archive Service</>}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}