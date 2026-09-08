import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react'
import ClinicHours from '../components/ClinicHours'

export default function Contact() {
  return (
    <div className="space-y-12 pb-12">
      {/* Page Heading */}
      <div className="text-left space-y-2 max-w-2xl">
        <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">LET’S START WITH HELLO</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          A question?<br/>We’re <span className="italic font-serif text-[#67c4c7]">here for you.</span>
        </h1>
        <p className="text-base text-slate-600 font-normal">Ask about your care, plan your first visit, or simply get to know our clinic.</p>
      </div>
      
      {/* Contact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Contact Details Card */}
        <section className="lg:col-span-6 bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col justify-between space-y-8 text-left">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Find your way to us.</h2>
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#67c4c7]/20 text-[#67c4c7] shrink-0 border border-[#67c4c7]/30">
                <MapPin size={21}/>
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">OUR CLINIC</h3>
                <p className="text-sm text-slate-300 font-normal leading-relaxed">
                  Tabajan, Guindulman, Bohol<br/>
                  Guindulman Guest House<br/>
                  <span className="text-slate-400 text-xs">(formerly Reana Pensione House Bldg.)</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#67c4c7]/20 text-[#67c4c7] shrink-0 border border-[#67c4c7]/30">
                <Phone size={21}/>
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">GIVE US A CALL</h3>
                <div className="space-y-0.5">
                  <a className="block text-sm font-semibold text-white hover:text-[#67c4c7] transition-colors" href="tel:09703857431">0970 385 7431</a>
                  <a className="block text-sm font-semibold text-white hover:text-[#67c4c7] transition-colors" href="tel:09275835783">0927 583 5783</a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#67c4c7]/20 text-[#67c4c7] shrink-0 border border-[#67c4c7]/30">
                <Mail size={21}/>
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">DROP US A LINE</h3>
                <a className="block text-sm font-semibold text-white hover:text-[#67c4c7] transition-colors break-all" href="mailto:dentaprime.ksgdentalclinic@gmail.com">
                  dentaprime.ksgdentalclinic@gmail.com
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <h3 className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC HOURS</h3>
              <div className="text-slate-300 text-sm">
                <ClinicHours/>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <a 
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#67c4c7] hover:text-white transition-colors" 
              href="https://www.facebook.com/profile.php?id=100071177175813" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Meet us on Facebook <ArrowUpRight size={16}/>
            </a>
          </div>
        </section>
        
        {/* Map Section */}
        <section className="lg:col-span-6 bg-white/90 backdrop-blur-md p-3 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden min-h-112.5">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1083.8964633052221!2d124.49064656284963!3d9.763325025879622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aa0b15e8935f6b%3A0x44ab53388f013ff2!2sDENTAPRIME%20DENTAL%20CLINIC!5e0!3m2!1sen!2sph!4v1788888338550!5m2!1sen!2sph" 
            width="100%" 
            height="100%" 
            style={{ border: 0, display: 'block', borderRadius: '1.25rem' }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
        </section>
      </div>
    </div>
  )
}