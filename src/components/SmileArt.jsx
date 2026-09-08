import { ArrowUpRight, Check, Sparkles } from 'lucide-react'

export default function SmileArt() {
  return (
    <div className="relative w-full h-full min-h-420px flex items-center justify-center select-none overflow-hidden p-8" aria-label="Decorative glass tooth illustration">
      {/* Background Orbits & Grid */}
      <div className="absolute w-72 h-72 rounded-full border border-[#67c4c7]/20 animate-pulse pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full border border-slate-200/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#67c4c7_1px,transparent_1px)] bg-size-[24px_24px] opacity-20 pointer-events-none" />

      {/* Glass Square Backdrop */}
      <div className="absolute w-64 h-64 bg-linear-to-br from-white/60 to-[#67c4c7]/10 backdrop-blur-xl rounded-3xl border border-white/80 shadow-xl pointer-events-none" />

      {/* Tooth Illustration */}
      <div className="relative z-10 w-48 sm:w-56 drop-shadow-2xl">
        <svg viewBox="0 0 280 310" aria-hidden="true" className="w-full h-auto">
          <defs>
            <linearGradient id="tooth-fill" x1="30" y1="20" x2="230" y2="270" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff"/>
              <stop offset=".45" stopColor="#edfffc"/>
              <stop offset="1" stopColor="#67c4c7"/>
            </linearGradient>
            <linearGradient id="tooth-edge">
              <stop stopColor="#fff"/>
              <stop offset="1" stopColor="#a9dedb"/>
            </linearGradient>
            <filter id="tooth-shadow" x="-40%" y="-30%" width="180%" height="180%">
              <feDropShadow dx="12" dy="24" stdDeviation="14" floodColor="#347c7e" floodOpacity=".2"/>
            </filter>
          </defs>
          <path d="M140 57C108 23 42 29 45 91c2 44 19 155 53 161 27 4 17-79 43-80 24 0 14 83 42 80 31-4 48-115 51-159 4-62-62-71-94-36Z" fill="url(#tooth-fill)" stroke="url(#tooth-edge)" strokeWidth="4" filter="url(#tooth-shadow)"/>
          <path d="M108 58c16 18 37 21 60 13" stroke="white" strokeOpacity=".9" strokeWidth="6" strokeLinecap="round" fill="none"/>
          <path d="M67 97c-2-25 9-36 24-37" stroke="white" strokeOpacity=".8" strokeWidth="7" strokeLinecap="round" fill="none"/>
        </svg>
      </div>

      {/* Floating Note Card */}
      <div className="absolute bottom-6 left-4 sm:left-8 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-lg flex items-center gap-3 text-left max-w-xs">
        <span className="w-10 h-10 rounded-xl bg-[#67c4c7]/10 text-[#67c4c7] flex items-center justify-center shrink-0 border border-[#67c4c7]/20">
          <Sparkles size={18} />
        </span>
        <div className="space-y-0.5">
          <strong className="block text-xs font-bold text-slate-900">Care, with a personal touch.</strong>
          <span className="block text-[11px] text-slate-500 font-normal">Your comfort comes first.</span>
        </div>
      </div>

      {/* Floating Visit Card */}
      <div className="absolute top-6 right-4 sm:right-8 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-lg space-y-2 text-left max-w-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="text-[10px] font-extrabold tracking-widest text-[#67c4c7] uppercase">YOUR NEXT CHAPTER</span>
          <ArrowUpRight size={16} className="text-slate-400" />
        </div>
        <strong className="block text-sm font-extrabold text-slate-900 leading-tight">A healthier,<br />happier smile.</strong>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
          <Check size={13} /> It starts with one visit.
        </div>
      </div>

      {/* Decorative Stars / Dots */}
      <span className="absolute top-12 left-10 text-[#67c4c7] text-lg animate-bounce pointer-events-none">✦</span>
      <span className="absolute bottom-16 right-12 text-[#67c4c7] text-sm animate-pulse pointer-events-none">✧</span>
      <span className="absolute top-1/3 right-8 w-2 h-2 rounded-full bg-[#67c4c7] opacity-60 pointer-events-none" />
    </div>
  )
}