import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadManagementAppointments } from '../../lib/queries'
import { allowedActions, statusLabel } from '../../lib/appointments'
import { result, errorMessage } from '../../lib/data'
import Feedback from '../../components/Feedback'
import AppointmentList from '../../components/AppointmentList'
import SlotPicker from '../../components/SlotPicker'
import { RefreshCw, X } from 'lucide-react'

export default function ScheduleManagement() {
  const [params] = useSearchParams()
  const initialDate = params.get('date') || ''
  const initialStatus = params.get('status') || ''

  const schedule = useQuery(loadManagementAppointments, [], 0, { refreshOnFocus: false })
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [slot, setSlot] = useState(null)
  const [actualPrice, setActualPrice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (busy || !selected) return
    
    if (selected.action !== 'delete' && !reason.trim()) return
    if (selected.action === 'completed' && (actualPrice === '' || isNaN(Number(actualPrice)))) {
      setError('Please enter a valid actual price paid.')
      return
    }

    setBusy(true); setError(''); setMessage('')
    try {
      if (selected.action === 'delete') {
        await result(supabase.from('appointments').delete().eq('id', selected.appointment.id))
        setMessage('Appointment permanently deleted.')
      } else if (selected.action === 'completed') {
        await result(supabase.rpc('complete_appointment', {
          p_id: String(selected.appointment.id),
          p_version: selected.appointment.version,
          p_reason: reason.trim(),
          p_price: Number(actualPrice),
        }))
        setMessage('Appointment marked as completed successfully.')
      } else {
        const args = { p_id: String(selected.appointment.id), p_version: selected.appointment.version, p_reason: reason.trim() }
        await result(selected.action === 'reschedule'
          ? supabase.rpc('reschedule_appointment', { ...args, p_date: slot.appointment_date, p_time_slot: slot.time_slot })
          : supabase.rpc('change_appointment', { ...args, p_action: selected.action }))
        setMessage('Appointment updated successfully.')
      }
      setSelected(null); schedule.refresh()
    } catch (err) { setError(errorMessage(err)); schedule.refresh() }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC WORKSPACE</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Schedule Management</h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">Manage patient bookings, approve requests, and adjust clinic schedules. Refresh to see changes from other users. Your changes refresh this list automatically.</p>
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
            initialDate={initialDate}
            initialStatus={initialStatus}
            onDelete={a => { setSelected({ appointment: a, action: 'delete' }); setSlot(null); setReason(''); setActualPrice(''); setError('') }}
            renderActions={a => {
              const actions = allowedActions(a);

              if (actions.length === 0) return null;

              return (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  {actions.map(action => (
                    <button 
                      key={action} 
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shadow-2xs border ${
                        action === 'approve' || action === 'approve_cancellation' || action === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                        action === 'cancel' || action === 'reject' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                        'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`} 
                      onClick={() => { setSelected({ appointment: a, action }); setSlot(null); setReason(''); setActualPrice(a.price ?? ''); setError('') }}
                    >
                      {statusLabel(action === 'completed' ? 'complete' : action)}
                    </button>
                  ))}
                </div>
              );
            }} 
          />
        </div>
      )}

      {/* Action Dialog / Modal */}
      {selected && (
        <div role="dialog" aria-modal="true" aria-label="Update appointment" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={submit} className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left relative">

            {busy && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#67c4c7]/20 overflow-hidden rounded-t-3xl">
                <div className="h-full bg-[#67c4c7] animate-pulse w-full origin-left"></div>
              </div>
            )}

            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#67c4c7] uppercase">
                  {selected.action === 'delete' ? 'DELETE APPOINTMENT' : 'UPDATE APPOINTMENT'}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 capitalize mt-1">
                  {selected.action === 'delete' ? 'Delete Permanently' : statusLabel(selected.action === 'completed' ? 'complete' : selected.action)}
                </h2>
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

            {selected.action === 'delete' ? (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-sm font-medium text-red-800">
                  Are you sure you want to permanently delete this appointment? This action will completely remove it from the database and cannot be undone.
                </p>
              </div>
            ) : (
              <>
                {selected.action === 'reschedule' && (
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4">
                    <SlotPicker 
                      serviceId={selected.appointment.service_id}
                      duration={selected.appointment.duration_minutes} 
                      excludeId={selected.appointment.id} 
                      value={slot} 
                      onChange={setSlot} 
                    />
                  </div>
                )}

                {selected.action === 'completed' && (
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
                    Actual Price Paid (₱) <span className="text-red-500">*</span>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required 
                      value={actualPrice} 
                      onChange={e => setActualPrice(e.target.value)} 
                      placeholder="Enter final price paid..."
                      className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 transition font-mono" 
                    />
                  </label>
                )}

                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide space-y-1.5">
                  Clinic Note <span className="text-red-500">*</span>
                  <textarea 
                    autoFocus={selected.action !== 'completed'} 
                    required 
                    maxLength={1000} 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="Enter the reason or note for this action..."
                    className="block border border-slate-300 rounded-xl p-3 w-full text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] text-slate-900 bg-slate-50/50 resize-none transition" 
                    rows={4}
                  />
                </label>
              </>
            )}

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
                  selected.action === 'approve' || selected.action === 'approve_cancellation' || selected.action === 'completed' ? 'bg-emerald-600 hover:bg-emerald-500' :
                  selected.action === 'cancel' || selected.action === 'reject' || selected.action === 'delete' ? 'bg-red-600 hover:bg-red-500' :
                  'bg-[#67c4c7] hover:bg-[#57b3b6]'
                }`}
              >
                {busy ? 'Processing...' : (selected.action === 'delete' ? 'Yes, Delete' : 'Confirm Change')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
