import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, MapPin, ShieldCheck, CalendarDays, Heart, Sparkles } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useQuery } from '../hooks/useQuery'
import { loadServices } from '../lib/queries'
import ServiceCard from '../components/ServiceCard'
import Feedback from '../components/Feedback'
import SmileArt from '../components/SmileArt'
export default function Home() {
  const { user } = useAuth()
  const services = useQuery(loadServices,[])
  const bookPath = user ? '/dashboard/book' : '/login?next=%2Fdashboard%2Fbook'
  return <div className="home-page">
    <section className="hero-section">
      <div className="hero-copy"><span className="location-pill"><span className="status-dot" /> YOUR SMILE, IN GOOD HANDS</span>
        <h1>A little care.<br />A <span>brighter</span><br className="hero-break" /> you<span className="heading-dot">.</span></h1>
        <p>Feel good about your next dental visit. Personal care, a welcoming space, and a simpler way to make time for your smile.</p>
        <div className="hero-actions"><Link className="btn btn-primary" to={bookPath}>Let's book your visit <ArrowUpRight size={19}/></Link><Link className="text-link" to="/services">Explore our care <ArrowRight size={17}/></Link></div>
        <div className="hero-location"><MapPin size={16}/><span>Guindulman, Bohol <span className="muted-dot">·</span> Dr. Karen Galagatan</span></div>
      </div><SmileArt />
    </section>
    <section className="care-strip glass-panel" aria-label="Our approach">{[[Heart,'Care that listens','A personal approach to every visit.'],[ShieldCheck,'Confidence in your care','Clear guidance for your dental health.'],[CalendarDays,'Your visit, simplified','Find a time that fits your day.']].map(([Icon,title,copy])=><div key={title}><span className="strip-icon"><Icon size={22} strokeWidth={1.5}/></span><div><h2>{title}</h2><p>{copy}</p></div></div>)}</section>
    <section className="home-services"><div className="section-heading"><div><span className="eyebrow">GOOD CARE. MORE REASONS TO SMILE.</span><h2>A smile for every<br className="hidden sm:block"/> version of you.</h2></div><div><p>From your regular checkup to your next smile goal,<br className="hidden md:block"/> find the care that feels right.</p><Link to="/services" className="text-link">View all services <ArrowUpRight size={18}/></Link></div></div>
      <Feedback error={services.error} onRetry={services.refresh}/><div className="service-grid">{services.loading ? Array.from({length:3},(_,i)=><div key={i} className="glass-panel service-skeleton" aria-label="Loading service"/>):services.data.filter(s=>s.is_active!==false).slice(0,3).map(service=><ServiceCard key={service.id} service={service}/>)}</div>
      {!services.loading&&!services.error&&!services.data.some(s=>s.is_active!==false)&&<p className="empty-state">Our team can help you find the right care. <Link to="/contact">Get in touch.</Link></p>}
    </section>
    <section className="visit-banner glass-dark"><div><span className="eyebrow">A FRESH START FOR YOUR SMILE</span><h2>Your next visit.<br/>One less thing to put off.</h2><p>Choose your care, find your time, and leave the rest to us.</p><Link to={bookPath} className="btn btn-primary">Make time for you <ArrowUpRight size={18}/></Link></div><div className="visit-steps">{[['01','Choose your care','Find the service you need.'],['02','Find your moment','See available times in real time.'],['03','You’re on your way','Send your request for clinic confirmation.']].map(([n,title,copy])=><div key={n}><span>{n}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}<Sparkles className="banner-spark" size={42} strokeWidth={1}/></div></section>
  </div>
}

