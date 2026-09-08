import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, History, UserRound, Bell, Stethoscope, Users, SlidersHorizontal, ArrowUpRight, LogOut, Menu, X, Heart } from 'lucide-react'
import Brand from '../components/Brand'
import { useAuth } from '../context/auth'
export default function PortalLayout({ management=false }) {
  const { user,profile,role,signOut }=useAuth()
  const location=useLocation()
  const [menuAt,setMenuAt]=useState(null)
  const open=menuAt===location.pathname
  const base=management?'/management':'/dashboard'
  const links=management?[[base,'Overview',LayoutDashboard],[base+'/schedule','Appointments',CalendarDays],[base+'/services','Services',Stethoscope],[base+'/settings','Availability',SlidersHorizontal],...(['admin','owner'].includes(role)?[[base+'/users','People & access',Users]]:[])]:[[base,'Overview',LayoutDashboard],[base+'/book','Book a visit',CalendarDays],[base+'/history','My appointments',History]]
  links.push([base+'/notifications','Updates',Bell],[base+'/profile','My profile',UserRound])
  const current=links.find(([path])=>path===location.pathname)?.[1]||'Your account'
  return <div className="app-shell portal-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    <aside className={`portal-sidebar ${open?'sidebar-open':''}`}><div className="sidebar-brand"><Brand /><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={()=>setMenuAt(null)}><X /></button></div><span className="sidebar-label">{management?'CLINIC WORKSPACE':'YOUR SMILE SPACE'}</span>
      <nav aria-label={management?'Management navigation':'Patient navigation'}>{links.map(([path,label,Icon])=><NavLink key={path} to={path} end={path===base} onClick={()=>setMenuAt(null)}><Icon size={19} strokeWidth={1.7}/>{label}<span className="nav-active-dot"/></NavLink>)}</nav>
      <div className="sidebar-care"><Heart size={22} strokeWidth={1.5}/><strong>A little care.<br/>A brighter you.</strong><Link to="/contact">Need a hand? <ArrowUpRight size={15}/></Link></div>
      <Link className="sidebar-website" to="/">Visit our website <ArrowUpRight size={16}/></Link><button className="sidebar-logout" onClick={signOut}><LogOut size={18}/> Sign out</button>
    </aside>
    {open&&<button className="sidebar-backdrop" aria-label="Close navigation" onClick={()=>setMenuAt(null)}/>}
    <div className="portal-workspace"><header className="portal-header"><div className="flex items-center gap-3 min-w-0"><button className="icon-button portal-menu" aria-label="Open navigation" aria-expanded={open} onClick={()=>setMenuAt(open?null:location.pathname)}><Menu /></button><div className="portal-breadcrumb"><span>{management?'Clinic workspace':'My smile space'}</span><span>/</span><strong>{current}</strong></div></div><div className="portal-user"><Link to={base+'/notifications'} className="icon-button" aria-label="Appointment updates"><Bell size={19}/></Link><Link to={base+'/profile'} className="user-avatar" aria-label="My profile">{profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:(profile?.full_name||user?.email||'P').slice(0,1).toUpperCase()}</Link><div className="portal-user-name"><strong>{profile?.full_name||'Welcome'}</strong><span>{management?role:'Patient account'}</span></div></div></header>
      <main id="main-content" className="portal-content"><Outlet /></main><footer className="portal-footer">Dentaprime Dental Clinic <span>Your smile, in good hands.</span></footer>
    </div>
  </div>
}
