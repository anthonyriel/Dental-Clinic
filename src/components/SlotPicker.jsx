import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useQuery } from '../hooks/useQuery'
import { result } from '../lib/data'
import { clinicDate } from '../lib/appointments'
import Feedback from './Feedback'
import { CalendarDays, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import AvailabilityCalendar from './AvailabilityCalendar'
import { visitDateLabel } from '../lib/presentation'

export default function SlotPicker({ serviceId, serviceIds, excludeId = null, value, onChange, duration, calendarSettings, walkIn = false }) {
  const [date, setDate] = useState(value?.appointment_date || (walkIn ? clinicDate() : ''))
  
  const servicesKey = JSON.stringify(serviceIds || (serviceId ? [String(serviceId)] : []))
  const loader = useCallback(async () => {
    if (!date || (!JSON.parse(servicesKey).length && !excludeId)) return []
    return result(supabase.rpc(walkIn ? 'available_walk_in_slots' : 'available_service_slots', { p_date: date, ...(walkIn ? { p_service_id: String(serviceId) } : { p_service_ids: JSON.parse(servicesKey) }), p_exclude_id: excludeId ? String(excludeId) : null }))
  }, [date, serviceId, servicesKey, excludeId, walkIn])

  const { data: slots, error, loading, refresh } = useQuery(loader, [], date ? 10000 : 0)
  
  // The availability RPC excludes every reservation overlapping the full visit.
  // Never render retained results from a failed request as available times.
  const filteredSlots = error || loading ? [] : (slots || []).filter(slot => slot.appointment_date === date)
  const valid = value?.appointment_date === date && filteredSlots.some(slot => slot.time_slot === value?.time_slot)

  useEffect(() => {
    if (value && !loading && !error && !valid) onChange(null)
  }, [value, loading, error, valid, onChange])

  return (
    <div className="space-y-6 text-left">
      {calendarSettings ? (
        <AvailabilityCalendar 
          serviceIds={JSON.parse(servicesKey)}
          excludeId={excludeId} 
          settings={calendarSettings} 
          date={date} 
          onSelect={day => { setDate(day); onChange(null); refresh() }}
        />
      ) : (
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Pick your date <span className="text-slate-400 font-normal lowercase">(Philippine time)</span>
          </label>
          <div className="relative">
            <CalendarDays className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="date" 
              min={clinicDate()}
              max={walkIn ? clinicDate() : undefined}
              required 
              value={date} 
              onChange={e => { setDate(e.target.value); onChange(null) }} 
              className="w-full pl-11 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono" 
            />
          </div>
        </div>
      )}

      {calendarSettings && date && (
        <div className="bg-[#67c4c7]/10 border border-[#67c4c7]/20 px-4 py-3 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-bold text-[#67c4c7] uppercase tracking-wider">Selected Date</span>
          <span className="text-sm font-bold text-slate-900">{visitDateLabel(date)} <span className="text-xs text-slate-500 font-normal">(Philippine time)</span></span>
        </div>
      )}

      <Feedback error={error} onRetry={refresh} />

      {!date && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
          <CalendarDays size={32} className="mx-auto text-slate-400" strokeWidth={1.5}/>
          <p className="text-sm font-bold text-slate-900">A date that works for you.</p>
          <p className="text-xs text-slate-500 font-normal">Choose a day to explore available times.</p>
        </div>
      )}

      {date && duration && (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
          <Clock size={15} className="text-[#67c4c7]" />
          <span>{duration}-minute visit · Times fit within clinic hours and breaks</span>
        </div>
      )}

      {date && !error && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Only available times are shown. Booked and overlapping times are hidden. Updates every 10 seconds.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredSlots.map(slot => {
              const displayRange = slot.time_slot
              const isSelected = value?.time_slot === displayRange && value?.appointment_date === date
              return (
                <button 
                  key={slot.time_slot} 
                  type="button" 
                  aria-pressed={isSelected} 
                  onClick={() => onChange(slot)} 
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border font-mono shadow-2xs ${
                    isSelected 
                      ? 'bg-[#67c4c7] text-white border-[#67c4c7] shadow-md ring-2 ring-[#67c4c7]/30' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {displayRange}
                </button>
              )
            })}
          </div>

          {filteredSlots.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6 font-normal bg-slate-50 rounded-2xl border border-slate-200">
              {loading ? 'Loading availability...' : 'No available times within working hours. Choose another date or refresh.'}
            </p>
          )}
        </div>
      )}

      {value && !loading && !valid && (
        <div role="alert" className="flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>This time is no longer available. Select another time.</span>
        </div>
      )}

      <input aria-label="Available appointment time" className="sr-only" tabIndex={-1} required value={valid ? value?.time_slot || '' : ''} onChange={() => {}} />

      <div className="pt-2">
        <button 
          type="button" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#67c4c7] hover:underline" 
          onClick={refresh}
        >
          <RefreshCw size={14}/> Refresh availability
        </button>
      </div>
    </div>
  )
}
