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
  const itemClass = active => `flex min-h-16 min-w-min shrink-0 grow basis-20 flex-col items-center justify-center gap-1 rounded-full border px-3 text-[10px] sm:text-xs font-semibold transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none active:bg-white/40 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#226c72] ${active ? 'border-white/45 bg-[#67c4c7]/15 text-[#18575d] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_8px_rgba(36,100,104,0.06)] hover:bg-[#67c4c7]/20' : 'border-transparent text-[#304749] hover:border-white/35 hover:bg-white/25 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]'}`
  return (
    <nav aria-label="Bottom navigation" className={`fixed inset-x-0 z-30 pointer-events-none ${desktopAt === 'md' ? 'md:hidden' : 'lg:hidden'}`}
      style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))', paddingRight: 'max(12px, env(safe-area-inset-right, 0px))' }}>
      <div ref={scroller} className="floating-nav-scroll pointer-events-auto flex items-stretch gap-1 p-1.5 max-w-2xl mx-auto overflow-x-auto overscroll-x-contain rounded-full border border-white/45 bg-[#e4f2ef]/85 backdrop-blur-xl backdrop-saturate-110 shadow-[0_10px_30px_-10px_rgba(21,52,56,0.18),0_2px_6px_rgba(21,52,56,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]">
        {links.map(({to,label,icon:Icon,end=false}) => (
          <NavLink key={to} to={to} end={end} className={({isActive})=>itemClass(isActive)}>
            <Icon size={22} aria-hidden="true"/><span className="leading-tight text-center" style={{ overflowWrap: 'normal', wordBreak: 'normal' }}>{label}</span>
          </NavLink>
        ))}
        {onSignOut && <button type="button" onClick={onSignOut} className={itemClass(false)}>
          <LogOut size={22} aria-hidden="true"/><span style={{ overflowWrap: 'normal', wordBreak: 'normal' }}>Sign out</span>
        </button>}
      </div>
    </nav>
  )
}
