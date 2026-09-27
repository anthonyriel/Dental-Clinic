import { useCallback, useState } from 'react'
import { useAuth } from '../../context/auth'
import { clientRecordActive, clientRecordStatus } from '../../lib/clientRecords'
import { Link } from 'react-router-dom'
import { UserPlus, Search, RefreshCw, Mail, CalendarPlus } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import { useQuery } from '../../hooks/useQuery'
import { allRows, loadClients } from '../../lib/queries'
import { errorMessage } from '../../lib/data'
import { priceLabel } from '../../lib/presentation'
import AppointmentList from '../../components/AppointmentList'
import ClientRecordForm from '../../components/ClientRecordForm'
import Feedback from '../../components/Feedback'
import ClientRecordActions from '../../components/ClientRecordActions'

export default function Clients() {
  const { role } = useAuth()
  const clients=useQuery(loadClients,[],0,{refreshOnFocus:false})
  const [search,setSearch]=useState(''), [selected,setSelected]=useState(null), [edit,setEdit]=useState(null)
  const [page,setPage]=useState(0), [busy,setBusy]=useState(false), [error,setError]=useState(''), [message,setMessage]=useState('')
  const [statusFilter,setStatusFilter]=useState('active')
  const record=clients.data.find(c=>c.id===selected)
  const loadHistory=useCallback(()=>selected?allRows(()=>supabase.from('appointments').select('*, appointment_services(*), client_records(full_name,phone)').eq('client_record_id',selected).order('appointment_date',{ascending:false}).order('id')):Promise.resolve([]),[selected])
  const history=useQuery(loadHistory,[],0,{refreshOnFocus:false})
  const matches=clients.data.filter(c=>(statusFilter==='all' || (statusFilter==='inactive' ? !clientRecordActive(c) : clientRecordActive(c))) && `${c.full_name} ${c.phone || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase()))
  const currentPage=Math.min(page,Math.max(0,Math.ceil(matches.length/20)-1))
  async function invite() {
    if(busy || !record)return
    setBusy(true);setError('');setMessage('')
    try {
      const response=await supabase.functions.invoke('invite-client',{body:{client_id:record.id}})
      if(response.error) {
        let detail
        try { detail=await response.error.context?.json() } catch { /* use the original error */ }
        throw new Error(detail?.error || response.error.message)
      }
      if(response.data?.error)throw new Error(response.data.error)
      setMessage(response.data.message)
    } catch(err){setError(errorMessage(err))} finally{setBusy(false);clients.refresh()}
  }
  const completed=history.data.filter(a=>a.status==='completed')
  const total=completed.reduce((sum,a)=>sum+Math.round(Number(a.price || 0)*100),0)/100
  return <div className="space-y-6 max-w-7xl mx-auto pb-12">
    <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-6"><div><span className="eyebrow">CLINIC WORKSPACE</span><h1 className="text-3xl font-extrabold mt-2">Client records</h1><p className="text-sm text-slate-600 mt-2">One place for contact details, visit history, services and recorded payments.</p></div><div className="flex gap-2"><button className="btn btn-secondary" onClick={()=>{clients.refresh();history.refresh()}}><RefreshCw size={17}/>Refresh</button><button className="btn btn-primary" onClick={()=>setEdit({})}><UserPlus size={17}/>New client</button></div></div>
    <Feedback error={error || clients.error} message={message} onRetry={clients.refresh}/>
    <div className="flex flex-wrap gap-2">{[['active','Active'],['inactive','Deactivated'],['all','All records']].map(([value,label])=><button key={value} aria-pressed={statusFilter===value} onClick={()=>{setStatusFilter(value);setPage(0)}} className={`btn ${statusFilter===value?'btn-primary':'btn-secondary'}`}>{label}</button>)}</div>
    {edit && <ClientRecordForm key={edit.id || 'new'} record={edit.id?edit:null} onCancel={()=>setEdit(null)} onSaved={id=>{setEdit(null);setSelected(id);clients.refresh()}}/>}
    <div className="glass-panel p-5 space-y-4"><label className="flex items-center gap-2"><Search size={18}/><input aria-label="Search client records" placeholder="Search name, mobile or email…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} className="min-h-11 min-w-0 w-full rounded-xl border border-slate-200 p-3"/></label>
      {clients.loading?<p>Loading client records…</p>:!clients.error && <><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{matches.slice(currentPage*20,currentPage*20+20).map(c=><button key={c.id} onClick={()=>{setSelected(c.id);setError('');setMessage('')}} className={`text-left p-4 rounded-2xl border ${selected===c.id?'border-[#67c4c7] bg-[#67c4c7]/10':'border-slate-200 bg-white/70'}`}><strong className="block break-words">{c.full_name}</strong><span className="block text-sm text-slate-600">{c.phone || 'No mobile number'}</span><small>{clientRecordStatus(c)} · {c.id.slice(0,8)}</small></button>)}</div>{!matches.length && <p className="text-slate-500">No matching clients.</p>}<div className="flex justify-between items-center"><button className="btn btn-secondary" disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Previous</button><span className="text-xs">{matches.length} records</span><button className="btn btn-secondary" disabled={(currentPage+1)*20>=matches.length} onClick={()=>setPage(currentPage+1)}>Next</button></div></>}
    </div>
    {record && <section className="space-y-5"><div className="glass-panel p-5 sm:p-7 space-y-4"><h2 className="text-2xl font-bold break-words">{record.full_name}</h2><p className="text-sm break-words">{record.phone || 'No mobile'} · {record.email || 'No email'}{record.birthdate && ` · Born ${record.birthdate}`}</p><div className="flex flex-wrap gap-3">{clientRecordActive(record) && <Link className="btn btn-primary" to={`/management/walk-ins?client=${record.id}`}><CalendarPlus size={17}/>Book for client</Link>}<button className="btn btn-secondary" onClick={()=>setEdit(record)}>Edit details</button>{!record.profile_id && clientRecordActive(record) && <button disabled={busy || !record.email} className="btn btn-secondary" onClick={invite}><Mail size={17}/>{busy?'Sending…':'Create login & send invitation'}</button>}</div><p className="text-xs text-slate-500">{record.profile_id?'Login linked. Clients can use Forgot password if they need a new access link.':'Email is optional for clinic records and required for a login invitation. Confirm the email belongs to this client before sending.'}</p></div>
      {record.profile_id && ['admin','owner'].includes(role) && <Link className="text-sm underline" to="/management/users">Account access is managed in People &amp; access.</Link>}
      <ClientRecordActions key={record.id} record={record} onChanged={clients.refresh} onDeleted={()=>{setSelected(null);setEdit(null);clients.refresh();setMessage('Client record and its appointment history permanently deleted.')}}/>
      <Feedback error={history.error} onRetry={history.refresh}/>
      {history.loading?<p>Loading client history…</p>:!history.error && <><p className="text-sm text-slate-600">{history.data.length} visits · {completed.length} completed · {priceLabel(total)} recorded payments{completed.some(a=>a.price==null)?' · Some historical totals are missing':''}</p><AppointmentList appointments={history.data}/></>}
    </section>}
  </div>
}
