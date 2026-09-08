import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react'
import ClinicHours from '../components/ClinicHours'

export default function Contact() {
  return (
    <div className="page-stack">
      <div className="public-page-heading">
        <span className="eyebrow">LET’S START WITH HELLO</span>
        <h1>A question?<br/>We’re <em>here for you.</em></h1>
        <p>Ask about your care, plan your first visit, or simply get to know our clinic.</p>
      </div>
      
      <div className="contact-grid">
        <section className="glass-dark contact-details">
          <h2>Find your way to us.</h2>
          <div className="contact-method">
            <MapPin size={21}/>
            <div>
              <h3>OUR CLINIC</h3>
              <p>Tabajan, Guindulman, Bohol<br/>Guindulman Guest House<br/>(formerly Reana Pensione House Bldg.)</p>
            </div>
          </div>
          <div className="contact-method">
            <Phone size={21}/>
            <div>
              <h3>GIVE US A CALL</h3>
              <a className="block min-h-11" href="tel:09703857431">0970 385 7431</a>
              <a className="block min-h-11" href="tel:09275835783">0927 583 5783</a>
            </div>
          </div>
          <div className="contact-method">
            <Mail size={21}/>
            <div>
              <h3>DROP US A LINE</h3>
              <a href="mailto:dentaprime.ksgdentalclinic@gmail.com">dentaprime.ksgdentalclinic@gmail.com</a>
            </div>
          </div>
          <div className="footer-hours">
            <h3>CLINIC HOURS</h3>
            <ClinicHours/>
          </div>
          <a className="text-link text-white!" href="https://www.facebook.com/profile.php?id=100071177175813" target="_blank" rel="noopener noreferrer">
            Meet us on Facebook <ArrowUpRight size={16}/>
          </a>
        </section>
        
        <section className="glass-panel" style={{ padding: 0, overflow: 'hidden', minHeight: '450px' }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1083.8964633052221!2d124.49064656284963!3d9.763325025879622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aa0b15e8935f6b%3A0x44ab53388f013ff2!2sDENTAPRIME%20DENTAL%20CLINIC!5e0!3m2!1sen!2sph!4v1788888338550!5m2!1sen!2sph" 
            width="100%" 
            height="100%" 
            style={{ border: 0, display: 'block' }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
        </section>
      </div>
    </div>
  )
}