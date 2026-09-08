import { ArrowUpRight, Clock, Stethoscope, Sparkles, ShieldCheck, Crown, HeartPulse, Smile, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { priceLabel } from '../lib/presentation'
function ServiceIcon({ name }) {
  const props = { size: 25, strokeWidth: 1.5 }
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
  const content = <>
    <div className="flex items-start justify-between gap-3"><span className="service-icon"><ServiceIcon name={service.name} /></span><span className="duration-tag"><Clock size={13} /> {service.duration_minutes || 60} min</span></div>
    <div className="service-copy"><h3>{service.name}</h3><p>{service.description || 'Talk to our team about the right care for your smile.'}</p></div>
    <div className="service-bottom"><div><span>{service.price == null ? 'PERSONALIZED CARE' : 'STARTING FROM'}</span><strong>{priceLabel(service.price)}</strong></div><span className="service-arrow"><ArrowUpRight size={20} /></span></div>
  </>
  return onSelect ? <button type="button" onClick={() => onSelect(service.id)} aria-pressed={selected} className={`service-card glass-panel ${selected ? 'is-selected' : ''}`}>{content}</button> :
    <Link to={user ? bookingPath : `/login?next=${encodeURIComponent(bookingPath)}`} className="service-card glass-panel" aria-label={`Book ${service.name}`}>{content}</Link>
}
