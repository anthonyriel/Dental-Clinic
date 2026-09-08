import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Feedback({ error, message, onRetry }) {
  if (!error && !message) return null

  return (
    <div 
      role={error ? 'alert' : 'status'} 
      className={`p-4 rounded-2xl text-sm flex items-center justify-between gap-4 border shadow-2xs text-left ${
        error 
          ? 'bg-red-50 text-red-700 border-red-200' 
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {error ? (
          <AlertCircle size={20} className="shrink-0 text-red-600" />
        ) : (
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
        )}
        <span className="font-medium leading-relaxed">{error || message}</span>
      </div>

      {error && onRetry && (
        <button 
          type="button" 
          className="shrink-0 px-3.5 py-1.5 bg-white border border-red-200 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition shadow-2xs" 
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  )
}