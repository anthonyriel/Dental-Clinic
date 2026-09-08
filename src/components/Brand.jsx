import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
export default function Brand({ compact = false }) {
  return <Link to="/" className="brand" aria-label="Dentaprime home">
    <span className="brand-mark"><svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 7C11 3 3 5 4 13c1 6 3 17 7 17 3 0 2-10 5-10s2 10 5 10c4 0 6-11 7-17 1-8-7-10-12-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 8c2 2 5 3 8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><Sparkles className="brand-spark" /></span>
    {!compact && <span className="brand-type">dentaprime<span>DENTAL CLINIC</span></span>}
  </Link>
}
