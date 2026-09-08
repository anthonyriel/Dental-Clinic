import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Phone, Mail } from 'lucide-react'
import Brand from './Brand'
import ClinicHours from './ClinicHours'
export default function SiteFooter() {
  return <footer className="site-footer"><div className="site-container">
    <div className="footer-grid">
      <div><Brand /><p className="footer-description">A little care goes a long way.<br />Make time for your smile.</p><span className="eyebrow">DR. KAREN GALAGATAN</span></div>
      <div><h2>Find your way</h2><Link to="/services">Our services <ArrowUpRight size={14} /></Link><Link to="/gallery">Inside the clinic <ArrowUpRight size={14} /></Link><Link to="/contact">Get in touch <ArrowUpRight size={14} /></Link><Link to="/dashboard/book">Book a visit <ArrowUpRight size={14} /></Link></div>
      <div><h2>Come say hello</h2><p className="footer-contact"><MapPin size={16} /> Tabajan, Guindulman, Bohol<br />Guindulman Guest House</p><a href="tel:09703857431"><Phone size={15} /> 0970 385 7431</a><a href="mailto:dentaprime.ksgdentalclinic@gmail.com"><Mail size={15} /> Email our team</a><a href="https://www.facebook.com/profile.php?id=100071177175813" target="_blank" rel="noopener noreferrer">Follow on Facebook <ArrowUpRight size={14} /></a></div>
      <div className="footer-hours"><h2>Clinic hours</h2><ClinicHours /></div>
    </div>
    <div className="footer-bottom"><p>© {new Date().getFullYear()} Dentaprime - Dr. Karen Galagatan Dental Clinic.</p><span>Thoughtful care. Brighter everyday smiles.</span></div>
  </div></footer>
}
