export default function Feedback({ error, message, onRetry }) {
  if (!error && !message) return null
  return <div role={error ? 'alert' : 'status'} className={`p-4 rounded-xl text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
    {error || message}
    {error && onRetry && <button type="button" className="ml-3 underline font-semibold" onClick={onRetry}>Try again</button>}
  </div>
}
