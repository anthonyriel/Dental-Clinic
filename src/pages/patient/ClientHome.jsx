import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Clock, Heart, Bell } from 'lucide-react'
import { useAuth } from '../../context/auth'
import { useQuery } from '../../hooks/useQuery'
import { loadPatientAppointments } from '../../lib/queries'
import { isUpcoming, serviceName, statusLabel, normalizeStatus } from '../../lib/appointments'
import { visitDateLabel } from '../../lib/presentation'
import Feedback from '../../components/Feedback'

export default function ClientHome() {
  const { user, profile } = useAuth()
  const loader = useCallback(() => loadPatientAppointments(user.id), [user.id])
  const appointments = useQuery(loader, [], 30000)
  const upcoming = appointments.data.filter(a => isUpcoming(a))
  const next = upcoming[0]

  return (
    <div className="space-y-8">
      <div className="page-heading flex flex-row items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <span className="eyebrow text-xs font-bold tracking-wider text-sky-600 uppercase">YOUR SMILE SPACE</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-1">Hello, {profile?.full_name?.split(' ')[0] || 'there'}.</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">A little care for yourself looks good on you.</p>
        </div>
        <div className="shrink-0">
          <Link className="btn btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2.5 shadow-md whitespace-nowrap" to="/dashboard/book">
            Book a visit <ArrowUpRight size={17}/>
          </Link>
        </div>
      </div>

      <Feedback error={appointments.error} onRetry={appointments.refresh}/>

      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="dashboard-welcome glass-dark p-6 sm:p-8 rounded-3xl text-left flex flex-col justify-between relative overflow-hidden" style={{ minHeight: '100%' }}>
          <div className="space-y-3 relative z-10">
            <Heart size={30} strokeWidth={1.3} className="text-sky-400"/>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Your smile.<br/>Your next chapter.</h2>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-sm">
              Check in on your appointments, find your next visit, and keep your details up to date. It’s all here.
            </p>
          </div>
          <div className="pt-4 relative z-10">
            <Link className="btn btn-primary inline-flex items-center gap-2 text-sm sm:text-base font-semibold px-5 py-2.5" to="/services">
              Explore your care <ArrowUpRight size={18}/>
            </Link>
          </div>
          {/* Subtle background graphic to fill the empty space */}
          <Heart size={180} strokeWidth={0.8} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" />
        </section>

        <section className="glass-panel next-visit p-6 sm:p-8 rounded-3xl space-y-4 bg-white border border-slate-200 shadow-sm text-left flex flex-col justify-between" style={{ minHeight: '100%' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Next on your calendar</h2>
            <CalendarDays size={20} className="text-sky-600"/>
          </div>

          {appointments.loading ? (
            <p className="text-sm text-slate-500">Loading your next visit...</p>
          ) : appointments.error ? (
            <p className="text-sm text-red-600">Your appointments could not be loaded.</p>
          ) : next ? (
            <div className="space-y-3 my-auto">
              <span className={'inline-block px-3 py-1 rounded-full text-xs font-semibold status-badge status-' + normalizeStatus(next.status)}>
                {statusLabel(next.status)}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{serviceName(next)}</h3>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                {visitDateLabel(next.appointment_date)}<br/>{next.time_slot}
              </p>
              {normalizeStatus(next.status) === 'cancellation_requested' && (
                <p className="text-xs sm:text-sm text-amber-600 bg-amber-50 p-2.5 rounded-lg">
                  Your visit remains reserved until cancellation is approved.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 my-auto">
              <h3 className="text-lg font-bold text-slate-900">A fresh start awaits.</h3>
              <p className="text-sm sm:text-base text-slate-600">No upcoming visits yet. Let’s find a little time for your smile.</p>
            </div>
          )}

          <div className="pt-2">
            {next ? (
              <Link className="text-link inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700" to="/dashboard/history">
                Appointment details <ArrowUpRight size={16}/>
              </Link>
            ) : (
              <Link className="text-link inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700" to="/dashboard/book">
                Find a time <ArrowUpRight size={16}/>
              </Link>
            )}
          </div>
        </section>
      </div>

      {!appointments.error && (
        <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link className="glass-panel stat-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-sky-300 transition text-left" to="/dashboard/history">
            <div className="flex items-center justify-between text-sky-600 mb-4">
              <CalendarDays size={22}/>
              <ArrowUpRight size={18} className="text-slate-400"/>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Your appointments</span>
              <strong className="block text-3xl font-extrabold text-slate-900 mt-1">{appointments.loading ? '—' : appointments.data.length}</strong>
              <small className="block text-xs sm:text-sm text-slate-600 mt-1">Your complete visit history</small>
            </div>
          </Link>

          <Link className="glass-panel stat-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-sky-300 transition text-left" to="/dashboard/history">
            <div className="flex items-center justify-between text-sky-600 mb-4">
              <Clock size={22}/>
              <ArrowUpRight size={18} className="text-slate-400"/>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Upcoming visits</span>
              <strong className="block text-3xl font-extrabold text-slate-900 mt-1">{appointments.loading ? '—' : upcoming.length}</strong>
              <small className="block text-xs sm:text-sm text-slate-600 mt-1">A little care to look forward to</small>
            </div>
          </Link>
        </div>
      )}

      <div className="text-left">
        <Link to="/dashboard/notifications" className="text-link inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-sky-600 hover:text-sky-700 mt-2">
          <Bell size={18}/> See your latest appointment updates <ArrowUpRight size={17}/>
        </Link>
      </div>
    </div>
  )
}