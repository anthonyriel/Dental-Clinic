import { useQuery } from '../hooks/useQuery'
import { loadSettings } from '../lib/queries'
import Feedback from './Feedback'

const timeLabel = value => {
  const [hours, minutes] = value.split(':').map(Number)
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

export default function ClinicHours() {
  const settings = useQuery(loadSettings)

  if (settings.error) {
    return <Feedback error="Clinic hours are unavailable. Please call to confirm." onRetry={settings.refresh} />
  }

  if (!settings.data) {
    return <p className="text-sm text-slate-400 font-normal animate-pulse">Loading clinic hours...</p>
  }

  const s = settings.data
  const daysText = s.opening_days.map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]).join(', ') || 'Online bookings closed'

  return (
    <div className="space-y-2 text-left text-sm">
      <p className="font-bold text-white tracking-wide">
        {daysText}
      </p>
      <p className="font-mono text-slate-300 font-medium">
        {timeLabel(s.morning_start)} – {timeLabel(s.morning_end)} &amp; {timeLabel(s.afternoon_start)} – {timeLabel(s.afternoon_end)}
      </p>
      <p className="text-xs text-slate-500 font-normal leading-relaxed">
        Philippine time. Holiday closures are reflected in appointment availability.
      </p>
    </div>
  )
}