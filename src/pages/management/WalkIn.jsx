import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadServices } from '../../lib/queries'
import { result, errorMessage } from '../../lib/data'
import { normalizeMobile, formatMobile } from '../../lib/phone'
import { priceLabel, visitDateLabel } from '../../lib/presentation'
import SlotPicker from '../../components/SlotPicker'
import Feedback from '../../components/Feedback'

export default function WalkIn() {
  const services = useQuery(loadServices, [])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [slot, setSlot] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [locked, setLocked] = useState(false)
  const flight = useRef(false)
  const requestId = useRef(null)
  const payload = useRef(null)
  const service = services.data.find(item => String(item.id) === serviceId && item.is_active !== false)
  async function submit(e) {
    e.preventDefault()
    if (flight.current) return
    const normalized = phone.trim() ? normalizeMobile(phone) : null
    if (!name.trim() || (phone.trim() && !normalized)) { setError('Enter a patient name and a valid mobile number, or leave the phone blank.'); return }
    if (!payload.current && (!service || !slot)) { setError('Choose a service and an available time.'); return }
    flight.current = true; setBusy(true); setError('')
    requestId.current ||= crypto.randomUUID()
    payload.current ||= { p_service_id: serviceId, p_date: slot.appointment_date, p_time_slot: slot.time_slot, p_name: name.trim(), p_phone: normalized, p_request_id: requestId.current }
    setLocked(true)
    try {
      await result(supabase.rpc('book_walk_in', payload.current))
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
      // A SQL error rolls back the whole request. Network failures may have committed;
      // keep the same payload and request ID so retrying cannot create a duplicate.
      if (/^[A-Z0-9]{5}$/.test(err.code || '') || ['PGRST202','PGRST205'].includes(err.code)) {
        requestId.current = null; payload.current = null; setLocked(false); setSlot(null)
      }
    } finally { flight.current = false; setBusy(false) }
  }
  function reset() {
    setName(''); setPhone(''); setServiceId(''); setSlot(null); setDone(false); setError(''); setLocked(false); requestId.current = null; payload.current = null
  }
  return <div className="max-w-3xl mx-auto space-y-6 pb-12">
    <div><span className="eyebrow">FRONT DESK</span><h1 className="text-3xl font-extrabold mt-2">Register a walk-in</h1><p className="text-sm text-slate-600 mt-2">Reserve an available time today without creating a login account. Walk-ins are confirmed immediately.</p></div>
    {done ? <section className="glass-panel p-8 space-y-5"><CheckCircle2 size={32}/><h2 className="text-xl font-bold">Walk-in registered</h2><p>{name} · {service?.name}<br/>{visitDateLabel(slot?.appointment_date)} · {slot?.time_slot}</p><div className="flex flex-wrap gap-3"><Link className="btn btn-primary" to="/management/schedule">View schedule</Link><button className="btn btn-secondary" onClick={reset}>Register another</button></div></section> :
      <form onSubmit={submit} className="glass-panel p-5 sm:p-8 space-y-6">
        <Feedback error={error || services.error} onRetry={services.refresh}/>
        <fieldset disabled={busy || locked} className="space-y-5 min-w-0">
          <label className="block text-sm font-semibold">Patient full name<input required maxLength={120} autoComplete="off" value={name} onChange={e => setName(e.target.value)} className="block w-full border rounded-xl p-3 mt-2"/></label>
          <label className="block text-sm font-semibold">Mobile number (optional)<input type="tel" autoComplete="off" value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => setPhone(formatMobile(phone))} placeholder="0912 345 6789 or +63 912 345 6789" className="block w-full border rounded-xl p-3 mt-2"/></label>
          <label className="block text-sm font-semibold">Service<select required value={serviceId} onChange={e => { setServiceId(e.target.value); setSlot(null) }} className="block w-full border rounded-xl p-3 mt-2"><option value="">{services.loading ? 'Loading services…' : 'Select a service'}</option>{services.data.filter(s => s.is_active !== false).map(s => <option key={s.id} value={s.id}>{s.name} · {s.duration_minutes} min · {priceLabel(s.price)}</option>)}</select></label>
          {service && <SlotPicker key={serviceId} serviceId={serviceId} value={slot} onChange={setSlot} duration={service.duration_minutes} walkIn/>}
          <p className="text-xs text-slate-600">Times use Philippine time and respect clinic hours, closures and existing appointments. Online advance-notice rules do not apply to walk-ins. If no time fits, arrange another visit with the patient.</p>
        </fieldset>
        {locked && !busy && <p className="text-sm text-slate-600">The result could not be confirmed. Retry this same request to check or finish registration without creating a duplicate.</p>}
        <button disabled={busy || (!locked && (!slot || !service || !!services.error))} className="btn btn-primary"><UserPlus size={18}/>{busy ? 'Registering…' : locked ? 'Retry registration' : 'Confirm walk-in'}</button>
      </form>}
  </div>
}
