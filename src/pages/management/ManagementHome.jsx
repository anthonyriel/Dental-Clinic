import { Link } from 'react-router-dom'
import { CalendarDays, Clock, CircleHelp, ListChecks, ArrowUpRight } from 'lucide-react'
import { useQuery } from '../../hooks/useQuery'
import { loadManagementAppointments } from '../../lib/queries'
import { clinicDate,serviceName,statusLabel,normalizeStatus } from '../../lib/appointments'
import { visitDateLabel } from '../../lib/presentation'
import Feedback from '../../components/Feedback'
export default function ManagementHome() {
  const schedule=useQuery(loadManagementAppointments,[],30000)
  const today=schedule.data.filter(a=>a.appointment_date===clinicDate()&&!['cancelled','no_show'].includes(a.status))
  const cards=[['Today’s appointments',today.length,CalendarDays,'Your day at a glance'],['Pending bookings',schedule.data.filter(a=>a.status==='pending').length,Clock,'Waiting for your confirmation'],['Cancellation requests',schedule.data.filter(a=>a.status==='cancellation_requested').length,CircleHelp,'Patients needing a decision'],['All appointments',schedule.data.length,ListChecks,'The complete clinic schedule']]
  return <div><div className="page-heading"><div><span className="eyebrow">CLINIC WORKSPACE</span><h1>A good day for great care.</h1><p>{visitDateLabel(clinicDate())} · Here’s what needs your attention.</p></div><Link className="btn btn-primary" to="/management/schedule">Open schedule <ArrowUpRight size={17}/></Link></div><Feedback error={schedule.error} onRetry={schedule.refresh}/>
    {!schedule.error&&<div className="stat-grid">{cards.map(([label,value,Icon,description])=><Link key={label} to="/management/schedule" className="glass-panel stat-card"><Icon size={22}/><span>{label}</span><strong>{schedule.loading?'—':value}</strong><small>{description}</small></Link>)}</div>}
    <section className="glass-panel mt-6 p-6"><div className="flex justify-between items-center gap-4 mb-5"><h2 className="font-semibold text-sm">Today at the clinic</h2><Link className="text-link" to="/management/schedule">View all <ArrowUpRight size={16}/></Link></div>{schedule.loading?<p className="text-sm text-slate-500">Loading today’s visits...</p>:schedule.error?<p className="text-sm">The schedule is unavailable. Please retry.</p>:!today.length?<div className="empty-state"><CalendarDays size={26} className="mx-auto mb-3"/><p>No visits on the calendar today.</p></div>:today.slice(0,5).map(a=><div key={a.id} className="flex flex-wrap gap-4 items-center justify-between py-4 border-t border-slate-200"><div><h3 className="font-semibold text-sm">{a.profiles?.full_name||'Patient'}</h3><p className="text-xs text-slate-500 mt-2">{serviceName(a)} · {a.time_slot}</p></div><span className={'status-badge status-'+normalizeStatus(a.status)}>{statusLabel(a.status)}</span></div>)}</section>
  </div>
}

