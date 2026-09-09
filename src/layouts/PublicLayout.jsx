import { useState } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { Menu, X, ArrowUpRight } from 'lucide-react'
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
  const [menuAt, setMenuAt] = useState(null)
  
  const isOpen = menuAt === location.pathname
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#67c4c7]/30">
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
            
            <button 
              className="md:hidden inline-flex items-center justify-center shrink-0 p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" 
              aria-expanded={isOpen} 
              aria-controls="mobile-navigation" 
              aria-label={isOpen ? 'Close navigation' : 'Open navigation'} 
              onClick={() => setMenuAt(isOpen ? null : location.pathname)}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {isOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-xl">
            <nav 
              id="mobile-navigation" 
              aria-label="Mobile navigation" 
              className="flex flex-col space-y-2 pt-2"
              onKeyDown={e => { if (e.key === 'Escape') setMenuAt(null) }}
            >
              {links.map(([path, label]) => (
                <NavLink 
                  key={path} 
                  to={path} 
                  end={path === '/'} 
                  onClick={() => setMenuAt(null)}
                  className={({ isActive }) => `flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-[#67c4c7]/10 text-[#67c4c7]' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>{label}</span>
                  <ArrowUpRight size={16} className="text-slate-400" />
                </NavLink>
              ))}
            </nav>
            
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link 
                className="w-full py-3 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors" 
                to={user ? '/account' : '/login'} 
                onClick={() => setMenuAt(null)}
              >
                {user ? 'My account' : 'Sign in'}
              </Link>
            </div>
          </div>
        )}
      </header>
      
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Outlet />
      </main>
      
      <SiteFooter />
    </div>
  )
}