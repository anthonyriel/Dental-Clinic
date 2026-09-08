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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC WORKSPACE</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">A good day for great care.</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-normal">{visitDateLabel(clinicDate())} · Here’s what needs your attention.</p>
        </div>
        <div className="shrink-0">
          <Link 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white shadow-md transition-all whitespace-nowrap" 
            to="/management/schedule"
          >
            Open schedule <ArrowUpRight size={17}/>
          </Link>
        </div>
      </div>

      <Feedback error={schedule.error} onRetry={schedule.refresh}/>

      {!schedule.error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(([label, value, Icon, description]) => (
            <Link 
              key={label} 
              to="/management/schedule" 
              className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-[#67c4c7]/50 transition group text-left"
            >
              <div className="flex items-center justify-between text-[#67c4c7] mb-4">
                <div className="p-3 rounded-2xl bg-[#67c4c7]/10 group-hover:bg-[#67c4c7]/20 transition-colors">
                  <Icon size={22}/>
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-[#67c4c7] transition-colors"/>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <strong className="block text-3xl font-extrabold text-slate-900">{schedule.loading ? '—' : value}</strong>
                <small className="block text-xs text-slate-500 font-normal">{description}</small>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="bg-white/90 backdrop-blur-md mt-6 p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <h2 className="font-bold text-lg text-slate-900">Today at the clinic</h2>
          <Link className="inline-flex items-center gap-1 text-sm font-bold text-[#67c4c7] hover:underline" to="/management/schedule">
            View all <ArrowUpRight size={16}/>
          </Link>
        </div>

        {schedule.loading ? (
          <p className="text-sm text-slate-500 font-normal py-6 text-center">Loading today’s visits...</p>
        ) : schedule.error ? (
          <p className="text-sm text-red-600 font-medium py-6 text-center">The schedule is unavailable. Please retry.</p>
        ) : !today.length ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <CalendarDays size={36} className="mx-auto text-slate-400" strokeWidth={1.5}/>
            <p className="text-sm font-normal">No visits on the calendar today.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {today.slice(0, 5).map(a => (
              <div key={a.id} className="flex flex-wrap gap-4 items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-900">{a.profiles?.full_name || 'Patient'}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {serviceName(a)} · <span className="text-slate-700 font-bold">{a.time_slot}</span>
                  </p>
                </div>
                <span className={'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider status-' + normalizeStatus(a.status)}>
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