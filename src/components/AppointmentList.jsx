import { useState } from 'react'
import { CalendarDays, Clock, Search } from 'lucide-react'
import { serviceName, servicePrice, statusLabel, normalizeStatus } from '../lib/appointments'
import { priceLabel } from '../lib/presentation'
export default function AppointmentList({ appointments,management=false,renderActions }) {
  const [search,setSearch]=useState('')
  const [date,setDate]=useState('')
  const [status,setStatus]=useState('')
  const [page,setPage]=useState(0)
  const filtered=appointments.filter(a=>(!date||a.appointment_date===date)&&(!status||statusLabel(a.status)===status)&&`${serviceName(a)} ${a.profiles?.full_name||''} ${a.profiles?.phone||''}`.toLowerCase().includes(search.toLowerCase()))
  const currentPage=Math.min(page,Math.max(0,Math.ceil(filtered.length/20)-1))
  return <div>
    <div className="glass-panel appointment-filters"><label className="search-field rounded-xl! flex-1"><Search size={17}/><input aria-label="Search appointments" placeholder={management?'Search patient or service':'Search your appointments'} value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/></label><input aria-label="Filter appointment date" type="date" value={date} onChange={e=>{setDate(e.target.value);setPage(0)}}/><select aria-label="Filter appointment status" value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}}><option value="">All statuses</option>{['pending','confirmed','cancellation requested','completed','cancelled','no show'].map(s=><option key={s}>{s}</option>)}</select>{(search||date||status)&&<button className="text-link" onClick={()=>{setSearch('');setDate('');setStatus('');setPage(0)}}>Clear filters</button>}</div>
    <div className="glass-panel">{!filtered.length&&<div className="empty-state"><CalendarDays className="mx-auto mb-4" size={27} strokeWidth={1.4}/><h2>Nothing on this list just yet.</h2><p>{search||date||status?'Try a different date, service, or status.':'Your appointments will appear here.'}</p></div>}
    {filtered.slice(currentPage*20,currentPage*20+20).map(a=><article key={a.id} className="appointment-row"><div className="appointment-date-tile"><span>{new Date(a.appointment_date+'T12:00:00+08:00').toLocaleString('en-PH',{month:'short',timeZone:'Asia/Manila'})}</span><strong>{Number(a.appointment_date.slice(-2))}</strong></div><div className="appointment-body">{management&&<p className="appointment-patient">{a.profiles?.full_name||'Patient'} · {a.profiles?.phone||'No phone listed'}</p>}<h3>{serviceName(a)}</h3><div className="appointment-meta"><span><CalendarDays size={13}/>{a.appointment_date}</span><span><Clock size={13}/>{a.time_slot}</span></div>{a.cancellation_reason&&<p className="appointment-note">Cancellation request: {a.cancellation_reason}</p>}{a.cancellation_resolution&&<p className="appointment-note">Clinic response: {a.cancellation_resolution}</p>}<div className="appointment-actions">{renderActions?.(a)}</div></div><div className="appointment-tail"><span className={'status-badge status-'+normalizeStatus(a.status)}>{statusLabel(a.status)}</span>{servicePrice(a)!=null&&<><span>{priceLabel(servicePrice(a))}</span><small>{a.quote_is_estimate!==false?'Legacy estimate':'Quoted price'}</small></>}</div></article>)}</div>
    <div className="pagination"><button disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} · {filtered.length} appointments</span><button disabled={(currentPage+1)*20>=filtered.length} onClick={()=>setPage(currentPage+1)}>Next</button></div>
  </div>
}

