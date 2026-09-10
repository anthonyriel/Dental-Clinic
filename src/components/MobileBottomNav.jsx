import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'

export default function MobileBottomNav({ links, desktopAt = 'lg', onSignOut }) {
  const scroller = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => {
    const active = scroller.current?.querySelector('[aria-current="page"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }, [pathname])
  const itemClass = active => `flex min-h-16 min-w-20 shrink-0 grow basis-20 flex-col items-center justify-center gap-1 rounded-full px-3 text-[10px] sm:text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#226c72] ${active ? 'bg-[#67c4c7]/30 text-[#18575d] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_8px_rgba(36,100,104,0.08)]' : 'text-slate-600 hover:bg-white/60'}`
  return (
    <nav aria-label="Bottom navigation" className={`fixed inset-x-0 z-30 pointer-events-none ${desktopAt === 'md' ? 'md:hidden' : 'lg:hidden'}`}
      style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))', paddingRight: 'max(12px, env(safe-area-inset-right, 0px))' }}>
      <div ref={scroller} className="floating-nav-scroll pointer-events-auto flex items-stretch gap-1 p-1.5 max-w-2xl mx-auto overflow-x-auto overscroll-x-contain rounded-full border border-white/80 bg-[#edf9f8]/90 backdrop-blur-xl shadow-[0_12px_36px_-8px_rgba(21,52,56,0.24),0_2px_8px_rgba(21,52,56,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]">
        {links.map(({to,label,icon:Icon,end=false}) => (
          <NavLink key={to} to={to} end={end} className={({isActive})=>itemClass(isActive)}>
            <Icon size={22} aria-hidden="true"/><span className="leading-tight text-center">{label}</span>
          </NavLink>
        ))}
        {onSignOut && <button type="button" onClick={onSignOut} className={itemClass(false)}>
          <LogOut size={22} aria-hidden="true"/><span>Sign out</span>
        </button>}
      </div>
    </nav>
  )
}
