import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { result } from '../lib/data'
import { clinicDate } from '../lib/appointments'
import { addDays, calendarDayState, monthDays, shiftMonth } from '../lib/calendar'
import { useQuery } from '../hooks/useQuery'
import Feedback from './Feedback'

async function loadMonthAvailability(month, today, settings, serviceId) {
    const dates = monthDays(month).days.filter(day => calendarDayState(day, today, settings) === 'check')
    const counts = {}
    // Limit concurrent requests to the existing privacy-safe availability RPC.
    let index = 0
    await Promise.all(Array.from({ length: Math.min(4, dates.length) }, async () => {
      while (index < dates.length) {
        const day = dates[index++]
        try {
          const slots = await result(supabase.rpc('available_slots', { p_date: day, p_service_id: String(serviceId), p_exclude_id: null }))
          counts[day] = slots.length
        } catch { counts[day] = null }
      }
    }))
    return counts
}

export default function AvailabilityCalendar({ serviceId, settings, date, onSelect }) {
  const today = String(clinicDate())
  const lastDate = addDays(today, settings.booking_horizon_days)
  const [month, setMonth] = useState((date || today).slice(0, 7))
  const { days, offset } = monthDays(month)
  const loader = useCallback(async () => {
    return loadMonthAvailability(month, today, settings, serviceId)
  }, [month, today, settings, serviceId])
  const { data, loading, refresh } = useQuery(loader, {}, 60000)
  const failed = Object.values(data).some(count => count === null)
  const title = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`))
  return <section className="availability-calendar" aria-label="Appointment date availability">
    <div className="calendar-heading"><h3 aria-live="polite">{title}</h3><div><button type="button" className="icon-button" aria-label="Previous month" disabled={month <= today.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={19}/></button><button type="button" className="icon-button" aria-label="Next month" disabled={month >= lastDate.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={19}/></button></div></div>
    <div className="calendar-weekdays" aria-hidden="true">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-days">{Array.from({length:offset}, (_,i) => <span key={`blank-${i}`} aria-hidden="true"/>)}{days.map(day => {
      const state = calendarDayState(day, today, settings)
      const count = data[day]
      const status = state !== 'check' ? state : count == null ? (loading ? 'loading' : 'unknown') : count > 0 ? 'available' : 'unavailable'
      const label = {past:'Past',later:'Not open',closed:'Closed',loading:'…',unknown:'Retry',available:'Open',unavailable:'No slots'}[status]
      return <button key={day} type="button" className={`calendar-day ${status} ${date === day ? 'selected' : ''}`} disabled={state !== 'check' || status === 'loading'} aria-pressed={date === day} aria-current={day === today ? 'date' : undefined} aria-label={`${day}: ${status === 'available' ? `${count} available start times` : label}`} onClick={() => onSelect(day)}><strong>{Number(day.slice(-2))}</strong><span>{label}</span></button>
    })}</div>
    <div className="calendar-legend"><span><i className="available"/>Available</span><span><i className="unavailable"/>No available times</span><span><i className="closed"/>Closed / not open</span></div>
    <p className="calendar-hint">Availability is for your selected service. “No slots” can mean fully booked, a clinic closure, or no remaining times that fit. Select a date to check its latest times.</p>
    {loading && <p role="status" className="calendar-hint">Checking this month’s availability…</p>}
    <Feedback error={failed ? 'Some dates could not be checked. Select a date to retry, or refresh the calendar.' : ''}/>
    <button type="button" className="text-link" onClick={refresh}><RefreshCw size={14}/> Refresh calendar</button>
  </section>
}


