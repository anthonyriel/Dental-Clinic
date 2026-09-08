import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Image } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { useQuery } from '../hooks/useQuery'
import { result } from '../lib/data'
import Feedback from '../components/Feedback'
const loadGallery=()=>result(supabase.from('clinic_gallery').select('*').order('created_at',{ascending:false}))
const categories=[['all','All photos'],['reception','Welcome space'],['procedure_room','Treatment rooms'],['equipment','Our equipment'],['clinic','Around the clinic']]
export default function Gallery() {
  const gallery=useQuery(loadGallery,[])
  const [category,setCategory]=useState('all')
  const items=gallery.data.filter(item=>category==='all'||item.category===category)
  return <div className="page-stack"><div className="public-page-heading"><span className="eyebrow">A SPACE TO FEEL AT EASE</span><h1>Get to know<br/>your <em>smile space.</em></h1><p>A look inside Dentaprime. We look forward to welcoming you in person.</p></div><div className="filter-chips justify-center">{categories.map(([value,label])=><button key={value} aria-pressed={category===value} className={value===category?'active':''} onClick={()=>setCategory(value)}>{label}</button>)}</div><Feedback error={gallery.error} onRetry={gallery.refresh}/>
    {gallery.loading?<p className="empty-state">Loading the clinic gallery...</p>:!gallery.error&&items.length?<div className="service-grid">{items.map(item=><figure key={item.id} className="glass-panel gallery-card"><div><img loading="lazy" src={item.image_url} alt={item.title||'Dentaprime clinic'} onError={e=>{e.currentTarget.style.display='none'}}/></div><figcaption><span className="eyebrow">{item.category?.replaceAll('_',' ')||'OUR CLINIC'}</span><h2>{item.title||'Inside Dentaprime'}</h2></figcaption></figure>)}</div>:!gallery.error&&<div className="glass-panel empty-state"><Image className="mx-auto mb-4" size={30} strokeWidth={1.3}/><h2>A closer look is coming.</h2><p>No clinic photos are listed in this category yet.</p><Link to="/contact" className="btn btn-secondary">Plan your visit <ArrowUpRight size={17}/></Link></div>}
  </div>
}

