import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadSettings } from '../../lib/queries'
import { result, errorMessage } from '../../lib/data'
import { clinicDate } from '../../lib/appointments'
import Feedback from '../../components/Feedback'
import { Settings, CalendarX, Clock, CalendarDays, Info, ShieldCheck } from 'lucide-react'

const loadClosures = () => result(supabase.from('clinic_closures').select('*').order('closure_date'))

export default function ClinicSettings() {
  const settings = useQuery(loadSettings)
  const closures = useQuery(loadClosures, [])
  
  const [draft, setDraft] = useState(null)
  const [activeTab, setActiveTab] = useState('hours')
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const form = draft || settings.data

  async function save(e) {
    e.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try { 
      await result(supabase.rpc('save_clinic_settings', { p_settings: form }))
      setMessage('Settings saved. Existing appointments remain reserved; review the schedule if opening hours changed.')
      settings.refresh()
      setDraft(null) 
    } catch (err) { 
      setError(errorMessage(err)) 
    } finally { 
      setBusy(false) 
    }
  }

  async function closeDate(closed, closureDate = date) {
    setBusy(true); setError(''); setMessage('')
    try {
      await result(supabase.rpc('set_clinic_closure', { p_date: closureDate, p_reason: reason.trim(), p_closed: closed }))
      closures.refresh()
      setDate('')
      setReason('')
      setMessage(closed ? 'Date closed for bookings.' : 'Date reopened.')
    } catch (err) { 
      setError(errorMessage(err)) 
    } finally { 
      setBusy(false) 
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC PREFERENCES</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Clinic Availability</h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">Configure operating hours, booking rules, and holiday closures.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full text-xs font-bold border border-[#67c4c7]/20 shadow-2xs self-start">
          <Settings className="w-4 h-4 text-[#67c4c7]" /> System Config
        </div>
      </div>

      <div className="bg-[#67c4c7]/10 text-slate-900 p-4 rounded-2xl text-sm flex items-start sm:items-center gap-3 border border-[#67c4c7]/20 shadow-2xs">
        <Info className="w-5 h-5 shrink-0 text-[#67c4c7] mt-0.5 sm:mt-0" />
        <span className="font-normal leading-relaxed text-slate-700">
          One patient at a time. Available start times are offered every 15 minutes and must fit the service duration.
        </span>
      </div>

      <Feedback 
        error={error || settings.error || closures.error} 
        message={message} 
        onRetry={() => { setError(''); settings.refresh(); closures.refresh() }} 
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          ['hours', 'Operating Hours & Days', CalendarDays],
          ['rules', 'Booking Rules', ShieldCheck],
          ['closures', 'Holiday Closures', CalendarX]
        ].map(([tabKey, tabLabel, TabIcon]) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setActiveTab(tabKey)}
            className={`inline-flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tabKey
                ? 'border-[#67c4c7] text-[#67c4c7] bg-[#67c4c7]/5 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <TabIcon size={16} />
            {tabLabel}
          </button>
        ))}
      </div>

      {form && (
        <form onSubmit={save} className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-8">
          
          {activeTab === 'hours' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CalendarDays className="w-5 h-5 text-[#67c4c7]" />
                  <h3 className="font-bold text-lg text-slate-900">Operating Days</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => {
                    const isSelected = form.opening_days.includes(i)
                    return (
                      <label 
                        key={day} 
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border cursor-pointer transition-all text-sm font-bold ${
                          isSelected 
                            ? 'bg-[#67c4c7]/10 border-[#67c4c7]/30 text-[#67c4c7] shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isSelected} 
                          onChange={e => setDraft({ 
                            ...form, 
                            opening_days: e.target.checked 
                              ? [...form.opening_days, i] 
                              : form.opening_days.filter(d => d !== i) 
                          })} 
                        />
                        {day}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="w-5 h-5 text-[#67c4c7]" />
                  <h3 className="font-bold text-lg text-slate-900">Daily Schedule</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    ['morning_start','Morning Opens'],
                    ['morning_end','Morning Closes'],
                    ['afternoon_start','Afternoon Opens'],
                    ['afternoon_end','Afternoon Closes']
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">{label}</label>
                      <input 
                        type="time" 
                        required 
                        value={form[key]} 
                        onChange={e => setDraft({ ...form, [key]: e.target.value })} 
                        className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  disabled={busy || !draft} 
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
                >
                  {busy ? 'Saving Changes...' : 'Save Operating Hours'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rules')}
                  className="text-xs font-bold text-[#67c4c7] hover:underline hidden sm:inline-block"
                >
                  Next: Booking Rules →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-[#67c4c7]" />
                  <h3 className="font-bold text-lg text-slate-900">Booking Rules</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    ['cancellation_hours', 'Online cancellation notice (hrs)', 0, 8760],
                    ['booking_notice_minutes', 'Minimum booking notice (mins)', 0, 43200],
                    ['booking_horizon_days', 'Book up to this many days ahead', 1, 730]
                  ].map(([key, label, min, max]) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">{label}</label>
                      <input 
                        type="number" 
                        required 
                        min={min} 
                        max={max} 
                        value={form[key]} 
                        onChange={e => setDraft({ ...form, [key]: e.target.value })} 
                        className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  disabled={busy || !draft} 
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
                >
                  {busy ? 'Saving Changes...' : 'Save Booking Rules'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('closures')}
                  className="text-xs font-bold text-[#67c4c7] hover:underline hidden sm:inline-block"
                >
                  Next: Holiday Closures →
                </button>
              </div>
            </div>
          )}

        </form>
      )}

      {activeTab === 'closures' && (
        <div className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarX className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-lg text-slate-900">Holiday &amp; Absence Closures</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1 font-normal">Dates with active appointments must be cleared through rescheduling or cancellation first.</p>
            </div>
          </div>

          <form onSubmit={e => { e.preventDefault(); closeDate(true) }} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-4 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Closure Date</label>
              <input 
                type="date" 
                min={clinicDate()} 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono" 
              />
            </div>
            
            <div className="sm:col-span-8 lg:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Reason</label>
              <input 
                type="text" 
                required 
                maxLength={1000} 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="e.g., Public Holiday, Clinic Maintenance"
                className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition" 
              />
            </div>

            <div className="sm:col-span-12 lg:col-span-3 mt-2 sm:mt-0">
              <button 
                disabled={busy} 
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-sm"
              >
                Add Closure
              </button>
            </div>
          </form>

          {closures.data?.length > 0 && (
            <div className="pt-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Upcoming Closures</h4>
              {closures.data.map(c => (
                <div 
                  key={c.closure_date} 
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm block font-mono">{c.closure_date}</span>
                    <span className="text-xs text-slate-500 mt-0.5 block font-normal">{c.reason}</span>
                  </div>
                  <button 
                    disabled={busy} 
                    onClick={() => closeDate(false, c.closure_date)} 
                    className="px-4 py-2 bg-white border border-slate-200 hover:border-[#67c4c7]/30 hover:bg-[#67c4c7]/10 hover:text-[#67c4c7] text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                  >
                    Reopen Date
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}