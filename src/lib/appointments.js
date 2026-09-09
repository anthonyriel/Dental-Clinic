export const CLINIC_TIMEZONE = 'Asia/Manila'
export const ACTIVE_STATUSES = ['pending', 'confirmed', 'cancellation_requested']
export const normalizeStatus = (value) => (value || '').toLowerCase().replaceAll(' ', '_')
export const statusLabel = (value) => normalizeStatus(value).replaceAll('_', ' ')
export const clinicDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now)
export function slotMinutes(slot) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(slot || '')
  if (!match) return NaN
  return (Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(match[2])
}
export function appointmentStart(appointment) {
  const minutes = slotMinutes(appointment.time_slot)
  if (!Number.isFinite(minutes)) return new Date(NaN)
  return new Date(`${appointment.appointment_date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00+08:00`)
}
export function isUpcoming(appointment, now = new Date()) {
  return ACTIVE_STATUSES.includes(normalizeStatus(appointment.status)) && appointmentStart(appointment) > now
}
export function canRequestCancellation(appointment, hours = 168, now = new Date()) {
  return ['pending', 'confirmed'].includes(normalizeStatus(appointment.status)) && appointmentStart(appointment).getTime() - now.getTime() >= hours * 3600000
}
export function sortAppointments(items) {
  return [...items].sort((a, b) => a.appointment_date.localeCompare(b.appointment_date) || slotMinutes(a.time_slot) - slotMinutes(b.time_slot))
}
export function allowedActions(appointment, now = new Date()) {
  const status = normalizeStatus(appointment.status)
  if (status === 'cancellation_requested') return ['approve_cancellation', 'reject_cancellation']
  if (status === 'pending') return appointmentStart(appointment) > now ? ['confirmed', 'cancelled', 'reschedule'] : ['cancelled', 'reschedule']
  if (status === 'confirmed') return appointmentStart(appointment) <= now ? ['completed', 'no_show', 'cancelled'] : ['cancelled', 'reschedule']
  return []
}
export const serviceName = (appointment) => appointment.service_name || appointment.services?.name || 'Dental service'
export const patientName = (appointment) => appointment.walk_in_name || appointment.profiles?.full_name || 'Patient'
export const patientPhone = (appointment) => appointment.walk_in_phone || appointment.profiles?.phone || ''
export const servicePrice = (appointment) => appointment.quoted_price ?? appointment.services?.price
