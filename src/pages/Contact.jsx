import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react'
import ClinicHours from '../components/ClinicHours'
export default function Contact() {
  function composeInquiry(e) {
    e.preventDefault()
    const fields=new FormData(e.currentTarget)
    const body='Name: '+fields.get('name')+'\nReply email: '+fields.get('email')+'\n\n'+fields.get('message')
    window.location.href='mailto:dentaprime.ksgdentalclinic@gmail.com?subject='+encodeURIComponent('Clinic inquiry')+'&body='+encodeURIComponent(body)
  }
  return <div className="page-stack"><div className="public-page-heading"><span className="eyebrow">LET’S START WITH HELLO</span><h1>A question?<br/>We’re <em>here for you.</em></h1><p>Ask about your care, plan your first visit, or simply get to know our clinic.</p></div>
    <div className="contact-grid"><section className="glass-dark contact-details"><h2>Find your way to us.</h2><div className="contact-method"><MapPin size={21}/><div><h3>OUR CLINIC</h3><p>Tabajan, Guindulman, Bohol<br/>Guindulman Guest House<br/>(formerly Reana Pensione House Bldg.)</p></div></div><div className="contact-method"><Phone size={21}/><div><h3>GIVE US A CALL</h3><a className="block min-h-11" href="tel:09703857431">0970 385 7431</a><a className="block min-h-11" href="tel:09275835783">0927 583 5783</a></div></div><div className="contact-method"><Mail size={21}/><div><h3>DROP US A LINE</h3><a href="mailto:dentaprime.ksgdentalclinic@gmail.com">dentaprime.ksgdentalclinic@gmail.com</a></div></div><div className="footer-hours"><h3>CLINIC HOURS</h3><ClinicHours/></div><a className="text-link !text-white" href="https://www.facebook.com/profile.php?id=100071177175813" target="_blank" rel="noopener noreferrer">Meet us on Facebook <ArrowUpRight size={16}/></a></section>
    <section className="glass-panel contact-form"><h2>What’s on your mind?</h2><p>We’ll open an email draft with your inquiry. Send it from your email app when you’re ready.</p><form onSubmit={composeInquiry}><label>Your name<input name="name" autoComplete="name" required maxLength={120} placeholder="How should we call you?"/></label><label>Email address<input name="email" autoComplete="email" type="email" required placeholder="you@example.com"/></label><label>Your message<textarea name="message" required maxLength={3000} rows={5} placeholder="Tell us how we can help…"/></label><button className="btn btn-primary" type="submit">Open email draft <ArrowUpRight size={18}/></button><small>If your email app doesn’t open, use the email address beside this form. Your message isn’t sent until you send it there.</small></form></section></div>
  </div>
}

