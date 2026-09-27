import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { loadServices, loadClients } from '../../lib/queries'
import { result, errorMessage } from '../../lib/data'
import { bookingRequestRejected } from '../../lib/errors'
import { clientRecordActive } from '../../lib/clientRecords'
import { priceLabel } from '../../lib/presentation'
import SlotPicker from '../../components/SlotPicker'
import ClientRecordForm from '../../components/ClientRecordForm'
import Feedback from '../../components/Feedback'

export default function StaffBooking() {
  const services=useQuery(loadServices,[]), clients=useQuery(loadClients,[])
  const [params]=useSearchParams()
  const [clientId,setClientId]=useState(params.get('client') || '')
  const [search,setSearch]=useState(''), [creating,setCreating]=useState(false)
  const [source,setSource]=useState('walk_in'), [serviceIds,setServiceIds]=useState([]), [slot,setSlot]=useState(null)
  const [busy,setBusy]=useState(false), [error,setError]=useState(''), [done,setDone]=useState(false), [locked,setLocked]=useState(false)
  const flight=useRef(false), payload=useRef(null)
  const [receipt,setReceipt]=useState(null)
  const client=clients.data.find(c=>c.id===clientId && clientRecordActive(c))
  const selectedServices=serviceIds.map(id=>services.data.find(s=>s.id===id && s.is_active!==false)).filter(Boolean)
  const duration=selectedServices.reduce((sum,s)=>sum+s.duration_minutes,0)
  async function submit(e) {
    e.preventDefault();if(flight.current)return
    if(!payload.current && (!client || !slot || !selectedServices.length || selectedServices.length!==serviceIds.length)){setError('Choose a client, services and an available time.');return}
    if (!payload.current) setReceipt({name:client?.full_name,services:selectedServices.map(s=>s.name).join(' + '),date:slot?.appointment_date,time:slot?.time_slot})
    payload.current ||= {p_client_id:clientId,p_service_ids:serviceIds,p_date:slot.appointment_date,p_time_slot:slot.time_slot,p_source:source,p_request_id:crypto.randomUUID()}
    flight.current=true;setBusy(true);setLocked(true);setError('')
    try { await result(supabase.rpc('book_staff_appointment',payload.current));setDone(true) }
    catch(err){setError(errorMessage(err));if(bookingRequestRejected(err)){payload.current=null;setReceipt(null);setLocked(false);setSlot(null)}}
    finally{flight.current=false;setBusy(false)}
  }
  const input='block min-h-11 w-full border border-slate-300 rounded-xl p-3 mt-2 bg-white/80'
  return <div className="max-w-4xl mx-auto space-y-6 pb-12">
    <div><span className="eyebrow">FRONT DESK</span><h1 className="text-3xl font-extrabold mt-2">Staff booking</h1><p className="text-sm text-slate-600 mt-2">Book walk-ins, phone calls and text requests using a reusable client record. Staff bookings are confirmed immediately.</p></div>
    {done?<section className="glass-panel p-7 space-y-4"><h2 className="text-xl font-bold">Booking confirmed</h2><p>{receipt?.name} · {receipt?.services}<br/>{receipt?.date} · {receipt?.time}</p><div className="flex flex-wrap gap-3"><Link className="btn btn-primary" to="/management/schedule">View schedule</Link><Link className="btn btn-secondary" to="/management/clients">Client records</Link><button className="btn btn-secondary" onClick={()=>{payload.current=null;setLocked(false);setDone(false);setSlot(null);setServiceIds([]);setError('')}}>Book another visit</button></div></section>:<>
      {creating && <ClientRecordForm onCancel={()=>setCreating(false)} onSaved={id=>{setCreating(false);setSearch('');setClientId(id);clients.refresh()}}/>}
      <form onSubmit={submit} className="glass-panel p-5 sm:p-8 space-y-6">
        <Feedback error={error || clients.error || services.error} onRetry={()=>{clients.refresh();services.refresh()}}/>
        <fieldset disabled={busy || locked || creating} className="space-y-5 min-w-0">
          <label className="block text-sm font-semibold">Booking source<select className={input} value={source} onChange={e=>{setSource(e.target.value);setSlot(null)}}><option value="walk_in">Walk-in (today)</option><option value="call">Phone call</option><option value="text">Text message</option></select></label>
          <label className="block text-sm font-semibold">Find client<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or mobile…" className={input}/></label>
          <label className="block text-sm font-semibold">Client record<select required value={clientId} onChange={e=>setClientId(e.target.value)} className={input}><option value="">{clients.loading?'Loading clients…':'Select a client'}</option>{clients.data.filter(c=>clientRecordActive(c)).filter(c=>c.id===clientId || `${c.full_name} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase())).map(c=><option key={c.id} value={c.id}>{c.full_name} · {c.phone || 'No mobile'} · {c.id.slice(0,8)}</option>)}</select></label>
          <button type="button" className="btn btn-secondary" onClick={()=>setCreating(true)}>New client record</button>
          <fieldset className="space-y-2"><legend className="font-bold mb-3">Services</legend><div className="grid sm:grid-cols-2 gap-3">{services.data.filter(s=>s.is_active!==false).map(s=><label key={s.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4"><input className="mt-1" type="checkbox" checked={serviceIds.includes(s.id)} onChange={()=>{setServiceIds(ids=>ids.includes(s.id)?ids.filter(id=>id!==s.id):[...ids,s.id]);setSlot(null)}}/><span className="text-sm"><strong>{s.name}</strong><small className="block text-slate-600">{s.duration_minutes} min · {priceLabel(s.price)}</small></span></label>)}</div></fieldset>
          {!!selectedServices.length && <SlotPicker key={source+serviceIds.join(',')} serviceIds={serviceIds} value={slot} onChange={setSlot} duration={duration} staffSource={source} walkIn={source==='walk_in'}/>}
          <p className="text-xs text-slate-600">Times use Philippine time. Staff can book without the online advance-notice delay. Clinic hours, breaks, closures and overlapping appointments are still checked.</p>
        </fieldset>
        {locked && !busy && <p className="text-sm text-slate-600">The result could not be confirmed. Retry this same request to avoid a duplicate booking.</p>}
        <button disabled={busy || creating || (!locked && (!slot || !client || !selectedServices.length))} className="btn btn-primary">{busy?'Booking…':locked?'Retry booking':'Confirm booking'}</button>
      </form>
    </>}
  </div>
}
