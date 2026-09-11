import { Link } from 'react-router-dom'

export default function Brand({ compact = false, stacked = false }) {
  return (
    <Link to="/" className="group flex items-center gap-3 text-left focus:outline-none" aria-label="Dentaprime home">
      <span className="shrink-0 rounded-2xl p-1 bg-[#67c4c7]/10 border border-[#67c4c7]/20 transition-transform group-hover:scale-105 shadow-2xs">
        <img 
          src="/images/dentaprime.png" 
          alt="Dentaprime Logo" 
          className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full" 
        />
      </span>
      {!compact && (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#67c4c7] tracking-tight text-base sm:text-lg leading-none group-hover:text-slate-900 transition-colors">
            Dentaprime
          </span>
          <span className={stacked ? "text-[11px] sm:text-[12px] font-bold text-slate-500 tracking-wider mt-1 leading-tight block font-mono" : "text-[11px] sm:text-[12px] font-bold text-slate-500 tracking-wider mt-0.5 leading-tight block font-mono"}>
            DENTAL CLINIC<br />
            <span className="font-sans font-medium tracking-normal text-[10px] sm:text-[11px] text-slate-500 block mt-0.5">
              Dr. Karen Galagatan
            </span>
          </span>
        </div>
      )}
    </Link>
  )
}