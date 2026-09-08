import { ArrowUpRight, Clock, Stethoscope, Sparkles, ShieldCheck, Crown, HeartPulse, Smile, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { priceLabel } from '../lib/presentation'

function ServiceIcon({ name }) {
  const props = { size: 20, strokeWidth: 1.8 }
  if (/crown/i.test(name)) return <Crown {...props} />
  if (/whiten/i.test(name)) return <Sparkles {...props} />
  if (/fill|restor/i.test(name)) return <ShieldCheck {...props} />
  if (/canal|extract/i.test(name)) return <HeartPulse {...props} />
  if (/proph|clean/i.test(name)) return <Smile {...props} />
  if (/brace|ortho/i.test(name)) return <ScanLine {...props} />
  return <Stethoscope {...props} />
}

export default function ServiceCard({ service, selected, onSelect }) {
  const { user } = useAuth()
  const bookingPath = `/dashboard/book?service=${encodeURIComponent(service.id)}`

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="p-3 rounded-2xl bg-[#67c4c7]/10 text-[#67c4c7] group-hover:bg-[#67c4c7]/20 transition-colors">
          <ServiceIcon name={service.name} />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
          <Clock size={13} /> {service.duration_minutes || 60} min
        </span>
      </div>

      <div className="space-y-1.5 my-4">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#67c4c7] transition-colors">{service.name}</h3>
        <p className="text-sm text-slate-600 font-normal leading-relaxed line-clamp-2">
          {service.description || 'Talk to our team about the right care for your smile.'}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase block font-mono">
            {service.price == null ? 'PERSONALIZED CARE' : 'STARTING FROM'}
          </span>
          <strong className="text-base font-extrabold text-slate-900 font-mono">
            {priceLabel(service.price)}
          </strong>
        </div>
        <span className="p-2.5 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-[#67c4c7] group-hover:text-white transition-all shadow-2xs">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </>
  )

  const baseClasses = `w-full bg-white/90 backdrop-blur-md border rounded-3xl p-6 shadow-sm transition-all text-left flex flex-col justify-between group cursor-pointer ${
    selected 
      ? 'border-[#67c4c7] bg-[#67c4c7]/5 ring-2 ring-[#67c4c7]/20 shadow-md' 
      : 'border-slate-200/80 hover:border-[#67c4c7]/50 hover:shadow-md'
  }`

  return onSelect ? (
    <button 
      type="button" 
      onClick={() => onSelect(service.id)} 
      aria-pressed={selected} 
      className={baseClasses}
    >
      {content}
    </button>
  ) : (
    <Link 
      to={user ? bookingPath : `/login?next=${encodeURIComponent(bookingPath)}`} 
      className={baseClasses} 
      aria-label={`Book ${service.name}`}
    >
      {content}
    </Link>
  )
}