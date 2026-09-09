import { useCallback, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../context/auth'
import { useQuery } from '../../hooks/useQuery'
import { loadPatientAppointments, loadSettings } from '../../lib/queries'
import { canRequestCancellation, normalizeStatus } from '../../lib/appointments'
import { result, errorMessage } from '../../lib/data'
import Feedback from '../../components/Feedback'
import AppointmentList from '../../components/AppointmentList'
import { History, X, ShieldAlert, PhoneCall } from 'lucide-react'

export default function AppointmentHistory() {
  const { user } = useAuth()
  const loader = useCallback(() => loadPatientAppointments(user.id), [user.id])
  const history = useQuery(loader, [], 30000)
  const settings = useQuery(loadSettings)
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function request(e) {
    e.preventDefault()
    if (busy || !reason.trim()) return
    setBusy(true); setError(''); setMessage('')
    try {
      await result(supabase.rpc('change_appointment', { p_id: String(selected.id), p_action: 'request_cancellation', p_version: selected.version, p_reason: reason.trim() }))
      setSelected(null); setReason(''); history.refresh()
      setMessage('Cancellation requested. Your appointment remains reserved until the clinic approves.')
    } catch (err) { setError(errorMessage(err)); history.refresh() }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">PATIENT RECORDS</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Appointment History</h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">View your past visits, active reservations, and manage appointment requests.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full text-xs font-bold border border-[#67c4c7]/20 shadow-2xs self-start">
          <History size={16}/> Visit Records
        </div>
      </div>
      
      <Feedback error={error || history.error || settings.error} message={message} onRetry={() => { history.refresh(); settings.refresh(); setError('') }} />
      
      {history.loading ? (
        <p className="text-sm text-slate-500 font-normal py-8 text-center">Loading appointments...</p>
      ) : !history.error && (
        <div className="appointment-history-container">
          <AppointmentList 
            appointments={history.data} 
            renderActions={a => ['pending', 'confirmed'].includes(normalizeStatus(a.status)) && (
              settings.data && canRequestCancellation(a, settings.data.cancellation_hours) ? (
                <button 
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition border border-red-200 shadow-2xs mt-3" 
                  onClick={() => { setSelected(a); setReason(''); setError('') }}
                >
                  <ShieldAlert size={14}/> Request cancellation
                </button>
              ) : (
                <a 
                  href="tel:09703857431"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition border border-amber-200 shadow-2xs mt-3 group"
                >
                  <PhoneCall size={14} className="text-amber-600 group-hover:scale-110 transition-transform" />
                  <span>Too close to visit? Call Clinic directly</span>
                </a>
              )
            )} 
          />
        </div>
      )}

      {selected && (
        <div role="dialog" aria-modal="true" aria-label="Request cancellation" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={request} className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-red-600 uppercase">CANCELLATION REQUEST</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">Request cancellation</h2>
              </div>
              <button 
                type="button" 
                disabled={busy} 
                onClick={() => setSelected(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20}/>
              </button>
            </div>

            <Feedback error={error} />
            
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
              Reason <span className="text-red-500">*</span>
              <textarea 
                autoFocus 
                required 
                maxLength={1000} 
                className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 resize-none transition" 
                rows={4}
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Please let us know why you need to cancel..."
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button 
                type="button" 
                disabled={busy} 
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition disabled:opacity-50" 
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              <button 
                disabled={busy} 
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition shadow-md disabled:opacity-50"
              >
                {busy ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}