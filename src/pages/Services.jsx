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
    <div className="services-page page-stack">
      <div className="public-page-heading">
        <span className="eyebrow">THOUGHTFUL CARE, FOR EVERY SMILE</span>
        <h1>Find your reason<br/>to <em>smile.</em></h1>
        <p>Every smile is different. Explore our services and find the right next step for yours.</p>
      </div>
      
      <div className="service-toolbar">
        <div className="filter-chips" aria-label="Service categories" style={{ gap: '10px', flexWrap: 'wrap' }}>
          {categories.map(([label, value]) => (
            <button 
              key={label} 
              className={category === value ? 'active' : ''} 
              aria-pressed={category === value} 
              onClick={() => setCategory(value)}
              style={{
                fontSize: '14px',
                fontWeight: '600',
                padding: '10px 16px',
                borderRadius: '9999px',
                transition: 'all 0.2s ease'
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        <label className="search-field">
          <Search size={18}/>
          <input 
            aria-label="Search dental services" 
            placeholder="Find a service" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
        </label>
      </div>

      <Feedback error={services.error} onRetry={services.refresh}/>

      {services.loading ? (
        <div className="service-grid">
          {[1, 2, 3].map(i => <div key={i} className="glass-panel service-skeleton" aria-label="Loading services"/>)}
        </div>
      ) : !services.error && (
        <div className="service-grid">
          {active.map(s => <ServiceCard key={s.id} service={s}/>)}
        </div>
      )}

      {!services.loading && !services.error && !active.length && (
        <div className="glass-panel empty-state">
          <h2>No services match just yet.</h2>
          <p>Try another category, or ask our team about this treatment.</p>
          <button className="btn btn-secondary" onClick={() => { setCategory(''); setSearch(''); }}>
            Show all care
          </button>
        </div>
      )}

      <div className="glass-panel service-help">
        <div>
          <span className="eyebrow">NOT SURE WHERE TO START?</span>
          <h2>Let’s talk about your smile.</h2>
          <p>Our team can help you understand your options. Listed prices are starting estimates.</p>
        </div>
        <Link className="btn btn-secondary" to="/contact">
          Ask our team <ArrowUpRight size={18}/>
        </Link>
      </div>
    </div>
  )
}