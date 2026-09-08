import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadManagementAppointments } from '../../lib/queries'
import { allowedActions, statusLabel } from '../../lib/appointments'
import { result, errorMessage } from '../../lib/data'
import Feedback from '../../components/Feedback'
import AppointmentList from '../../components/AppointmentList'
import SlotPicker from '../../components/SlotPicker'
import { RefreshCw, X, CheckCircle2 } from 'lucide-react'

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
      setSelected(null); schedule.refresh(); setMessage('Appointment updated successfully.')
    } catch (err) { setError(errorMessage(err)); schedule.refresh() }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 text-left">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC WORKSPACE</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Schedule Management</h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">Manage patient bookings, approve requests, and adjust clinic schedules.</p>
        </div>
        <button 
          onClick={schedule.refresh} 
          disabled={schedule.loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={16} className={schedule.loading ? 'animate-spin text-[#67c4c7]' : 'text-slate-400'} />
          Refresh Schedule
        </button>
      </div>

      <Feedback 
        error={error || schedule.error} 
        message={message} 
        onRetry={() => { setError(''); schedule.refresh() }} 
      />

      {schedule.loading ? (
        <p className="text-sm text-slate-500 font-normal py-8 text-center">Loading schedule...</p>
      ) : !schedule.error && (
        <div className="appointment-management-container">
          <AppointmentList 
            management 
            appointments={schedule.data} 
            renderActions={a => (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                {allowedActions(a).map(action => (
                  <button 
                    key={action} 
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shadow-2xs border ${
                      action === 'approve' || action === 'approve_cancellation' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                      action === 'cancel' || action === 'reject' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                      'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`} 
                    onClick={() => { setSelected({ appointment: a, action }); setSlot(null); setReason(''); setError('') }}
                  >
                    {statusLabel(action)}
                  </button>
                ))}
              </div>
            )} 
          />
        </div>
      )}

      {/* Action Dialog / Modal */}
      {selected && (
        <div role="dialog" aria-modal="true" aria-label="Update appointment" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={submit} className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#67c4c7] uppercase">UPDATE APPOINTMENT</span>
                <h2 className="text-xl font-extrabold text-slate-900 capitalize mt-1">{statusLabel(selected.action)}</h2>
                <p className="text-xs text-slate-500 font-medium mt-1 font-mono">
                  {selected.appointment.appointment_date} · {selected.appointment.time_slot}
                </p>
              </div>
              <button 
                type="button" 
                disabled={busy}
                onClick={() => setSelected(null)} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                 <X size={20} />
              </button>
            </div>

            <Feedback error={error} />
            
            {selected.action === 'reschedule' && (
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4">
                <SlotPicker 
                  serviceId={selected.appointment.service_id} 
                  excludeId={selected.appointment.id} 
                  value={slot} 
                  onChange={setSlot} 
                />
              </div>
            )}
            
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
              Clinic Note <span className="text-red-500">*</span>
              <textarea 
                autoFocus 
                required 
                maxLength={1000} 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Enter the reason or note for this action..."
                className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 resize-none transition" 
                rows={4}
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button 
                type="button" 
                disabled={busy} 
                onClick={() => setSelected(null)} 
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={busy || (selected.action === 'reschedule' && !slot)} 
                className={`flex-1 py-3 font-bold rounded-xl transition shadow-md text-sm disabled:opacity-50 text-white ${
                  selected.action === 'approve' || selected.action === 'approve_cancellation' ? 'bg-emerald-600 hover:bg-emerald-500' :
                  selected.action === 'cancel' || selected.action === 'reject' ? 'bg-red-600 hover:bg-red-500' :
                  'bg-[#67c4c7] hover:bg-[#57b3b6]'
                }`}
              >
                {busy ? 'Processing...' : 'Confirm Change'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}