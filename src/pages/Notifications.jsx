import { useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/auth'
import { useQuery } from '../hooks/useQuery'
import { result } from '../lib/data'
import { statusLabel } from '../lib/appointments'
import Feedback from '../components/Feedback'
import { Bell, Clock, Info, CheckCircle2 } from 'lucide-react'

export default function Notifications() {
  const { user, role } = useAuth()
  
  const loader = useCallback(() => {
    let query = supabase.from('appointment_events').select('*').order('created_at', { ascending: false }).limit(100)
    if (role === 'client') query = query.eq('patient_id', user.id)
    return result(query)
  }, [user.id, role])
  
  const events = useQuery(loader, [], 30000)

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 text-left">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">ACTIVITY FEED</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Appointment Updates</h1>
          <p className="text-sm text-slate-600 mt-1">The latest 100 updates. This page refreshes automatically every 30 seconds.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full text-xs font-bold border border-[#67c4c7]/20 shadow-2xs self-start">
          <Bell size={14} /> Live Stream
        </div>
      </div>

      <Feedback error={events.error} onRetry={events.refresh} />

      {events.loading ? (
        <div className="text-center py-12 text-slate-500 text-sm font-medium">Loading updates...</div>
      ) : !events.error && !events.data.length ? (
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <Info className="mx-auto text-slate-400" size={36} strokeWidth={1.5} />
          <h2 className="text-lg font-bold text-slate-900">No appointment updates yet.</h2>
          <p className="text-sm text-slate-500 font-normal">Recent notifications and status changes will appear here.</p>
        </div>
      ) : !events.error && (
        <div className="space-y-4">
          {events.data.map(event => (
            <article key={event.id} className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-[#67c4c7]/50 transition-all space-y-3 text-left group">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-bold text-slate-900 text-base capitalize flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#67c4c7]" />
                  {statusLabel(event.action)}
                </h2>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200 font-mono">
                  ID: {String(event.appointment_id).slice(0, 8)}...
                </span>
              </div>

              {event.note && (
                <p className="text-sm text-slate-600 font-normal leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {event.note}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium pt-1">
                <Clock size={13} />
                <span>{new Date(event.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} Philippine time</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}