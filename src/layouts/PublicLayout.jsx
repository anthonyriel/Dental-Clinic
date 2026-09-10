import { useEffect } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { ArrowUpRight, House, Stethoscope, Images, Mail, UserRound, LogIn } from 'lucide-react'
import MobileBottomNav from '../components/MobileBottomNav'
import Brand from '../components/Brand'
import SiteFooter from '../components/SiteFooter'

const links = [
  ['/', 'Home'],
  ['/services', 'Our services'],
  ['/gallery', 'The clinic'],
  ['/contact', 'Contact']
]

export default function PublicLayout() {
  const { user } = useAuth()
  const location = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  
  return (
    <div className="min-h-screen flex flex-col bg-[#e4f2ef] text-slate-900 selection:bg-[#67c4c7]/30 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <a className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-slate-900" href="#main-content">Skip to content</a>
      
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Brand />
          
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {links.map(([path, label]) => (
              <NavLink 
                key={path} 
                to={path} 
                end={path === '/'}
                className={({ isActive }) => `text-sm font-semibold transition-colors hover:text-[#67c4c7] ${isActive ? 'text-[#67c4c7]' : 'text-slate-600'}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              className="hidden sm:inline-block text-sm font-semibold text-slate-700 hover:text-[#67c4c7] transition-colors px-2 py-1" 
              to={user ? '/account' : '/login'}
            >
              {user ? 'My account' : 'Sign in'}
            </Link>
            
            <Link 
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap" 
              to={user ? '/dashboard/book' : '/login?next=%2Fdashboard%2Fbook'}
            >
              Book now <ArrowUpRight size={16} /> 
            </Link>
            
          </div>
        </div>
        

      </header>
      
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Outlet />
      </main>
      
      <SiteFooter />
      <MobileBottomNav desktopAt="md" links={[
        {to:'/',label:'Home',icon:House,end:true},
        {to:'/services',label:'Services',icon:Stethoscope},
        {to:'/gallery',label:'The clinic',icon:Images},
        {to:'/contact',label:'Contact',icon:Mail},
        {to:user?'/account':'/login',label:user?'Account':'Sign in',icon:user?UserRound:LogIn},
      ]}/>
    </div>
  )
}
