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

  return (
    <section className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 text-left select-none" aria-label="Appointment date availability">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 aria-live="polite" className="font-bold text-lg text-slate-900 font-mono">{title}</h3>
        <div className="flex items-center gap-1.5">
          <button 
            type="button" 
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs" 
            aria-label="Previous month" 
            disabled={month <= today.slice(0, 7)} 
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft size={18}/>
          </button>
          <button 
            type="button" 
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs" 
            aria-label="Next month" 
            disabled={month >= lastDate.slice(0, 7)} 
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider font-mono" aria-hidden="true">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <span key={day} className="py-1">{day}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({length:offset}, (_,i) => <span key={`blank-${i}`} aria-hidden="true"/>)}
        {days.map(day => {
          const state = calendarDayState(day, today, settings)
          const count = data[day]
          const status = state !== 'check' ? state : count == null ? (loading ? 'loading' : 'unknown') : count > 0 ? 'available' : 'unavailable'
          const label = {past:'Past',later:'Not open',closed:'Closed',loading:'…',unknown:'Retry',available:'Open',unavailable:'No slots'}[status]
          const isSelected = date === day

          let btnStyles = "aspect-square p-1 rounded-2xl flex flex-col items-center justify-center text-xs transition-all border font-mono shadow-2xs "
          if (isSelected) {
            btnStyles += "bg-[#67c4c7] text-white border-[#67c4c7] shadow-md ring-2 ring-[#67c4c7]/30 font-bold"
          } else if (status === 'available') {
            btnStyles += "bg-white hover:bg-[#67c4c7]/10 text-slate-900 border-slate-200 hover:border-[#67c4c7]/40 font-semibold cursor-pointer"
          } else {
            btnStyles += "bg-slate-50/50 text-slate-400 border-slate-100 opacity-50 cursor-not-allowed"
          }

          return (
            <button 
              key={day} 
              type="button" 
              className={btnStyles} 
              disabled={state !== 'check' || status === 'loading'} 
              aria-pressed={isSelected} 
              aria-current={day === today ? 'date' : undefined} 
              aria-label={`${day}: ${status === 'available' ? `${count} available start times` : label}`} 
              onClick={() => onSelect(day)}
            >
              <strong className="text-sm">{Number(day.slice(-2))}</strong>
              <span className={`text-[9px] uppercase tracking-wider font-sans ${isSelected ? 'text-white/90 font-bold' : 'text-slate-500'}`}>{label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#67c4c7] border border-[#67c4c7]/30"/>Available</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"/>No available times</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"/>Closed / not open</span>
      </div>

      <p className="text-xs text-slate-500 font-normal leading-relaxed">
        Availability is for your selected service. “No slots” can mean fully booked, a clinic closure, or no remaining times that fit. Select a date to check its latest times.
      </p>

      {loading && <p role="status" className="text-xs font-bold text-[#67c4c7] animate-pulse">Checking this month’s availability…</p>}

      <Feedback error={failed ? 'Some dates could not be checked. Select a date to retry, or refresh the calendar.' : ''}/>

      <div className="pt-2">
        <button 
          type="button" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#67c4c7] hover:underline" 
          onClick={refresh}
        >
          <RefreshCw size={14}/> Refresh calendar
        </button>
      </div>
    </section>
  )
}