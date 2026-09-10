import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'

export default function MobileBottomNav({ links, desktopAt = 'lg', onMore, moreActive = false }) {
  const itemClass = active => `flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] sm:text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#226c72] ${active ? 'bg-[#67c4c7]/15 text-[#226c72]' : 'text-slate-600 hover:bg-slate-100'}`
  return (
    <nav aria-label="Bottom navigation" className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(21,52,56,0.08)] ${desktopAt === 'md' ? 'md:hidden' : 'lg:hidden'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'max(8px, env(safe-area-inset-left, 0px))', paddingRight: 'max(8px, env(safe-area-inset-right, 0px))' }}>
      <div className="flex items-stretch gap-1 py-1 max-w-2xl mx-auto">
        {links.map(({to,label,icon:Icon,end=false}) => (
          <NavLink key={to} to={to} end={end} className={({isActive})=>itemClass(isActive)}>
            <Icon size={22} aria-hidden="true"/><span className="leading-tight text-center">{label}</span>
          </NavLink>
        ))}
        {onMore && <button type="button" onClick={onMore} aria-label="Open more navigation options" aria-haspopup="true" className={itemClass(moreActive)}>
          <Menu size={22} aria-hidden="true"/><span>More</span>
        </button>}
      </div>
    </nav>
  )
}
