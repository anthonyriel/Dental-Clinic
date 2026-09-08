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
    <div className="app-shell public-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="site-container header-inner">
          <Brand />
          
          <nav className="desktop-nav" aria-label="Main navigation" style={{ gap: '2.5rem' }}>
            {links.map(([path, label]) => (
              <NavLink 
                key={path} 
                to={path} 
                end={path === '/'}
                style={{ fontSize: '16px', fontWeight: '500' }}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          
          <div className="header-actions">
            <Link className="header-login" to={user ? '/account' : '/login'} style={{ fontSize: '16px', fontWeight: '500' }}>
              {user ? 'My account' : 'Sign in'}
            </Link>
            
            <Link 
              className="btn btn-primary header-book" 
              to={user ? '/dashboard/book' : '/login?next=%2Fdashboard%2Fbook'}
              style={{ 
                whiteSpace: 'nowrap', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '15px', 
                fontWeight: '600',
                padding: '10px 18px' 
              }}
            >
              Book now <ArrowUpRight size={16} /> 
            </Link>
            
            <button 
              className="icon-button menu-toggle" 
              aria-expanded={isOpen} 
              aria-controls="mobile-navigation" 
              aria-label={isOpen ? 'Close navigation' : 'Open navigation'} 
              onClick={() => setMenuAt(isOpen ? null : location.pathname)}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        
        {isOpen && (
          <nav 
            id="mobile-navigation" 
            aria-label="Mobile navigation" 
            className="mobile-nav site-container" 
            onKeyDown={e => { if (e.key === 'Escape') setMenuAt(null) }}
          >
            {links.map(([path, label]) => (
              <NavLink key={path} to={path} end={path === '/'} onClick={() => setMenuAt(null)}>
                {label} <ArrowUpRight size={16} />
              </NavLink>
            ))}
          </nav>
        )}
        
        {isOpen && (
          <div className="mobile-account site-container">
            <Link 
              className="btn btn-secondary" 
              to={user ? '/account' : '/login'} 
              onClick={() => setMenuAt(null)}
            >
              {user ? 'My account' : 'Sign in'}
            </Link>
          </div>
        )}
      </header>
      
      <main id="main-content" className="public-main site-container">
        <Outlet />
      </main>
      
      <SiteFooter />
    </div>
  )
}