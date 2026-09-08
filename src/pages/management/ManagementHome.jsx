import { Link } from 'react-router-dom'
import { CalendarDays, Clock, CircleHelp, ListChecks, ArrowUpRight } from 'lucide-react'
import { useQuery } from '../../hooks/useQuery'
import { loadManagementAppointments } from '../../lib/queries'
import { clinicDate, serviceName, statusLabel, normalizeStatus } from '../../lib/appointments'
import { visitDateLabel } from '../../lib/presentation'
import Feedback from '../../components/Feedback'

export default function ManagementHome() {
  const schedule = useQuery(loadManagementAppointments, [], 30000)
  const today = schedule.data.filter(a => a.appointment_date === clinicDate() && !['cancelled', 'no_show'].includes(a.status))
  
  const cards = [
    ['Today’s appointments', today.length, CalendarDays, 'Your day at a glance'],
    ['Pending bookings', schedule.data.filter(a => a.status === 'pending').length, Clock, 'Waiting for your confirmation'],
    ['Cancellation requests', schedule.data.filter(a => a.status === 'cancellation_requested').length, CircleHelp, 'Patients needing a decision'],
    ['All appointments', schedule.data.length, ListChecks, 'The complete clinic schedule']
  ]

  return (
    <div className="space-y-8">
      <div className="page-heading flex flex-row items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <span className="eyebrow text-xs font-bold tracking-wider text-sky-600 uppercase">CLINIC WORKSPACE</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-1">A good day for great care.</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">{visitDateLabel(clinicDate())} · Here’s what needs your attention.</p>
        </div>
        <div className="shrink-0">
          <Link className="btn btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2.5 shadow-md whitespace-nowrap" to="/management/schedule">
            Open schedule <ArrowUpRight size={17}/>
          </Link>
        </div>
      </div>

      <Feedback error={schedule.error} onRetry={schedule.refresh}/>

      {!schedule.error && (
        <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(([label, value, Icon, description]) => (
            <Link key={label} to="/management/schedule" className="glass-panel stat-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-sky-300 transition text-left">
              <div className="flex items-center justify-between text-sky-600 mb-4">
                <Icon size={22}/>
                <ArrowUpRight size={18} className="text-slate-400"/>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                <strong className="block text-3xl font-extrabold text-slate-900 mt-1">{schedule.loading ? '—' : value}</strong>
                <small className="block text-xs sm:text-sm text-slate-600 mt-1">{description}</small>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="glass-panel mt-6 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-left space-y-6">
        <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <h2 className="font-bold text-base sm:text-lg text-slate-900">Today at the clinic</h2>
          <Link className="text-link inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700" to="/management/schedule">
            View all <ArrowUpRight size={16}/>
          </Link>
        </div>

        {schedule.loading ? (
          <p className="text-sm text-slate-500 py-4">Loading today’s visits...</p>
        ) : schedule.error ? (
          <p className="text-sm text-red-600 py-4">The schedule is unavailable. Please retry.</p>
        ) : !today.length ? (
          <div className="empty-state py-12 text-center text-slate-500 space-y-3">
            <CalendarDays size={32} className="mx-auto text-slate-400"/>
            <p className="text-sm font-medium">No visits on the calendar today.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {today.slice(0, 5).map(a => (
              <div key={a.id} className="flex flex-wrap gap-4 items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">{a.profiles?.full_name || 'Patient'}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{serviceName(a)} · <span className="font-medium text-slate-700">{a.time_slot}</span></p>
                </div>
                <span className={'status-badge px-3 py-1 rounded-full text-xs font-semibold status-' + normalizeStatus(a.status)}>
                  {statusLabel(a.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}