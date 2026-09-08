import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Clock, Heart, Bell } from 'lucide-react'
import { useAuth } from '../../context/auth'
import { useQuery } from '../../hooks/useQuery'
import { loadPatientAppointments } from '../../lib/queries'
import { isUpcoming,serviceName,statusLabel,normalizeStatus } from '../../lib/appointments'
import { visitDateLabel } from '../../lib/presentation'
import Feedback from '../../components/Feedback'
export default function ClientHome() {
  const { user,profile }=useAuth()
  const loader=useCallback(()=>loadPatientAppointments(user.id),[user.id])
  const appointments=useQuery(loader,[],30000)
  const upcoming=appointments.data.filter(a=>isUpcoming(a))
  const next=upcoming[0]
  return <div><div className="page-heading"><div><span className="eyebrow">YOUR SMILE SPACE</span><h1>Hello, {profile?.full_name?.split(' ')[0]||'there'}.</h1><p>A little care for yourself looks good on you.</p></div><Link className="btn btn-primary" to="/dashboard/book">Book a visit <ArrowUpRight size={17}/></Link></div>
    <Feedback error={appointments.error} onRetry={appointments.refresh}/>
    <div className="dashboard-grid"><section className="dashboard-welcome glass-dark"><Heart size={28} strokeWidth={1.3}/><h2>Your smile.<br/>Your next chapter.</h2><p>Check in on your appointments, find your next visit, and keep your details up to date. It’s all here.</p><Link className="btn btn-primary" to="/services">Explore your care <ArrowUpRight size={17}/></Link></section>
    <section className="glass-panel next-visit"><div className="flex items-center justify-between"><h2>Next on your calendar</h2><CalendarDays size={20} className="text-sky-600"/></div>{appointments.loading?<p>Loading your next visit...</p>:appointments.error?<p>Your appointments could not be loaded.</p>:next?<><span className={'status-badge status-'+normalizeStatus(next.status)}>{statusLabel(next.status)}</span><h3>{serviceName(next)}</h3><p>{visitDateLabel(next.appointment_date)}<br/>{next.time_slot}</p>{normalizeStatus(next.status)==='cancellation_requested'&&<p>Your visit remains reserved until cancellation is approved.</p>}<Link className="text-link" to="/dashboard/history">Appointment details <ArrowUpRight size={16}/></Link></>:<><h3>A fresh start awaits.</h3><p>No upcoming visits yet. Let’s find a little time for your smile.</p><Link className="text-link" to="/dashboard/book">Find a time <ArrowUpRight size={16}/></Link></>}</section></div>
    {!appointments.error&&<div className="stat-grid"><Link className="glass-panel stat-card" to="/dashboard/history"><CalendarDays size={21}/><span>Your appointments</span><strong>{appointments.loading?'—':appointments.data.length}</strong><small>Your complete visit history</small></Link><Link className="glass-panel stat-card" to="/dashboard/history"><Clock size={21}/><span>Upcoming visits</span><strong>{appointments.loading?'—':upcoming.length}</strong><small>A little care to look forward to</small></Link></div>}
    <Link to="/dashboard/notifications" className="text-link mt-6"><Bell size={16}/> See your latest appointment updates <ArrowUpRight size={16}/></Link>
  </div>
}

