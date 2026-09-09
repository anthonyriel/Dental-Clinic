import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Phone, Mail, ShieldCheck, Info } from 'lucide-react'
import Brand from './Brand'
import ClinicHours from './ClinicHours'

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Brand & Accreditation */}
          <div className="space-y-4">
            <div className="inline-block [&_.text-slate-900]:text-white! [&_.text-slate-500]:text-slate-400!">
              <Brand />
            </div>
            <p className="flex items-start gap-2.5 leading-relaxed bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-xs text-slate-400">
              <Info size={16} className="text-[#67c4c7] shrink-0 mt-0.5" />
              <span><strong>Notice:</strong> Prior appointments preferred; walk-ins subject to availability. Call ahead for urgent inquiries.</span>
            </p>
          </div>

          {/* Column 2: Operational Trust & Landmark Reference */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">Location</h2>
            <div className="space-y-3 text-sm text-slate-400 font-normal">
              <a 
                href="https://maps.app.goo.gl/99MpiZahfAWqputv6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 leading-relaxed hover:text-[#67c4c7] transition-colors group"
              >
                <MapPin size={16} className="text-[#67c4c7] shrink-0 mt-0.5" />
                <span>
                  <strong>Landmark:</strong> Near Guindulman Guest House, Tabajan, Guindulman, Bohol
                  <span className="text-xs text-[#67c4c7] mt-1 font-semibold inline-flex items-center gap-1 group-hover:underline">
                    Open in Google Maps <ArrowUpRight size={13} />
                  </span>
                </span>
              </a>
            </div>
          </div>

          {/* Column 3: Contact Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">Come say hello</h2>
            <div className="space-y-3 text-sm text-slate-400 font-normal">
              <p>
                <a href="tel:09703857431" className="inline-flex items-center gap-2.5 text-slate-400 hover:text-[#67c4c7] transition-colors font-mono">
                  <Phone size={15} className="text-[#67c4c7] shrink-0" /> 0970 385 7431
                </a>
              </p>
              <p>
                <a href="tel:09275835783" className="inline-flex items-center gap-2.5 text-slate-400 hover:text-[#67c4c7] transition-colors font-mono">
                  <Phone size={15} className="text-[#67c4c7] shrink-0" /> 0927 583 5783
                </a>
              </p>
              <p>
                <a href="mailto:dentaprime.ksgdentalclinic@gmail.com" className="inline-flex items-center gap-2.5 text-slate-400 hover:text-[#67c4c7] transition-colors">
                  <Mail size={15} className="text-[#67c4c7] shrink-0" /> dentaprime.ksgdentalclinic@gmail.com
                </a>
              </p>
              <p>
                <a href="https://www.facebook.com/profile.php?id=100071177175813" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#67c4c7] transition-colors pt-1">
                  Follow on Facebook <ArrowUpRight size={14} />
                </a>
              </p>
            </div>
          </div>

          {/* Column 4: Clinic Hours */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">Clinic hours</h2>
            <div className="text-sm text-slate-400 font-normal">
              <ClinicHours />
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-normal">
          <p>© {new Date().getFullYear()} Dentaprime - Dr. Karen Galagatan Dental Clinic.</p>
          <span className="font-bold text-slate-400">Thoughtful care. Brighter everyday smiles.</span>
        </div>
      </div>
    </footer>
  )
}