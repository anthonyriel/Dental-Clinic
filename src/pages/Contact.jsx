import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Phone, Mail } from 'lucide-react'
import Brand from '../components/Brand'
import ClinicHours from '../components/ClinicHours'

export default function Contact() {
  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-12 text-left">
      <div className="border-b border-slate-200/80 pb-6 space-y-2">
        <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">GET IN TOUCH</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">We're here for your smile</h1>
        <p className="text-sm text-slate-600 font-normal">Reach out to our team or visit us at our clinic in Guindulman.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Details Card */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono">Clinic Information</h2>
            
            <div className="space-y-4 text-sm text-slate-600 font-normal">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-[#67c4c7] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">Location</strong>
                  <span>Near Guindulman Guest House, Tabajan, Guindulman, Bohol</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={20} className="text-[#67c4c7] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">Phone Numbers</strong>
                  <p className="font-mono"><a href="tel:09703857431" className="hover:text-[#67c4c7] transition-colors">0970 385 7431</a></p>
                  <p className="font-mono"><a href="tel:09275835783" className="hover:text-[#67c4c7] transition-colors">0927 583 5783</a></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={20} className="text-[#67c4c7] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold">Email</strong>
                  <a href="mailto:dentaprime.ksgdentalclinic@gmail.com" className="hover:text-[#67c4c7] transition-colors">
                    dentaprime.ksgdentalclinic@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono">Operating Hours</h2>
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <ClinicHours />
            </div>
          </div>
        </div>

        {/* Map / Visit Us Card */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Find Your Way to Dentaprime</h2>
            <p className="text-sm text-slate-600 font-normal leading-relaxed">
              We are conveniently located in Tabajan, Guindulman, Bohol. Plan your visit or get directions directly through Google Maps.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm aspect-video bg-slate-100 relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1083.8964633052221!2d124.49064656284963!3d9.763325025879622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aa0b15e8935f6b%3A0x44ab53388f013ff2!2sDENTAPRIME%20DENTAL%20CLINIC!5e0!3m2!1sen!2sph!4v1788888338550!5m2!1sen!2sph" 
              width="100%" 
              height="100%" 
              style={{ border: 0, display: 'block' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <a 
              href="https://maps.app.goo.gl/99MpiZahfAWqputv6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold text-sm shadow-md transition-all"
            >
              Open in Google Maps <ArrowUpRight size={18} />
            </a>
            <Link 
              to="/dashboard/book" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
            >
              Book an appointment <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}