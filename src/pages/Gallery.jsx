import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Image } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { useQuery } from '../hooks/useQuery'
import { result } from '../lib/data'
import Feedback from '../components/Feedback'

const loadGallery = () => result(supabase.from('clinic_gallery').select('*').order('created_at', { ascending: false }))
const categories = [
  ['all', 'All photos'],
  ['reception', 'Welcome space'],
  ['procedure_room', 'Treatment rooms'],
  ['equipment', 'Our equipment'],
  ['clinic', 'Around the clinic']
]

export default function Gallery() {
  const gallery = useQuery(loadGallery, [])
  const [category, setCategory] = useState('all')
  const items = gallery.data.filter(item => category === 'all' || item.category === category)

  return (
    <div className="space-y-12 pb-12">
      <div className="text-left space-y-2 max-w-2xl">
        <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">A SPACE TO FEEL AT EASE</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Get to know<br/>your <span className="italic font-serif text-[#67c4c7]">smile space.</span>
        </h1>
        <p className="text-base text-slate-600 font-normal">A look inside Dentaprime. We look forward to welcoming you in person.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm" aria-label="Gallery categories">
        {categories.map(([value, label]) => {
          const isSelected = category === value
          return (
            <button 
              key={value} 
              aria-pressed={isSelected} 
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-2xs ${
                isSelected 
                  ? 'bg-[#67c4c7] text-white shadow-md font-bold' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          )
        })}
      </div>

      <Feedback error={gallery.error} onRetry={gallery.refresh}/>

      {gallery.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-slate-200 rounded-3xl p-6 h-72 animate-pulse bg-slate-100 shadow-sm" aria-label="Loading gallery"/>
          ))}
        </div>
      ) : !gallery.error && items.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <figure key={item.id} className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group text-left flex flex-col justify-between">
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img 
                  loading="lazy" 
                  src={item.image_url} 
                  alt={item.title || 'Dentaprime clinic'} 
                  onError={e => { e.currentTarget.style.display = 'none' }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <figcaption className="p-6 space-y-1">
                <span className="text-[10px] font-extrabold tracking-widest text-[#67c4c7] uppercase">
                  {item.category?.replaceAll('_', ' ') || 'OUR CLINIC'}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{item.title || 'Inside Dentaprime'}</h2>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : !gallery.error && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <Image className="mx-auto text-slate-400" size={36} strokeWidth={1.3}/>
          <h2 className="text-xl font-bold text-slate-900">A closer look is coming.</h2>
          <p className="text-sm text-slate-600 font-normal">No clinic photos are listed in this category yet.</p>
          <Link to="/contact" className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition shadow-2xs">
            Plan your visit <ArrowUpRight size={17}/>
          </Link>
        </div>
      )}
    </div>
  )
}