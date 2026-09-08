import { Link } from 'react-router-dom'

export default function Brand({ compact = false, stacked = false }) {
  return (
    <Link to="/" className="brand flex items-center gap-2.5" aria-label="Dentaprime home">
      <span className="brand-mark shrink-0">
        <img 
          src="/images/dentaprime.png" 
          alt="Dentaprime Logo" 
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full" 
        />
      </span>
      {!compact && (
        <span className="brand-type">
          Dentaprime
          <span style={stacked ? { fontSize: '9px', lineHeight: '1.1', display: 'block', marginTop: '2px', letterSpacing: '0.02em' } : {}}>
            {stacked ? (
              <>DR. KAREN GALAGATAN<br />DENTAL CLINIC</>
            ) : (
              'DR. KAREN GALAGATAN DENTAL CLINIC'
            )}
          </span>
        </span>
      )}
    </Link>
  )
}