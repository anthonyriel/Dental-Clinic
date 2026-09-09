import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { result } from '../lib/data'
import { clinicDate } from '../lib/appointments'
import { addDays, calendarDayState, monthDays, shiftMonth } from '../lib/calendar'
import { useQuery } from '../hooks/useQuery'
import Feedback from './Feedback'

async function loadMonthAvailability(month, today, settings, servicesKey, excludeId) {
    const dates = monthDays(month).days.filter(day => calendarDayState(day, today, settings) === 'check')
    const counts = {}
    let index = 0
    await Promise.all(Array.from({ length: Math.min(4, dates.length) }, async () => {
      while (index < dates.length) {
        const day = dates[index++]
        try {
          const slots = await result(supabase.rpc('available_service_slots', { p_date: day, p_service_ids: JSON.parse(servicesKey), p_exclude_id: excludeId }))
          counts[day] = slots.length
        } catch { counts[day] = null }
      }
    }))
    return counts
}

export default function AvailabilityCalendar({ serviceIds, excludeId = null, settings, date, onSelect }) {
  const servicesKey = JSON.stringify(serviceIds)
  const today = String(clinicDate())
  const lastDate = addDays(today, settings.booking_horizon_days)
  const [month, setMonth] = useState((date || today).slice(0, 7))
  const { days, offset } = monthDays(month)
  const loader = useCallback(async () => {
    return loadMonthAvailability(month, today, settings, servicesKey, excludeId)
  }, [month, today, settings, servicesKey, excludeId])
  const { data, loading, refresh } = useQuery(loader, {}, 0, { refreshOnFocus: false })
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
          
          const dotColor = status === 'available' ? 'bg-emerald-500' : 'bg-slate-300'

          const label = {past:'Past',later:'Not open',closed:'Closed',loading:'…',unknown:'Retry',available:'Open',unavailable:'No times'}[status]
          const isSelected = date === day

          let btnStyles = "py-2 px-1 min-h-[64px] rounded-2xl flex flex-col items-center justify-between transition-all border font-mono shadow-2xs "
          if (isSelected) {
            btnStyles += "bg-[#67c4c7] text-slate-900 border-[#67c4c7] shadow-md ring-2 ring-[#67c4c7]/30 font-bold"
          } else if (status === 'available') {
            btnStyles += "bg-white hover:bg-[#67c4c7]/10 text-slate-900 border-slate-200 hover:border-[#67c4c7]/40 font-semibold cursor-pointer"
          } else {
            btnStyles += "bg-slate-50/50 text-slate-400 border-slate-100 opacity-60 cursor-not-allowed"
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
              <strong className="text-sm leading-none">{Number(day.slice(-2))}</strong>
              
              {state === 'check' && status !== 'loading' && status !== 'unknown' ? (
                <span className={`w-2 h-2 rounded-full ${dotColor} my-1`} title={label} />
              ) : (
                <span className="text-[9px] text-slate-400 my-1 font-sans">·</span>
              )}

              <span className={`text-[8px] uppercase font-sans ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>Available times</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"/>No times / closed</span>
      </div>

      <p className="text-xs text-slate-500 font-normal leading-relaxed">
        Availability is for all your selected services together. No times can mean fully booked, a special closure, or no remaining times that fit. Start times can overlap and are not a count of separate appointments. Select a date to check its latest times, or refresh this calendar to update the month.
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
