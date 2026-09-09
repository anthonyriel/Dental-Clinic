import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, History, UserRound, Bell, Stethoscope, Users, SlidersHorizontal, ArrowUpRight, LogOut, Menu, X, BarChart3 } from 'lucide-react'
import Brand from '../components/Brand'
import { useAuth } from '../context/auth'

export default function PortalLayout({ management=false }) {
  const { user, profile, role, signOut } = useAuth()
  const location = useLocation()
  const [menuAt, setMenuAt] = useState(null)
  
  const open = menuAt === location.pathname
  const base = management ? '/management' : '/dashboard'
  
  const links = management 
    ? [
        [base, 'Overview', LayoutDashboard],
        [base+'/schedule', 'Appointments', CalendarDays],
        [base+'/walk-ins', 'Register walk-in', UserRound],
        [base+'/services', 'Services', Stethoscope],
        [base+'/reports', 'Reports', BarChart3],
        [base+'/settings', 'Availability', SlidersHorizontal],
        ...(['admin','owner'].includes(role) ? [[base+'/users', 'People & access', Users]] : [])
      ] 
    : [
        [base, 'Overview', LayoutDashboard],
        [base+'/book', 'Book a visit', CalendarDays],
        [base+'/history', 'My appointments', History]
      ]
      
  links.push([base+'/notifications', 'Updates', Bell], [base+'/profile', 'My profile', UserRound])
  const current = links.find(([path]) => path === location.pathname)?.[1] || 'Your account'
  
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-[#67c4c7]/30">
      <a className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-slate-900" href="#main-content">Skip to content</a>
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-2xl lg:shadow-none flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <Brand stacked />
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors" 
            aria-label="Close navigation" 
            onClick={() => setMenuAt(null)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 pt-6 pb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            {management ? 'CLINIC WORKSPACE' : 'YOUR SMILE SPACE'}
          </span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2" aria-label={management ? 'Management navigation' : 'Patient navigation'}>
          {links.map(([path, label, Icon]) => (
            <NavLink 
              key={path} 
              to={path} 
              end={path === base} 
              onClick={() => setMenuAt(null)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group relative ${
                isActive 
                  ? 'bg-[#67c4c7]/15 text-[#67c4c7] shadow-2xs font-bold' 
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-[#67c4c7]' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="flex-1">{label}</span>
                  {isActive && <span className="w-1.5 h-5 rounded-full bg-[#67c4c7] absolute right-3" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-100 space-y-1">
          <a 
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors" 
            href="https://www.facebook.com/profile.php?id=100071177175813"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Visit Facebook Page</span> 
            <ArrowUpRight size={15} className="text-slate-400"/>
          </a>
          <button 
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors" 
            onClick={signOut}
          >
            <LogOut size={16}/> 
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      
      {open && <button className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden" aria-label="Close navigation" onClick={() => setMenuAt(null)}/>}
      
      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs h-20 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" 
              aria-label="Open navigation" 
              aria-expanded={open} 
              onClick={() => setMenuAt(open ? null : location.pathname)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 truncate">
              <span className="uppercase tracking-wider text-[11px] font-bold text-slate-400">{management ? 'Clinic workspace' : 'My smile space'}</span>
              <span className="text-slate-300">/</span>
              <strong className="text-slate-900 font-bold truncate">{current}</strong>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to={base+'/notifications'} 
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors relative" 
              aria-label="Appointment updates"
            >
              <Bell size={18}/>
            </Link>
            
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <Link to={base+'/profile'} className="w-10 h-10 rounded-full bg-[#67c4c7] text-white font-bold flex items-center justify-center overflow-hidden shadow-inner shrink-0 border-2 border-white" aria-label="My profile">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (profile?.full_name || user?.email || 'P').slice(0,1).toUpperCase()
                )}
              </Link>
              <div className="hidden sm:block text-left leading-tight">
                <strong className="block text-xs font-bold text-slate-900 truncate max-w-140px">{profile?.full_name || 'Welcome'}</strong>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{management ? role : 'Patient account'}</span>
              </div>
            </div>
          </div>
        </header>
        
        <main id="main-content" className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        
        <footer className="px-8 py-6 border-t border-slate-200/80 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Dentaprime - Dr. Karen Galagatan Dental Clinic</span>
          <span className="font-medium text-slate-600">Your smile, in good hands.</span>
        </footer>
      </div>
    </div>
  )
}
