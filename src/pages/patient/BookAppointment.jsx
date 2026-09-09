import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, CheckCircle2, CalendarDays, Clock, Heart, ShieldCheck, UserRound, AlertTriangle } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../context/auth'
import { useQuery } from '../../hooks/useQuery'
import { loadServices, loadSettings } from '../../lib/queries'
import { errorMessage, result, updateOne } from '../../lib/data'
import { priceLabel, visitDateLabel } from '../../lib/presentation'
import ServiceCard from '../../components/ServiceCard'
import SlotPicker from '../../components/SlotPicker'
import Feedback from '../../components/Feedback'
import { formatMobile, normalizeMobile } from '../../lib/phone'

const stepNames = ['Your care', 'Your time', 'Your details', 'Review']

export default function BookAppointment() {
  const { user, profile, refreshProfile } = useAuth()
  const [params] = useSearchParams()
  const services = useQuery(loadServices, [])
  const settings = useQuery(loadSettings)
  const [serviceId, setServiceId] = useState(params.get('service') || '')
  const [step, setStep] = useState(0)
  const [slot, setSlot] = useState(null)
  const [details, setDetails] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const heading = useRef(null)
  const inFlight = useRef(false)
  
  const selected = services.data.find(s => String(s.id) === String(serviceId) && s.is_active !== false)
  
  useEffect(() => { heading.current?.focus() }, [step, success])
  
  function selectService(id) { 
    setServiceId(id)
    setSlot(null)
    setError('') 
  }

  function handlePhoneChange(e) {
    setDetails({...details, phone: e.target.value})
  }
  
  async function submit(e) {
    e.preventDefault()
    setError('')
    const cleanPhone = normalizeMobile(details.phone)
    if (step >= 2 && (!details.full_name.trim() || !cleanPhone)) {
      setError('Enter your name and a valid Philippine mobile number, such as 0912 345 6789 or +63 912 345 6789.')
      setStep(2)
      return
    }

    if (step < 3) {
      if (!selected) { setStep(0); return }
      if (step === 1 && !slot) return
      if (step === 2 && (!details.full_name.trim() || !cleanPhone)) { 
        setError('Please enter your name and contact number.')
        return 
      }
      setStep(step + 1)
      return
    }
    if (inFlight.current || !selected || !slot || !settings.data) return
    inFlight.current = true
    setBusy(true)
    try {
      if (details.full_name.trim() !== profile.full_name || cleanPhone !== profile.phone) {
        await updateOne('profiles', user.id, { full_name: details.full_name.trim(), phone: cleanPhone })
        refreshProfile()
      }
      await result(supabase.rpc('book_appointment', { p_service_id: String(serviceId), p_date: slot.appointment_date, p_time_slot: slot.time_slot }))
      setSuccess(true)
    } catch (err) { 
      setError(errorMessage(err))
      setSlot(null)
      setStep(1) 
    } finally { 
      setBusy(false)
      inFlight.current = false 
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">MAKE TIME FOR YOUR SMILE</span>
          <h1 tabIndex={-1} ref={heading} className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {success ? 'You’re one step closer.' : 'Let’s plan your visit.'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-normal">A little time for yourself. A good reason to smile.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#67c4c7]/10 text-[#67c4c7] rounded-full text-xs font-bold border border-[#67c4c7]/20 shadow-2xs self-start">
          <ShieldCheck size={16}/> Your personal smile space
        </div>
      </div>

      {success ? (
        <section className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <CheckCircle2 size={36} strokeWidth={1.8}/>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">REQUEST RECEIVED</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">We look forward<br/>to seeing your smile.</h2>
            <p className="text-sm text-slate-600 font-normal">Your appointment is pending clinic confirmation. Check your appointment updates for the next step.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <strong className="block text-base font-bold text-slate-900">{selected?.name}</strong>
            <span className="text-xs font-semibold text-slate-500">{visitDateLabel(slot?.appointment_date)} · {slot?.time_slot}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold text-sm shadow-md transition-all inline-flex items-center justify-center gap-2" to="/dashboard/history">
              View my appointments <ArrowRight size={18}/>
            </Link>
            <Link className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all" to="/dashboard">
              Back to overview
            </Link>
          </div>
        </section>
      ) : (
        <>
          <ol className="flex items-center justify-between gap-2 max-w-3xl mx-auto py-4" aria-label="Booking progress">
            {stepNames.map((name, i) => {
              const isCurrent = i === step
              const isComplete = i < step
              return (
                <li key={name} className={`flex items-center gap-3 ${isCurrent ? 'opacity-100' : isComplete ? 'opacity-80' : 'opacity-40'}`} aria-current={isCurrent ? 'step' : undefined}>
                  <span className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 border ${
                    isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    isCurrent ? 'bg-[#67c4c7] text-white border-[#67c4c7] shadow-sm' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {isComplete ? <Check size={15}/> : String(i + 1).padStart(2, '0')}
                  </span>
                  <strong className={`hidden sm:inline text-xs sm:text-sm font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{name}</strong>
                </li>
              )
            })}
          </ol>

          <Feedback error={error || services.error || settings.error} onRetry={() => { setError(''); services.refresh(); settings.refresh() }}/>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form onSubmit={submit} className="lg:col-span-8 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">STEP {String(step + 1).padStart(2, '0')} OF 04</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {['What brings you in?', 'Find your perfect moment.', 'A little about you.', 'Looking good. Let’s review.'][step]}
                </h2>
                <p className="text-sm text-slate-600 font-normal">
                  {['Choose the care you would like to book.', 'Available times match your treatment’s duration.', 'We’ll use these details to contact you about your visit.', 'Check the details below before sending your request.'][step]}
                </p>
              </div>

              {step === 0 && (
                <>
                  {services.loading ? (
                    <p role="status" className="text-sm text-slate-500 py-8 text-center">Loading your care options...</p>
                  ) : serviceId ? (
                    <div className="space-y-4">
                      <div className="max-w-md">
                        {services.data.filter(s => String(s.id) === String(serviceId)).map(service => (
                          <ServiceCard key={service.id} service={service} selected={true} onSelect={selectService}/>
                        ))}
                      </div>
                      <div>
                        <button 
                          type="button" 
                          onClick={() => { setServiceId(''); setSlot(null); }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#67c4c7] hover:underline"
                        >
                          ← Choose a different service
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {services.data.filter(s => s.is_active !== false).map(service => (
                        <ServiceCard key={service.id} service={service} selected={String(service.id) === String(serviceId)} onSelect={selectService}/>
                      ))}
                    </div>
                  )}
                  {!services.loading && !services.error && !services.data.some(s => s.is_active !== false) && (
                    <p className="text-sm text-slate-600 bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
                      Online services are not currently available. <Link to="/contact" className="text-[#67c4c7] font-bold underline">Contact the clinic.</Link>
                    </p>
                  )}
                </>
              )}

              {step === 1 && (
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4">
                  <SlotPicker key={serviceId} serviceId={serviceId} value={slot} onChange={setSlot} duration={selected?.duration_minutes || 60} calendarSettings={settings.data} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      autoComplete="name" 
                      required 
                      maxLength={120} 
                      value={details.full_name} 
                      onChange={e => setDetails({...details, full_name: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      autoComplete="tel" 
                      required 
                      placeholder="0912 345 6789" 
                      value={details.phone} 
                      onChange={handlePhoneChange}
                      onBlur={() => setDetails(current => ({ ...current, phone: formatMobile(current.phone) }))}
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#67c4c7]/20 focus:border-[#67c4c7] outline-none bg-slate-50/50 text-slate-900 transition font-mono"
                    />
                    <span className="text-xs text-slate-500 block pt-1">Use 09XX XXX XXXX or +63 9XX XXX XXXX.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                    <input 
                      type="email" 
                      value={user.email || ''} 
                      readOnly 
                      className="w-full px-4 py-2.5 text-sm font-normal border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                    />
                    <span className="text-xs text-slate-400 block pt-1">Your account email. Your name and phone will be saved to your profile when you book.</span>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="p-2.5 rounded-xl bg-[#67c4c7]/10 text-[#67c4c7] shrink-0"><UserRound size={20}/></div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                      <strong className="text-base font-bold text-slate-900 block">{details.full_name}</strong>
                      <small className="text-xs text-slate-500 font-mono block">{details.phone}</small>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="p-2.5 rounded-xl bg-[#67c4c7]/10 text-[#67c4c7] shrink-0"><Heart size={20}/></div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dental Care</span>
                      <strong className="text-base font-bold text-slate-900 block">{selected?.name}</strong>
                      <small className="text-xs text-slate-500 font-medium block">{priceLabel(selected?.price)} · {selected?.duration_minutes || 60} minutes</small>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="p-2.5 rounded-xl bg-[#67c4c7]/10 text-[#67c4c7] shrink-0"><CalendarDays size={20}/></div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Your Visit</span>
                      <strong className="text-base font-bold text-slate-900 block">{visitDateLabel(slot?.appointment_date)}</strong>
                      <small className="text-xs text-slate-500 font-medium block">{slot?.time_slot} · Philippine time</small>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm shadow-2xs">
                    <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5"/>
                    <p className="leading-relaxed font-normal">
                      This is an appointment request. Your visit is confirmed by the clinic. Online cancellation requests require at least <strong>{settings.data?.cancellation_hours} hours</strong> ({Number(settings.data?.cancellation_hours || 0) / 24} days) notice and clinic approval. For urgent changes inside this window, please call the clinic directly.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                {step > 0 ? (
                  <button type="button" disabled={busy} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition inline-flex items-center gap-1.5" onClick={() => setStep(step - 1)}>
                    <ArrowLeft size={16}/> Back
                  </button>
                ) : (
                  <Link className="text-sm font-bold text-slate-500 hover:text-slate-700" to="/dashboard">Cancel</Link>
                )}
                
                <button 
                  type="submit" 
                  className="px-6 py-3 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] text-white font-bold text-sm shadow-md transition-all inline-flex items-center gap-2 disabled:opacity-50" 
                  disabled={busy || !selected || !!services.error || !!settings.error || !settings.data || (step === 1 && !slot)}
                >
                  {busy ? 'Sending request…' : step === 3 ? 'Request my appointment' : 'Continue'} <ArrowRight size={17}/>
                </button>
              </div>
            </form>

            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                <span className="text-[10px] font-extrabold tracking-widest text-[#67c4c7] uppercase">YOUR VISIT AT A GLANCE</span>
                <div className="w-14 h-14 rounded-2xl bg-[#67c4c7]/10 text-[#67c4c7] flex items-center justify-center border border-[#67c4c7]/20">
                  <Heart size={28} strokeWidth={1.5}/>
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-slate-900">{selected?.name || 'A little care for you.'}</h2>
                  <p className="text-xs text-slate-500 font-normal">{selected ? 'One step closer to your next smile goal.' : 'Your appointment details will appear here as you make your selections.'}</p>
                </div>
                
                <dl className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-slate-500 font-semibold"><Clock size={15} className="text-slate-400"/> Duration</dt><dd className="font-bold text-slate-900">{selected ? (selected.duration_minutes || 60) + ' minutes' : '—'}</dd></div>
                  <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-slate-500 font-semibold"><CalendarDays size={15} className="text-slate-400"/> Date</dt><dd className="font-bold text-slate-900">{slot ? visitDateLabel(slot.appointment_date) : 'Not selected'}</dd></div>
                  {slot && <div className="flex items-center justify-between"><dt className="text-slate-500 font-semibold">Time</dt><dd className="font-bold text-slate-900">{slot.time_slot}</dd></div>}
                </dl>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Starting estimate</span>
                  <strong className="text-lg font-extrabold text-slate-900 font-mono">{selected ? priceLabel(selected.price) : '—'}</strong>
                </div>
                <small className="block text-[11px] text-slate-400 font-normal leading-relaxed">Your final treatment and price will be discussed with the clinic.</small>
              </div>

              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Need a little guidance?</p>
                  <a href="tel:09703857431" className="text-sm font-bold text-white hover:text-[#67c4c7] transition-colors">Call 0970 385 7431</a>
                </div>
                <ArrowRight size={18} className="text-[#67c4c7] shrink-0"/>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
