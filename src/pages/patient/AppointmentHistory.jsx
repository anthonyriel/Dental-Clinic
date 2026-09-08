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
  return <div className="space-y-6">
    <h1 className="text-3xl font-bold">Appointment History</h1>
    <Feedback error={error || history.error || settings.error} message={message} onRetry={() => { history.refresh(); settings.refresh(); setError('') }} />
    {history.loading ? <p>Loading appointments...</p> : !history.error && <AppointmentList appointments={history.data} renderActions={a => ['pending', 'confirmed'].includes(normalizeStatus(a.status)) && (settings.data && canRequestCancellation(a, settings.data.cancellation_hours) ?
      <button className="text-sm text-red-700 underline" onClick={() => { setSelected(a); setReason(''); setError('') }}>Request cancellation</button> :
      <p className="text-sm">For cancellation or rescheduling, <a className="underline" href="tel:09703857431">call the clinic</a>.</p>)} />}
    {selected && <div role="dialog" aria-modal="true" aria-label="Request cancellation" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><form onSubmit={request} className="bg-white p-6 rounded-xl max-w-md w-full space-y-4">
      <h2 className="font-bold">Request cancellation</h2><Feedback error={error} /><label className="block">Reason<textarea autoFocus required maxLength={1000} className="block border rounded p-3 w-full" value={reason} onChange={e => setReason(e.target.value)} /></label>
      <button type="button" disabled={busy} onClick={() => setSelected(null)}>Close</button><button disabled={busy} className="ml-4 bg-red-600 text-white p-2 rounded">{busy ? 'Submitting...' : 'Submit request'}</button>
    </form></div>}
  </div>
}

