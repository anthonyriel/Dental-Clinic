import { useCallback, useMemo, useState } from 'react'
import { BarChart3, Banknote, CheckCircle2, Stethoscope, Download, RefreshCw } from 'lucide-react'
import { useQuery } from '../../hooks/useQuery'
import { clinicDate, statusLabel } from '../../lib/appointments'
import { addDays } from '../../lib/calendar'
import { priceLabel } from '../../lib/presentation'
import { loadReport } from '../../lib/reportQueries'
import { buildReport, serviceReportCsv } from '../../lib/reports'
import Feedback from '../../components/Feedback'

const panel = 'bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm min-w-0'
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50'

export default function Reports() {
  const today = clinicDate()
  const [range,setRange] = useState({from:today.slice(0,7)+'-01',to:today})
  const [draft,setDraft] = useState(range)
  const [validation,setValidation] = useState('')
  const [page,setPage] = useState(0)
  const loader = useCallback(()=>loadReport(range.from,range.to),[range.from,range.to])
  const query = useQuery(loader,null,0,{refreshOnFocus:false})
  const report = useMemo(()=>query.data ? buildReport(query.data.completed,query.data.scheduled) : null,[query.data])
  const ready = report && !query.loading && !query.error
  const maxPage = Math.max(0,Math.ceil((report?.services.length || 0)/10)-1)
  const currentPage = Math.min(page,maxPage)
  function apply(next) {
    if (!next.from || !next.to || next.from>next.to) { setValidation('Choose a start date on or before the end date.'); return }
    setRange(next); setDraft(next); setValidation(''); setPage(0)
  }
  function download() {
    const url = URL.createObjectURL(new Blob([serviceReportCsv(report,range.from,range.to)],{type:'text/csv;charset=utf-8;'}))
    const link = document.createElement('a')
    link.href=url; link.download=`Dentaprime-services-${range.from}-to-${range.to}.csv`; link.click()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left min-w-0">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
      <div><span className="text-xs font-bold tracking-wider text-[#67c4c7] uppercase">CLINIC WORKSPACE</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Reports</h1>
        <p className="text-sm text-slate-600 mt-1">A clearer picture of your clinic’s treatments and recorded payments.</p></div>
      <div className="flex flex-wrap gap-2"><button className={button} onClick={query.refresh} disabled={query.loading}><RefreshCw size={16}/>Refresh</button>
        <button className={button} onClick={download} disabled={!ready}><Download size={16}/>Export services</button></div>
    </div>
    <section className={panel} aria-label="Report dates">
      <form onSubmit={e=>{e.preventDefault();apply(draft)}} className="flex flex-wrap items-end gap-3">
        {['from','to'].map(field=><label key={field} className="block flex-1 min-w-0 basis-40 text-xs font-bold text-slate-700">{field==='from'?'From':'To'}
          <input type="date" required value={draft[field]} onChange={e=>setDraft({...draft,[field]:e.target.value})} className="mt-1.5 block min-h-11 w-full min-w-0 border border-slate-300 bg-slate-50/50 rounded-xl px-3 py-2 text-sm font-normal text-slate-900"/></label>)}
        <button className="min-h-11 rounded-xl bg-[#67c4c7] hover:bg-[#57b3b6] px-5 py-2 font-bold text-slate-900">Apply dates</button>
      </form>
      <div className="flex flex-wrap gap-2 mt-4">{[['Today',{from:today,to:today}],['Last 7 days',{from:addDays(today,-6),to:today}],['This month',{from:today.slice(0,7)+'-01',to:today}],['This year',{from:today.slice(0,4)+'-01-01',to:today}]].map(([label,value])=><button key={label} className={button} onClick={()=>apply(value)}>{label}</button>)}</div>
      <p className="mt-4 text-xs text-slate-500">Showing {range.from} through {range.to}, inclusive. Payments and treatments use the completion date in Philippine time, including visits completed early.</p>
      <Feedback error={validation}/>
    </section>
    <Feedback error={query.error} onRetry={query.refresh}/>
    {query.loading && <p role="status" className="py-10 text-center text-slate-500">Preparing your report…</p>}
    {ready && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[[Banknote,'Recorded payments',priceLabel(report.revenue),'Sum of recorded completed-visit totals'],[CheckCircle2,'Completed visits',report.visits,'Each visit counted once'],[Stethoscope,'Treatments',report.treatments,'Each recorded service counted separately'],[BarChart3,'Average paid per visit',report.average==null?'—':priceLabel(report.average),`${report.paidVisits} visits with a recorded total`]].map(([Icon,label,value,note])=><div key={label} className={panel}>
          <Icon size={23} className="text-[#67c4c7] mb-4"/><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><strong className="block text-2xl font-extrabold text-slate-900 mt-2 break-words">{value}</strong><p className="text-xs text-slate-500 mt-2">{note}</p></div>)}
      </div>
      {(report.missingLines>0 || report.missingTotals>0 || report.missingBreakdowns>0 || report.fallbackDates>0 || report.difference!==0) && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 space-y-2">
        <h2 className="font-bold">Records to keep in mind</h2>
        <p>{report.missingLines} service payments not recorded · {report.missingBreakdowns} visits without service records · {report.missingTotals} visit totals not recorded.</p>
        {report.fallbackDates>0 && <p>{report.fallbackDates} older completed visits use their scheduled date because the completion date was not recorded.</p>}
        {report.difference!==0 && <p>Visit totals minus service payments: {priceLabel(report.difference)}. Older unallocated payments or inconsistent records can cause this difference.</p>}
        <p>Missing amounts are not treated as free services. Quotes are never counted as payments.</p>
      </div>}
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5"><div><h2 className="text-lg font-bold text-slate-900">Service performance</h2><p className="text-xs text-slate-500 mt-1">Completed treatments, ranked by recorded payment. Renamed services are grouped by service ID.</p></div><strong className="text-sm text-slate-900">Service payments: {priceLabel(report.allocated)}</strong></div>
        {!report.services.length ? <p className="text-sm text-slate-500 py-8 text-center">No completed service records in this period.</p> : <>
          <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-sm text-left"><caption className="sr-only">Completed services and payments for the selected period</caption><thead className="bg-slate-50 text-xs text-slate-600"><tr>{['Service','Treatments','Visits','Amount paid','Average paid¹','Missing payments'].map(label=><th key={label} scope="col" className="p-3 whitespace-nowrap">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{report.services.slice(currentPage*10,currentPage*10+10).map(s=><tr key={s.key} className="hover:bg-[#67c4c7]/5"><th scope="row" className="p-3 font-semibold text-slate-900 min-w-40">{s.name}</th><td className="p-3">{s.count}</td><td className="p-3">{s.visits}</td><td className="p-3 font-bold whitespace-nowrap">{s.paidCount ? priceLabel(s.revenue) : 'Not recorded'}</td><td className="p-3 whitespace-nowrap">{s.average==null?'—':priceLabel(s.average)}</td><td className="p-3">{s.missing}</td></tr>)}</tbody></table></div>
          <div className="flex justify-between items-center gap-2 mt-4 text-xs text-slate-500"><button className={button} disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button><span>{currentPage+1} / {maxPage+1}</span><button className={button} disabled={currentPage===maxPage} onClick={()=>setPage(currentPage+1)}>Next</button></div>
        </>}
        <p className="mt-4 text-xs text-slate-500">¹ Average includes only recorded payments, including explicit zero payments. A visit with multiple services appears under each service; service visit counts should not be added together.</p>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className={panel}><h2 className="text-lg font-bold text-slate-900">Monthly payments</h2><p className="text-xs text-slate-500 mt-1 mb-5">Completed visits within the selected dates; boundary months may be partial.</p>
          {!report.months.length ? <p className="text-sm text-slate-500">No completed visits in this period.</p> : <div className="space-y-4 max-h-96 overflow-y-auto">{report.months.map(m=><div key={m.month}><div className="flex flex-wrap justify-between gap-2 text-sm mb-2"><span className="font-semibold">{m.month} <span className="font-normal text-slate-500">· {m.visits} visits</span></span><strong>{priceLabel(m.revenue)}</strong></div><div aria-hidden="true" className="h-2 bg-slate-100 rounded-full"><div className="h-2 bg-[#67c4c7] rounded-full" style={{width:`${Math.max(0,m.revenue)/Math.max(1,...report.months.map(x=>x.revenue))*100}%`}}/></div></div>)}</div>}
        </section>
        <section className={panel}><h2 className="text-lg font-bold text-slate-900">Appointment outcomes</h2><p className="text-xs text-slate-500 mt-1 mb-5">Current statuses of {report.scheduled} appointments scheduled within the selected dates. This uses scheduled dates, so counts can differ from completed visits above.</p>
          <dl className="grid grid-cols-2 gap-3">{['pending','confirmed','completed','cancelled','cancellation_requested','no_show'].map(status=><div key={status} className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><dt className="text-xs text-slate-500 capitalize">{statusLabel(status)}</dt><dd className="text-xl font-bold text-slate-900 mt-1">{report.statuses[status] || 0}</dd></div>)}</dl>
          <p className="text-sm text-slate-600 border-t border-slate-100 pt-4 mt-5">Completed visits: <strong>{report.walkIns}</strong> walk-ins · <strong>{report.registered}</strong> registered-patient visits.</p>
        </section>
      </div>
      <p className="text-xs text-slate-500">Reports reflect records currently retained in the system. Permanently deleted appointments are not included. Payments are recorded at completion; these reports do not track refunds or expenses.</p>
    </>}
  </div>
}
