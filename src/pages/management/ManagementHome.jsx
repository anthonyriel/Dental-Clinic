import { Link } from 'react-router-dom'
import { CalendarDays, Clock, CircleHelp, ListChecks, ArrowUpRight, PlusCircle, CalendarOff } from 'lucide-react'
import { useQuery } from '../../hooks/useQuery'
import { supabase } from '../../services/supabaseClient'
import { managementSummary } from '../../lib/managementSummary'
import { clinicDate, serviceName, statusLabel, normalizeStatus, patientName } from '../../lib/appointments'
import { visitDateLabel } from '../../lib/presentation'
import Feedback from '../../components/Feedback'

const loadSummary = () => managementSummary(supabase, clinicDate())

export default function ManagementHome() {
  const schedule = useQuery(loadSummary, null, 30000)
  const today = schedule.data?.today || []

  const cards = [
    ['Today’s appointments', schedule.data?.todayCount, CalendarDays, 'Your day at a glance', `/management/schedule?date=${clinicDate()}`],
    ['Pending bookings', schedule.data?.pendingCount, Clock, 'Waiting for your confirmation', '/management/schedule?status=pending'],
    ['Cancellation requests', schedule.data?.cancellationCount, CircleHelp, 'Patients needing a decision', '/management/schedule?status=cancellation+requested'],
    ['All appointments', schedule.data?.totalCount, ListChecks, 'The complete clinic schedule', '/management/schedule']
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC WORKSPACE</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Refreshes every 30 seconds
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">A good day for great care.</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-normal">{visitDateLabel(clinicDate())} · Here’s what needs your attention.</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.map(([label, value, Icon, description, linkPath]) => (
            <Link 
              key={label} 
              to={linkPath} 
              className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-[#67c4c7]/50 transition group text-left"
            >
              <div className="flex items-center justify-between text-[#67c4c7] mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-[#67c4c7]/10 group-hover:bg-[#67c4c7]/20 transition-colors">
                  <Icon size={20} className="sm:w-5.5 sm:h-5.5"/>
                </div>
                <ArrowUpRight size={16} className="sm:w-4.5 sm:h-4.5 text-slate-400 group-hover:text-[#67c4c7] transition-colors"/>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest block truncate">{label}</span>
                <strong className="block text-2xl sm:text-3xl font-extrabold text-slate-900">{schedule.loading ? '—' : value}</strong>
                <small className="block text-[11px] sm:text-xs text-slate-500 font-normal leading-tight">{description}</small>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="bg-white/90 backdrop-blur-md mt-6 p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <h2 className="font-bold text-lg text-slate-900">Today at the clinic</h2>
          <Link className="inline-flex items-center gap-1 text-sm font-bold text-[#67c4c7] hover:underline" to={`/management/schedule?date=${clinicDate()}`}>
            View all <ArrowUpRight size={16}/>
          </Link>
        </div>

        {schedule.loading ? (
          <p className="text-sm text-slate-500 font-normal py-6 text-center">Loading today’s visits...</p>
        ) : schedule.error ? (
          <p className="text-sm text-red-600 font-medium py-6 text-center">The schedule is unavailable. Please retry.</p>
        ) : !today.length ? (
          <div className="py-12 text-center text-slate-500 space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <CalendarDays size={28} strokeWidth={1.5}/>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900">No visits on the calendar today.</h3>
              <p className="text-xs font-normal text-slate-500">Your schedule is currently clear for today. Need to block personal time or adjust availability?</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/management/settings" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                <CalendarOff size={15}/> Manage closures &amp; hours
              </Link>
              <Link to="/management/schedule" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white text-xs font-bold transition shadow-2xs">
                <PlusCircle size={15}/> View full schedule
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {today.slice(0, 5).map(a => (
              <div key={a.id} className="flex flex-wrap gap-4 items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-900">{patientName(a)}{a.walk_in_name ? ' · Walk-in' : ''}</h3>
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