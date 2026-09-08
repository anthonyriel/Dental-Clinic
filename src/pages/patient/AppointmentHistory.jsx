import { useCallback, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../context/auth'
import { useQuery } from '../../hooks/useQuery'
import { loadPatientAppointments, loadSettings } from '../../lib/queries'
import { canRequestCancellation, normalizeStatus } from '../../lib/appointments'
import { result, errorMessage } from '../../lib/data'
import Feedback from '../../components/Feedback'
import AppointmentList from '../../components/AppointmentList'

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
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Appointment History</h1>
      
      <Feedback error={error || history.error || settings.error} message={message} onRetry={() => { history.refresh(); settings.refresh(); setError('') }} />
      
      {history.loading ? (
        <p className="text-sm text-slate-500">Loading appointments...</p>
      ) : !history.error && (
        <div className="appointment-history-container">
          <AppointmentList 
            appointments={history.data} 
            renderActions={a => ['pending', 'confirmed'].includes(normalizeStatus(a.status)) && (
              settings.data && canRequestCancellation(a, settings.data.cancellation_hours) ? (
                <button className="text-sm font-semibold text-red-600 hover:text-red-700 underline" onClick={() => { setSelected(a); setReason(''); setError('') }}>
                  Request cancellation
                </button>
              ) : (
                <p className="text-sm text-slate-600">For cancellation or rescheduling, <a className="underline text-sky-600 font-semibold" href="tel:09703857431">call the clinic</a>.</p>
              )
            )} 
          />
        </div>
      )}

      {selected && (
        <div role="dialog" aria-modal="true" aria-label="Request cancellation" className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={request} className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Request cancellation</h2>
            <Feedback error={error} />
            <label className="block text-sm font-semibold text-slate-700 space-y-1">
              Reason
              <textarea 
                autoFocus 
                required 
                maxLength={1000} 
                className="block border border-slate-300 rounded-xl p-3 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 text-sm" 
                rows={4}
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Please let us know why you need to cancel..."
              />
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button" 
                disabled={busy} 
                className="btn btn-secondary px-4 py-2.5 text-sm font-semibold" 
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              <button 
                disabled={busy} 
                className="btn btn-primary bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md"
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