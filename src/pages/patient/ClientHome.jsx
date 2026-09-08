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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">YOUR SMILE SPACE</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Hello, {profile?.full_name?.split(' ')[0] || 'there'}.
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-normal">A little care for yourself looks good on you.</p>
        </div>
        <div className="shrink-0">
          <Link 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white shadow-md transition-all whitespace-nowrap" 
            to="/dashboard/book"
          >
            Book a visit <ArrowUpRight size={17}/>
          </Link>
        </div>
      </div>

      <Feedback error={appointments.error} onRetry={appointments.refresh}/>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800 text-left flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#67c4c7]/20 text-[#67c4c7] flex items-center justify-center border border-[#67c4c7]/30">
              <Heart size={24} strokeWidth={1.8}/>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">Your smile.<br/>Your next chapter.</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-sm font-normal">
              Check in on your appointments, find your next visit, and keep your details up to date. It’s all here.
            </p>
          </div>
          <div className="pt-6 relative z-10">
            <Link 
              className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white shadow-md transition-all" 
              to="/services"
            >
              Explore your care <ArrowUpRight size={18}/>
            </Link>
          </div>
          <Heart size={180} strokeWidth={0.8} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" />
        </section>

        <section className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-8 rounded-3xl space-y-6 shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Next on your calendar</h2>
            <div className="p-2 rounded-xl bg-[#67c4c7]/10 text-[#67c4c7]">
              <CalendarDays size={20}/>
            </div>
          </div>

          {appointments.loading ? (
            <p className="text-sm text-slate-500 font-normal py-6">Loading your next visit...</p>
          ) : appointments.error ? (
            <p className="text-sm text-red-600 font-medium py-6">Your appointments could not be loaded.</p>
          ) : next ? (
            <div className="space-y-3 my-auto">
              <span className={'inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ' + (
                normalizeStatus(next.status) === 'cancellation_requested' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              )}>
                {statusLabel(next.status)}
              </span>
              <h3 className="text-xl font-bold text-slate-900">{serviceName(next)}</h3>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                {visitDateLabel(next.appointment_date)} · {next.time_slot}
              </p>
              {normalizeStatus(next.status) === 'cancellation_requested' && (
                <p className="text-xs sm:text-sm text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
                  Your visit remains reserved until cancellation is approved.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 my-auto py-6">
              <h3 className="text-xl font-bold text-slate-900">A fresh start awaits.</h3>
              <p className="text-sm text-slate-600 font-normal">No upcoming visits yet. Let’s find a little time for your smile.</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            {next ? (
              <Link className="inline-flex items-center gap-1.5 text-sm font-bold text-[#67c4c7] hover:underline" to="/dashboard/history">
                Appointment details <ArrowUpRight size={16}/>
              </Link>
            ) : (
              <Link className="inline-flex items-center gap-1.5 text-sm font-bold text-[#67c4c7] hover:underline" to="/dashboard/book">
                Find a time <ArrowUpRight size={16}/>
              </Link>
            )}
          </div>
        </section>
      </div>

      {!appointments.error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link 
            className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-[#67c4c7]/50 transition text-left group" 
            to="/dashboard/history"
          >
            <div className="flex items-center justify-between text-[#67c4c7] mb-4">
              <div className="p-3 rounded-2xl bg-[#67c4c7]/10 group-hover:bg-[#67c4c7]/20 transition-colors">
                <CalendarDays size={22}/>
              </div>
              <ArrowUpRight size={18} className="text-slate-400 group-hover:text-[#67c4c7] transition-colors"/>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your appointments</span>
              <strong className="block text-3xl font-extrabold text-slate-900">{appointments.loading ? '—' : appointments.data.length}</strong>
              <small className="block text-xs text-slate-500 font-normal">Your complete visit history</small>
            </div>
          </Link>

          <Link 
            className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-[#67c4c7]/50 transition text-left group" 
            to="/dashboard/history"
          >
            <div className="flex items-center justify-between text-[#67c4c7] mb-4">
              <div className="p-3 rounded-2xl bg-[#67c4c7]/10 group-hover:bg-[#67c4c7]/20 transition-colors">
                <Clock size={22}/>
              </div>
              <ArrowUpRight size={18} className="text-slate-400 group-hover:text-[#67c4c7] transition-colors"/>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming visits</span>
              <strong className="block text-3xl font-extrabold text-slate-900">{appointments.loading ? '—' : upcoming.length}</strong>
              <small className="block text-xs text-slate-500 font-normal">A little care to look forward to</small>
            </div>
          </Link>
        </div>
      )}

      <div className="text-left pt-2">
        <Link 
          to="/dashboard/notifications" 
          className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-[#67c4c7] hover:underline"
        >
          <Bell size={18}/> See your latest appointment updates <ArrowUpRight size={17}/>
        </Link>
      </div>
    </div>
  )
}