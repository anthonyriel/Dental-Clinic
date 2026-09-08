import { ArrowUpRight, Check, Sparkles } from 'lucide-react'
export default function SmileArt() {
  return <div className="smile-art" aria-label="Decorative glass tooth illustration">
    <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-grid" />
    <div className="art-glass-square" />
    <div className="art-tooth"><svg viewBox="0 0 280 310" aria-hidden="true"><defs><linearGradient id="tooth-fill" x1="30" y1="20" x2="230" y2="270" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset=".45" stopColor="#edfffc"/><stop offset="1" stopColor="#67c4c7"/></linearGradient><linearGradient id="tooth-edge"><stop stopColor="#fff"/><stop offset="1" stopColor="#a9dedb"/></linearGradient><filter id="tooth-shadow" x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="12" dy="24" stdDeviation="14" floodColor="#347c7e" floodOpacity=".2"/></filter></defs><path d="M140 57C108 23 42 29 45 91c2 44 19 155 53 161 27 4 17-79 43-80 24 0 14 83 42 80 31-4 48-115 51-159 4-62-62-71-94-36Z" fill="url(#tooth-fill)" stroke="url(#tooth-edge)" strokeWidth="4" filter="url(#tooth-shadow)"/><path d="M108 58c16 18 37 21 60 13" stroke="white" strokeOpacity=".9" strokeWidth="6" strokeLinecap="round" fill="none"/><path d="M67 97c-2-25 9-36 24-37" stroke="white" strokeOpacity=".8" strokeWidth="7" strokeLinecap="round" fill="none"/></svg></div>
    <div className="art-floating art-note glass-panel"><span className="icon-disc"><Sparkles size={18} /></span><div><strong>Care, with a personal touch.</strong><span>Your comfort comes first.</span></div></div>
    <div className="art-floating art-visit glass-panel"><div className="flex justify-between gap-5"><span className="eyebrow">YOUR NEXT CHAPTER</span><ArrowUpRight size={18} /></div><strong>A healthier,<br />happier smile.</strong><div className="art-check"><Check size={14} /> It starts with one visit.</div></div>
    <span className="art-star star-one">✦</span><span className="art-star star-two">✧</span><span className="art-dot" />
  </div>
}
