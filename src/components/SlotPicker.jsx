import { useCallback, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useQuery } from '../hooks/useQuery'
import { result } from '../lib/data'
import { clinicDate } from '../lib/appointments'
import Feedback from './Feedback'
import { CalendarDays, Clock, RefreshCw } from 'lucide-react'
import AvailabilityCalendar from './AvailabilityCalendar'
import { visitDateLabel } from '../lib/presentation'

export default function SlotPicker({ serviceId, excludeId = null, value, onChange, duration, calendarSettings }) {
  const [date, setDate] = useState(value?.appointment_date || '')
  const loader = useCallback(async () => {
    if (!date || !serviceId) return []
    return result(supabase.rpc('available_slots', { p_date: date, p_service_id: String(serviceId), p_exclude_id: excludeId ? String(excludeId) : null }))
  }, [date, serviceId, excludeId])
  const { data: slots, error, loading, refresh } = useQuery(loader, [], 30000)
  // Never retain a selection that a refresh reports as unavailable.
  const valid = !error && !loading && slots.some(slot => slot.time_slot === value?.time_slot && slot.appointment_date === date)
  return <div className="slot-picker space-y-4">
    {calendarSettings ? <AvailabilityCalendar serviceId={serviceId} settings={calendarSettings} date={date} onSelect={day => { setDate(day); onChange(null); refresh() }}/> : <label className="block text-sm font-semibold"><span className="flex items-center gap-2 mb-2"><CalendarDays size={17}/> Pick your date <span className="slot-timezone">Philippine time</span></span>
      <input type="date" min={clinicDate()} required value={date} onChange={e => { setDate(e.target.value); onChange(null) }} className="block w-full border border-slate-300 rounded-lg p-3 mt-1" />
    </label>}
    {calendarSettings && date && <h3 className="calendar-selected-date">{visitDateLabel(date)} <span>Philippine time</span></h3>}
    <Feedback error={error} onRetry={refresh} />
    {!date && <div className="date-placeholder"><CalendarDays size={28} strokeWidth={1.3}/><p>A date that works for you.</p><span>Choose a day to explore available times.</span></div>}
    {date && duration && <div className="slot-intro"><Clock size={16}/><span>{duration}-minute appointment · Full time ranges shown below</span></div>}
    {date && !error && <div className="time-slot-grid">
      {slots.filter(slot => slot.appointment_date === date).map(slot => <button key={slot.time_slot} type="button" aria-pressed={value?.time_slot === slot.time_slot && value?.appointment_date === date} onClick={() => onChange(slot)} className={`time-slot ${value?.time_slot === slot.time_slot && value?.appointment_date === date ? 'selected' : ''}`}>{slot.time_slot}</button>)}
      {!slots.some(slot => slot.appointment_date === date) && <p className="slot-empty text-sm">{loading ? 'Loading availability...' : 'No available times. Choose another date or refresh.'}</p>}
    </div>}
    {value && !loading && !valid && <p role="alert" className="text-sm text-red-700">This time is no longer available. Select another time.</p>}
    <input aria-label="Available appointment time" className="sr-only" tabIndex={-1} required value={valid ? value?.time_slot || '' : ''} onChange={() => {}} />
    <button type="button" className="text-link" onClick={refresh}><RefreshCw size={14}/> Refresh availability</button>
  </div>
}
