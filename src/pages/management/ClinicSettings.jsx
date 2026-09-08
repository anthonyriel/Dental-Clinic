import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadSettings } from '../../lib/queries'
import { result, errorMessage } from '../../lib/data'
import { clinicDate } from '../../lib/appointments'
import Feedback from '../../components/Feedback'

const loadClosures = () => result(supabase.from('clinic_closures').select('*').order('closure_date'))
export default function ClinicSettings() {
  const settings = useQuery(loadSettings)
  const closures = useQuery(loadClosures, [])
  const [draft, setDraft] = useState(null)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const form = draft || settings.data
  async function save(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await result(supabase.rpc('save_clinic_settings', { p_settings: form })); setMessage('Settings saved. Existing appointments remain reserved; review the schedule if opening hours changed.'); settings.refresh(); setDraft(null) }
    catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  async function closeDate(closed, closureDate = date) {
    setBusy(true); setError(''); setMessage('')
    try {
      await result(supabase.rpc('set_clinic_closure', { p_date: closureDate, p_reason: reason.trim(), p_closed: closed }))
      closures.refresh(); setDate(''); setReason(''); setMessage(closed ? 'Date closed for bookings.' : 'Date reopened.')
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return <div className="space-y-6 max-w-3xl"><h1 className="text-3xl font-bold">Clinic Availability</h1>
    <p className="text-sm">One patient at a time. Available start times are offered every 15 minutes and must fit the service duration.</p>
    <Feedback error={error || settings.error || closures.error} message={message} onRetry={() => { setError(''); settings.refresh(); closures.refresh() }} />
    {form && <form onSubmit={save} className="bg-white p-6 rounded-xl border space-y-4">
      <div className="flex gap-4 flex-wrap">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day,i) => <label key={day}><input type="checkbox" checked={form.opening_days.includes(i)} onChange={e => setDraft({ ...form, opening_days: e.target.checked ? [...form.opening_days,i] : form.opening_days.filter(d => d!==i) })} /> {day}</label>)}</div>
      <div className="grid sm:grid-cols-2 gap-4">{[['morning_start','Morning opens'],['morning_end','Morning closes'],['afternoon_start','Afternoon opens'],['afternoon_end','Afternoon closes']].map(([key,label]) => <label key={key}>{label}<input type="time" required value={form[key]} onChange={e => setDraft({ ...form,[key]:e.target.value })} className="border rounded block p-2 w-full" /></label>)}</div>
      {[['cancellation_hours','Online cancellation notice (hours)',0,8760],['booking_notice_minutes','Minimum booking notice (minutes)',0,43200],['booking_horizon_days','Book up to this many days ahead',1,730]].map(([key,label,min,max]) => <label key={key} className="block">{label}<input type="number" required min={min} max={max} value={form[key]} onChange={e => setDraft({ ...form,[key]:e.target.value })} className="block border rounded p-2" /></label>)}
      <button disabled={busy} className="bg-sky-600 text-white p-3 rounded-lg">Save settings</button>
    </form>}
    <form onSubmit={e => { e.preventDefault(); closeDate(true) }} className="bg-white p-6 rounded-xl border space-y-3"><h2 className="font-bold">Close a date for a holiday or absence</h2><p className="text-sm">Dates with active appointments must be cleared through rescheduling or cancellation first.</p>
      <label className="block">Date<input type="date" min={clinicDate()} required value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded block" /></label><label className="block">Reason<input required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} className="border p-2 rounded block w-full" /></label><button disabled={busy} className="border p-2 rounded">Close date</button>
    </form>
    {closures.data.map(c => <div key={c.closure_date} className="flex justify-between border rounded p-3"><span>{c.closure_date}: {c.reason}</span><button disabled={busy} onClick={() => closeDate(false,c.closure_date)} className="underline">Reopen</button></div>)}
  </div>
}

