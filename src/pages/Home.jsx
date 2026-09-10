import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, ShieldCheck, CalendarDays, Heart, Sparkles } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useQuery } from '../hooks/useQuery'
import { loadServices } from '../lib/queries'
import ServiceCard from '../components/ServiceCard'
import Feedback from '../components/Feedback'
import SmileArt from '../components/SmileArt'

export default function Home() {
  const { user } = useAuth()
  const services = useQuery(loadServices, [])
  const bookPath = user ? '/dashboard/book' : '/login?next=%2Fdashboard%2Fbook'

  return (
    <div className="space-y-16 lg:space-y-24 pb-12">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-4 lg:pt-10">
        <div className="lg:col-span-6 space-y-6 text-left lg:pr-8 xl:pr-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full text-xs font-bold tracking-wider uppercase border border-[#67c4c7]/20 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#67c4c7] animate-pulse" /> Put your best self forward
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            A little care.<br />A <span className="text-[#67c4c7]">brighter</span> you<span className="text-[#67c4c7]">.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
            Feel good about your next dental visit. Personal care, a welcoming space, and a simpler way to make time for your smile.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link 
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all" 
              to="/services"
            >
              Explore our care <ArrowUpRight size={19}/>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-4">
            <MapPin size={16} className="text-[#67c4c7]"/>
            <span>Guindulman, Bohol <span className="text-slate-300 mx-1">·</span> Dr. Karen Galagatan</span>
          </div>
        </div>

        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <SmileArt />
          </div>
        </div>
      </section>

      {/* Approach / Care Strip */}
      <section className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8" aria-label="Our approach">
        {[
          [Heart, 'Care that listens', 'A personal approach to every visit.'],
          [ShieldCheck, 'Confidence in your care', 'Clear guidance for your dental health.'],
          [CalendarDays, 'Your visit, simplified', 'Find a time that fits your day.']
        ].map(([Icon, title, copy]) => (
          <div key={title} className="flex items-start gap-4 text-left">
            <div className="p-3 rounded-2xl bg-[#67c4c7]/10 text-[#67c4c7] shrink-0 border border-[#67c4c7]/20">
              <Icon size={24} strokeWidth={1.8}/>
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900 text-base">{title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{copy}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Services Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left border-b border-slate-200/80 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">GOOD CARE. MORE REASONS TO SMILE.</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">A smile for every version of you.</h2>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600 font-normal">From your regular checkup to your next smile goal, find the care that feels right.</p>
            <Link to="/services" className="inline-flex items-center gap-1 text-sm font-bold text-[#67c4c7] hover:underline">
              View all services <ArrowUpRight size={18}/>
            </Link>
          </div>
        </div>

        <Feedback error={services.error} onRetry={services.refresh}/>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.loading ? (
            Array.from({length: 3}, (_, i) => (
              <div key={i} className="border border-slate-200 rounded-3xl p-6 h-64 animate-pulse bg-slate-100" aria-label="Loading service"/>
            ))
          ) : (
            services.data.filter(s => s.is_active !== false).slice(0, 3).map(service => (
              <ServiceCard key={service.id} service={service}/>
            ))
          )}
        </div>

        {!services.loading && !services.error && !services.data.some(s => s.is_active !== false) && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <p className="text-sm text-slate-600 font-normal">Our team can help you find the right care. <Link to="/contact" className="text-[#67c4c7] font-bold underline">Get in touch.</Link></p>
          </div>
        )}
      </section>

      {/* Visit Banner Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-slate-800">
        <div className="lg:col-span-6 space-y-4 text-left relative z-10">
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">A FRESH START FOR YOUR SMILE</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Your next visit.<br/>One less thing to put off.</h2>
          <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed">Choose your care, find your time, and leave the rest to us.</p>
          <div className="pt-2">
            <Link 
              to={bookPath} 
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold text-sm shadow-md transition-all"
            >
              Find your reason to smile <ArrowUpRight size={18}/>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4 relative z-10">
          {[
            ['01', 'Choose your care', 'Find the service you need.'],
            ['02', 'Find your moment', 'See available times in real time.'],
            ['03', 'You’re on your way', 'Send your request for clinic confirmation.']
          ].map(([n, title, copy]) => (
            <div key={n} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-md">
              <span className="w-8 h-8 rounded-xl bg-[#67c4c7]/20 text-[#67c4c7] font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[#67c4c7]/30">
                {n}
              </span>
              <div className="space-y-0.5 text-left">
                <h3 className="font-bold text-white text-sm">{title}</h3>
                <p className="text-xs text-slate-400 font-normal">{copy}</p>
              </div>
            </div>
          ))}
          <Sparkles className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none" size={120} strokeWidth={1}/>
        </div>
      </section>
    </div>
  )
}