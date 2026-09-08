import { useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/auth'
import { useQuery } from '../hooks/useQuery'
import { result } from '../lib/data'
import { statusLabel } from '../lib/appointments'
import Feedback from '../components/Feedback'

export default function Notifications() {
  const { user, role } = useAuth()
  const loader = useCallback(() => {
    let query = supabase.from('appointment_events').select('*').order('created_at', { ascending: false }).limit(100)
    if (role === 'client') query = query.eq('patient_id',user.id)
    return result(query)
  },[user.id,role])
  const events = useQuery(loader,[],30000)
  return <div className="space-y-5"><h1 className="text-3xl font-bold">Appointment Updates</h1><p className="text-sm">The latest 100 updates. This page refreshes every 30 seconds while open.</p><Feedback error={events.error} onRetry={events.refresh} />
    {events.loading ? <p>Loading updates...</p> : !events.error && !events.data.length ? <p>No appointment updates yet.</p> : !events.error && events.data.map(event => <article key={event.id} className="bg-white border rounded-xl p-4 space-y-2"><p className="font-semibold capitalize">{statusLabel(event.action)}</p><p>{event.note}</p><p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})} Philippine time · Appointment {event.appointment_id}</p></article>)}
  </div>
}

