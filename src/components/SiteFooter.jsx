import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Phone, Mail } from 'lucide-react'
import Brand from './Brand'
import ClinicHours from './ClinicHours'

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            {/* Using Tailwind arbitrary variants to override the dark text colors from Brand.jsx */}
            <div className="inline-block [&_.text-slate-900]:text-white! [&_.text-slate-500]:text-slate-400!">
              <Brand />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">Find your way</h2>
            <ul className="space-y-3 text-sm font-medium">
              <li>
                <Link to="/services" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#67c4c7] transition-colors">
                  Our services <ArrowUpRight size={14} />
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#67c4c7] transition-colors">
                  Inside the clinic <ArrowUpRight size={14} />
                </Link>
              </li>
              <li>
                <Link to="/contact" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#67c4c7] transition-colors">
                  Get in touch <ArrowUpRight size={14} />
                </Link>
              </li>
              <li>
                <Link to="/dashboard/book" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#67c4c7] transition-colors">
                  Book a visit <ArrowUpRight size={14} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">Come say hello</h2>
            <div className="space-y-3 text-sm text-slate-400 font-normal">
              <p className="flex items-start gap-2.5 leading-relaxed">
                <MapPin size={16} className="text-[#67c4c7] shrink-0 mt-0.5" /> 
                <span>Tabajan, Guindulman, Bohol<br />Guindulman Guest House</span>
              </p>
              <p>
                <a href="tel:09703857431" className="inline-flex items-center gap-2.5 text-slate-400 hover:text-[#67c4c7] transition-colors font-mono">
                  <Phone size={15} className="text-[#67c4c7] shrink-0" /> 0970 385 7431
                </a>
              </p>
              <p>
                <a href="mailto:dentaprime.ksgdentalclinic@gmail.com" className="inline-flex items-center gap-2.5 text-slate-400 hover:text-[#67c4c7] transition-colors">
                  <Mail size={15} className="text-[#67c4c7] shrink-0" /> Email our team
                </a>
              </p>
              <p>
                <a href="https://www.facebook.com/profile.php?id=100071177175813" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-[#67c4c7] transition-colors">
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