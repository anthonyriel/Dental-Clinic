import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadManagementAppointments } from '../../lib/queries'
import { allowedActions, statusLabel } from '../../lib/appointments'
import { result, errorMessage } from '../../lib/data'
import Feedback from '../../components/Feedback'
import AppointmentList from '../../components/AppointmentList'
import SlotPicker from '../../components/SlotPicker'

export default function ScheduleManagement() {
  const schedule = useQuery(loadManagementAppointments, [], 30000)
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [slot, setSlot] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (busy || !selected) return
    setBusy(true); setError(''); setMessage('')
    try {
      const args = { p_id: String(selected.appointment.id), p_version: selected.appointment.version, p_reason: reason.trim() }
      await result(selected.action === 'reschedule'
        ? supabase.rpc('reschedule_appointment', { ...args, p_date: slot.appointment_date, p_time_slot: slot.time_slot })
        : supabase.rpc('change_appointment', { ...args, p_action: selected.action }))
      setSelected(null); schedule.refresh(); setMessage('Appointment updated.')
    } catch (err) { setError(errorMessage(err)); schedule.refresh() }
    finally { setBusy(false) }
  }
  return <div className="space-y-6">
    <h1 className="text-3xl font-bold">Schedule Management</h1>
    <Feedback error={error || schedule.error} message={message} onRetry={() => { setError(''); schedule.refresh() }} />
    <button className="underline text-sm" onClick={schedule.refresh}>Refresh schedule</button>
    {schedule.loading ? <p>Loading schedule...</p> : !schedule.error && <AppointmentList management appointments={schedule.data} renderActions={a => <div className="flex flex-wrap gap-2">{allowedActions(a).map(action => <button key={action} className="bg-slate-100 border rounded-lg p-2 text-sm capitalize" onClick={() => { setSelected({ appointment: a, action }); setSlot(null); setReason(''); setError('') }}>{statusLabel(action)}</button>)}</div>} />}
    {selected && <div role="dialog" aria-modal="true" aria-label="Update appointment" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><form onSubmit={submit} className="bg-white p-6 rounded-xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-auto">
      <h2 className="font-bold capitalize">{statusLabel(selected.action)}</h2><p>{selected.appointment.appointment_date} · {selected.appointment.time_slot}</p>
      <Feedback error={error} />
      {selected.action === 'reschedule' && <SlotPicker serviceId={selected.appointment.service_id} excludeId={selected.appointment.id} value={slot} onChange={setSlot} />}
      <label className="block">Clinic note<textarea autoFocus required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} className="border rounded-lg block w-full p-3" /></label>
      <button type="button" disabled={busy} onClick={() => setSelected(null)}>Close</button><button disabled={busy || (selected.action === 'reschedule' && !slot)} className="ml-4 p-2 bg-sky-600 text-white rounded-lg">{busy ? 'Saving...' : 'Confirm change'}</button>
    </form></div>}
  </div>
}

