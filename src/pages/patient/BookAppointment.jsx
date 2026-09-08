import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, CheckCircle2, CalendarDays, Clock, Heart, ShieldCheck, UserRound } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../context/auth'
import { useQuery } from '../../hooks/useQuery'
import { loadServices, loadSettings } from '../../lib/queries'
import { errorMessage, result, updateOne } from '../../lib/data'
import { priceLabel, visitDateLabel } from '../../lib/presentation'
import ServiceCard from '../../components/ServiceCard'
import SlotPicker from '../../components/SlotPicker'
import Feedback from '../../components/Feedback'
const stepNames=['Your care','Your time','Your details','Review']
export default function BookAppointment() {
  const { user,profile,refreshProfile }=useAuth()
  const [params]=useSearchParams()
  const services=useQuery(loadServices,[])
  const settings=useQuery(loadSettings)
  const [serviceId,setServiceId]=useState(params.get('service')||'')
  const [step,setStep]=useState(0)
  const [slot,setSlot]=useState(null)
  const [details,setDetails]=useState({full_name:profile?.full_name||'',phone:profile?.phone||''})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState(false)
  const heading=useRef(null)
  const inFlight=useRef(false)
  const selected=services.data.find(s=>String(s.id)===String(serviceId)&&s.is_active!==false)
  useEffect(()=>{ heading.current?.focus() },[step,success])
  function selectService(id) { setServiceId(id); setSlot(null); setError('') }
  async function submit(e) {
    e.preventDefault()
    setError('')
    if(step<3) {
      if(!selected) { setStep(0); return }
      if(step===1&&!slot) return
      if(step===2&&(!details.full_name.trim()||!details.phone.trim())) { setError('Please enter your name and contact number.'); return }
      setStep(step+1); return
    }
    if(inFlight.current||!selected||!slot||!settings.data) return
    inFlight.current=true; setBusy(true)
    try {
      if(details.full_name.trim()!==profile.full_name||details.phone.trim()!==profile.phone) {
        await updateOne('profiles',user.id,{full_name:details.full_name.trim(),phone:details.phone.trim()})
        refreshProfile()
      }
      await result(supabase.rpc('book_appointment',{p_service_id:String(serviceId),p_date:slot.appointment_date,p_time_slot:slot.time_slot}))
      setSuccess(true)
    } catch(err) { setError(errorMessage(err)); setSlot(null); setStep(1) }
    finally { setBusy(false); inFlight.current=false }
  }
  return <div className="booking-page">
    <div className="page-heading"><div><span className="eyebrow">MAKE TIME FOR YOUR SMILE</span><h1 tabIndex={-1} ref={heading}>{success?'You’re one step closer.':'Let’s plan your visit.'}</h1><p>A little time for yourself. A good reason to smile.</p></div><span className="booking-secure"><ShieldCheck size={16}/> Your personal smile space</span></div>
    {success?<section className="glass-panel booking-success"><span className="success-icon"><CheckCircle2 size={38} strokeWidth={1.5}/></span><span className="eyebrow">REQUEST RECEIVED</span><h2>We look forward<br/>to seeing your smile.</h2><p>Your appointment is pending clinic confirmation. Check your appointment updates for the next step.</p><div className="success-summary"><strong>{selected?.name}</strong><span>{visitDateLabel(slot?.appointment_date)} · {slot?.time_slot}</span></div><Link className="btn btn-primary" to="/dashboard/history">View my appointments <ArrowRight size={18}/></Link><Link className="text-link" to="/dashboard">Back to overview</Link></section>:<>
      <ol className="wizard-steps" aria-label="Booking progress">{stepNames.map((name,i)=><li key={name} className={i===step?'current':i<step?'complete':''} aria-current={i===step?'step':undefined}><span>{i<step?<Check size={15}/>:String(i+1).padStart(2,'0')}</span><strong>{name}</strong></li>)}</ol>
      <Feedback error={error||services.error||settings.error} onRetry={()=>{setError('');services.refresh();settings.refresh()}}/>
      <div className="booking-layout"><form onSubmit={submit} className="glass-panel wizard-panel">
        <div className="wizard-panel-heading"><span className="eyebrow">STEP {String(step+1).padStart(2,'0')} OF 04</span><h2>{['What brings you in?','Find your perfect moment.','A little about you.','Looking good. Let’s review.'][step]}</h2><p>{['Choose the care you would like to book.','Available times match your treatment’s duration.','We’ll use these details to contact you about your visit.','Check the details below before sending your request.'][step]}</p></div>
        {step===0&&<>{services.loading?<p role="status">Loading your care options...</p>:<div className="booking-services">{services.data.filter(s=>s.is_active!==false).map(service=><ServiceCard key={service.id} service={service} selected={String(service.id)===String(serviceId)} onSelect={selectService}/>)}</div>}{!services.loading&&!services.error&&!services.data.some(s=>s.is_active!==false)&&<p className="empty-state">Online services are not currently available. <Link to="/contact">Contact the clinic.</Link></p>}</>}
        {step===1&&<SlotPicker key={serviceId} serviceId={serviceId} value={slot} onChange={setSlot} duration={selected?.duration_minutes||60} calendarSettings={settings.data} />}
        {step===2&&<div className="patient-details"><label>Full name<input autoComplete="name" required maxLength={120} value={details.full_name} onChange={e=>setDetails({...details,full_name:e.target.value})}/></label><label>Phone number<input type="tel" autoComplete="tel" required pattern="(09[0-9]{9}|[+]639[0-9]{9})" title="Use 09 followed by 9 digits, or +639 followed by 9 digits." placeholder="09123456789" value={details.phone} onChange={e=>setDetails({...details,phone:e.target.value})}/></label><label className="details-email">Email address<input type="email" value={user.email||''} readOnly/><span>Your account email. Your name and phone will be saved to your profile when you book.</span></label></div>}
        {step===3&&<div className="review-details"><div><UserRound size={19}/><span>Patient<strong>{details.full_name}</strong><small>{details.phone}</small></span></div><div><Heart size={19}/><span>Dental care<strong>{selected?.name}</strong><small>{priceLabel(selected?.price)} · {selected?.duration_minutes||60} minutes</small></span></div><div><CalendarDays size={19}/><span>Your visit<strong>{visitDateLabel(slot?.appointment_date)}</strong><small>{slot?.time_slot} · Philippine time</small></span></div><div className="review-policy"><ShieldCheck size={19}/><p>This is an appointment request. Your visit is booked once the clinic confirms it. Online cancellation requests require at least <strong>{settings.data?.cancellation_hours} hours</strong> notice and clinic approval. For later changes, please call the clinic.</p></div></div>}
        <div className="wizard-actions">{step>0?<button type="button" disabled={busy} className="btn btn-secondary" onClick={()=>setStep(step-1)}><ArrowLeft size={16}/> Back</button>:<Link className="text-link" to="/dashboard">Cancel</Link>}<button type="submit" className="btn btn-primary" disabled={busy||!selected||!!services.error||!!settings.error||!settings.data||(step===1&&!slot)}>{busy?'Sending request…':step===3?'Request my appointment':'Continue'}<ArrowRight size={17}/></button></div>
      </form><aside className="booking-summary"><div className="glass-panel summary-card"><span className="eyebrow">YOUR VISIT AT A GLANCE</span><div className="summary-tooth"><Heart size={32} strokeWidth={1.3}/></div><h2>{selected?.name||'A little care for you.'}</h2><p>{selected?'One step closer to your next smile goal.':'Your appointment details will appear here as you make your selections.'}</p><dl><div><dt><Clock size={15}/> Duration</dt><dd>{selected?(selected.duration_minutes||60)+' minutes':'—'}</dd></div><div><dt><CalendarDays size={15}/> Date</dt><dd>{slot?visitDateLabel(slot.appointment_date):'Not selected'}</dd></div>{slot&&<div><dt>Time</dt><dd>{slot.time_slot}</dd></div>}</dl><div className="summary-price"><span>Starting estimate</span><strong>{selected?priceLabel(selected.price):'—'}</strong></div><small>Your final treatment and price will be discussed with the clinic.</small></div><div className="booking-help"><p>Need a little guidance?</p><a href="tel:09703857431">Call 0970 385 7431 <ArrowRight size={14}/></a></div></aside></div>
    </>}
  </div>
}


