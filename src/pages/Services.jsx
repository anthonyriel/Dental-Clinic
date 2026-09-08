import { useState } from 'react'
import { Search, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '../hooks/useQuery'
import { loadServices } from '../lib/queries'
import Feedback from '../components/Feedback'
import ServiceCard from '../components/ServiceCard'

const categories = [
  ['All care', ''],
  ['Consultation', 'consult|check'],
  ['Fillings', 'fill|restor'],
  ['Prophylaxis', 'proph|clean'],
  ['Whitening', 'whiten'],
  ['Root canal', 'canal'],
  ['Extractions', 'extract'],
  ['Crowns', 'crown']
]

export default function Services() {
  const services = useQuery(loadServices, [])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  const active = services.data.filter(s =>  
    s.is_active !== false &&  
    (!category || new RegExp(category, 'i').test(s.name)) &&  
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-12 pb-12">
      {/* Page Heading */}
      <div className="text-left space-y-2 max-w-2xl">
        <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">THOUGHTFUL CARE, FOR EVERY SMILE</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Find your reason<br/>to <span className="italic font-serif text-[#67c4c7]">smile.</span>
        </h1>
        <p className="text-base text-slate-600 font-normal">Every smile is different. Explore our services and find the right next step for yours.</p>
      </div>
      
      {/* Toolbar: Filter Chips & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-2" aria-label="Service categories">
          {categories.map(([label, value]) => {
            const isSelected = category === value
            return (
              <button 
                key={label} 
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-2xs ${
                  isSelected 
                    ? 'bg-[#67c4c7] text-white shadow-md font-bold' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                aria-pressed={isSelected} 
                onClick={() => setCategory(value)}
              >
                {label}
              </button>
            )
          })}
        </div>
        
        <div className="relative w-full lg:w-80 shrink-0">
          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400"/>
          <input 
            aria-label="Search dental services" 
            placeholder="Find a service..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition shadow-2xs"
          />
        </div>
      </div>

      <Feedback error={services.error} onRetry={services.refresh}/>

      {services.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="border border-slate-200 rounded-3xl p-6 h-64 animate-pulse bg-slate-100 shadow-sm" aria-label="Loading services"/>)}
        </div>
      ) : !services.error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {active.map(s => <ServiceCard key={s.id} service={s}/>)}
        </div>
      )}

      {!services.loading && !services.error && !active.length && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-slate-900">No services match just yet.</h2>
          <p className="text-sm text-slate-600 font-normal">Try another category, or ask our team about this treatment.</p>
          <button 
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition shadow-2xs" 
            onClick={() => { setCategory(''); setSearch(''); }}
          >
            Show all care
          </button>
        </div>
      )}

      {/* Help Footer Banner */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-left">
        <div className="space-y-1">
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">NOT SURE WHERE TO START?</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Let’s talk about your smile.</h2>
          <p className="text-sm text-slate-600 font-normal">Our team can help you understand your options. Listed prices are starting estimates.</p>
        </div>
        <Link 
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold rounded-xl transition shadow-md whitespace-nowrap self-start sm:self-auto text-sm" 
          to="/contact"
        >
          Ask our team <ArrowUpRight size={18}/>
        </Link>
      </div>
    </div>
  )
}