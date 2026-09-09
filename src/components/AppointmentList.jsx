import { useState } from 'react'
import { CalendarDays, Clock, Search, X, Trash2 } from 'lucide-react'
import { appointmentServices, serviceName, servicePrice, statusLabel, normalizeStatus, patientName, patientPhone } from '../lib/appointments'
import { priceLabel } from '../lib/presentation'

export default function AppointmentList({ appointments, management = false, renderActions, initialDate = '', initialStatus = '', onDelete }) {
  const [search, setSearch] = useState('')
  const [date, setDate] = useState(initialDate)
  const [status, setStatus] = useState(initialStatus)
  const [page, setPage] = useState(0)

  const filtered = appointments.filter(a => 
    (!date || a.appointment_date === date) && 
    (!status || statusLabel(a.status) === status) && 
    `${serviceName(a)} ${patientName(a)} ${patientPhone(a)} ${a.walk_in_name ? 'walk-in' : ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 20) - 1))

  function formatTimestamp(isoString) {
    if (!isoString) return ''
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    }).format(new Date(isoString))
  }

  return (
    <div className="space-y-6 text-left">
      {/* Filters Section */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input 
            aria-label="Search appointments" 
            placeholder={management ? 'Search patient or service...' : 'Search your appointments...'} 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(0) }} 
            className="w-full pl-10 pr-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition" 
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <input 
            aria-label="Filter appointment date" 
            type="date" 
            value={date} 
            onChange={e => { setDate(e.target.value); setPage(0) }} 
            className="px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono" 
          />

          <select 
            aria-label="Filter appointment status" 
            value={status} 
            onChange={e => { setStatus(e.target.value); setPage(0) }} 
            className="px-4 py-2.5 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-700 transition capitalize cursor-pointer"
          >
            <option value="">All statuses</option>
            {['pending', 'confirmed', 'cancellation requested', 'completed', 'cancelled', 'no show'].map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>

          {(search || date || status) && (
            <button 
              type="button" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:text-[#67c4c7] bg-slate-100 hover:bg-slate-200 rounded-xl transition" 
              onClick={() => { setSearch(''); setDate(''); setStatus(''); setPage(0) }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List / Content Section */}
      <div className="space-y-4">
        {!filtered.length ? (
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
            <CalendarDays className="mx-auto text-slate-400" size={36} strokeWidth={1.5}/>
            <h2 className="text-base font-bold text-slate-900">Nothing on this list just yet.</h2>
            <p className="text-sm font-normal text-slate-500">
              {search || date || status ? 'Try a different date, service, or status.' : 'Your appointments will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.slice(currentPage * 20, currentPage * 20 + 20).map(a => {
              const statusNorm = normalizeStatus(a.status)
              const targetDateStr = (statusNorm === 'completed' && a.completed_at) ? a.completed_at.slice(0, 10) :
                                    (statusNorm === 'cancelled' && a.cancelled_at) ? a.cancelled_at.slice(0, 10) :
                                    a.appointment_date

              const monthShort = new Date(targetDateStr + 'T12:00:00+08:00').toLocaleString('en-PH', { month: 'short', timeZone: 'Asia/Manila' })
              const dayNum = Number(targetDateStr.slice(-2))

              return (
                <article key={a.id} className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6 transition hover:border-[#67c4c7]/50">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 bg-[#67c4c7]/10 text-[#67c4c7] border border-[#67c4c7]/20 rounded-2xl p-3 text-center min-w-17.5 font-mono shadow-2xs">
                      <span className="block text-[11px] font-bold uppercase tracking-wider">{monthShort}</span>
                      <strong className="block text-xl font-extrabold text-slate-900 leading-tight">{dayNum}</strong>
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      {management && (
                        <p className="text-xs font-bold text-[#67c4c7] uppercase tracking-wider truncate">
                          {patientName(a)} {a.walk_in_name && <span className="text-slate-700">(Walk-in)</span>} · <span className="font-mono text-slate-600">{patientPhone(a) || 'No phone listed'}</span>
                        </p>
                      )}
                      <h3 className="font-extrabold text-base text-slate-900 break-words">{serviceName(a)}</h3>
                      {appointmentServices(a).length > 1 && (
                        <ul className="space-y-2 py-2 text-xs text-slate-600" aria-label="Services in this visit">
                          {appointmentServices(a).map(service => (
                            <li key={service.id} className="flex flex-wrap justify-between gap-1 border-b border-slate-100 pb-1">
                              <span className="break-words">{service.service_name} · {service.duration_minutes} min</span>
                              <span>{priceLabel(service.quoted_price)}{service.quoted_price != null && ' quoted'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                        {statusNorm === 'completed' && a.completed_at ? (
                          <span className="inline-flex items-center gap-1 font-mono text-emerald-700">
                            <Clock size={14} className="text-emerald-600" /> Completed: {formatTimestamp(a.completed_at)}
                          </span>
                        ) : statusNorm === 'cancelled' && a.cancelled_at ? (
                          <span className="inline-flex items-center gap-1 font-mono text-red-700">
                            <Clock size={14} className="text-red-600" /> Cancelled: {formatTimestamp(a.cancelled_at)}
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 font-mono"><CalendarDays size={14} className="text-[#67c4c7]" />{a.appointment_date}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-mono"><Clock size={14} className="text-[#67c4c7]" />{a.time_slot}</span>
                          </>
                        )}
                      </div>

                      {a.cancellation_reason && (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium mt-2">
                          <strong className="font-bold">Cancellation request:</strong> {a.cancellation_reason}
                        </p>
                      )}
                      {a.cancellation_resolution && (
                        <p className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium mt-1">
                          <strong className="font-bold">Clinic response:</strong> {a.cancellation_resolution}
                        </p>
                      )}
                      {a.notes && (
                        <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium mt-1">
                          <strong className="font-bold">Clinic Note:</strong> {a.notes}
                        </p>
                      )}

                      <div className="pt-2">
                        {renderActions?.(a)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between shrink-0 border-t pt-4 border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className={'px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider status-' + statusNorm}>
                        {statusLabel(a.status)}
                      </span>
                      {management && (statusNorm === 'cancelled' || statusNorm === 'no_show') && onDelete && (
                        <button 
                          type="button"
                          onClick={() => onDelete(a)}
                          className="p-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition shadow-2xs"
                          title="Permanently remove appointment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {servicePrice(a) != null && (
                      <div className="text-right font-mono">
                        <strong className="block text-sm font-extrabold text-slate-900">{priceLabel(servicePrice(a))}</strong>
                        <small className="block text-[10px] text-slate-400 font-sans font-medium">
                          {statusNorm === 'completed' && a.price != null ? 'Recorded visit total' : a.quote_is_estimate ? 'Estimated quote' : 'Quoted price'}
                        </small>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 text-sm font-medium text-slate-600">
          <button 
            disabled={currentPage === 0} 
            onClick={() => setPage(currentPage - 1)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs shadow-2xs"
          >
            Previous
          </button>
          <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono">
            Page {currentPage + 1} · {filtered.length} appointments
          </span>
          <button 
            disabled={(currentPage + 1) * 20 >= filtered.length} 
            onClick={() => setPage(currentPage + 1)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs shadow-2xs"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
