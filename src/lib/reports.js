import { clinicDate } from './appointments.js'

const cents = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Math.round(Number(value) * 100)

export function buildReport(completed, scheduled) {
  const services = new Map(), months = new Map()
  let total = 0, allocated = 0, missingLines = 0, missingTotals = 0, fallbackDates = 0, missingBreakdowns = 0, walkIns = 0, treatments = 0, paidVisits = 0
  for (const visit of completed) {
    const date = visit.completed_at ? clinicDate(new Date(visit.completed_at)) : visit.appointment_date
    if (!visit.completed_at) fallbackDates++
    if (visit.patient_id == null) walkIns++
    const month = date.slice(0,7)
    if (!months.has(month)) months.set(month, {month, visits:0, cents:0})
    const trend = months.get(month)
    trend.visits++
    const visitPaid = cents(visit.price)
    if (visitPaid == null) missingTotals++
    else { total += visitPaid; trend.cents += visitPaid; paidVisits++ }
    const lines = visit.appointment_services || []
    if (!lines.length) missingBreakdowns++
    treatments += lines.length
    for (const line of lines) {
      const key = line.service_id || `deleted:${line.service_name}`
      if (!services.has(key)) services.set(key,{key,name:line.service_name,visits:new Set(),count:0,paidCount:0,cents:0,missing:0})
      const group = services.get(key)
      group.visits.add(visit.id); group.count++
      const paid = cents(line.paid_amount)
      if (paid == null) { group.missing++; missingLines++ }
      else { group.cents += paid; allocated += paid; group.paidCount++ }
    }
  }
  const statuses = {}
  for (const visit of scheduled) statuses[visit.status || 'unknown'] = (statuses[visit.status || 'unknown'] || 0) + 1
  return {
    revenue:total/100, allocated:allocated/100, difference:(total-allocated)/100,
    visits:completed.length, treatments, walkIns, registered:completed.length-walkIns,
    average:paidVisits ? total/100/paidVisits : null, paidVisits,
    missingLines, missingTotals, missingBreakdowns, fallbackDates, statuses, scheduled:scheduled.length,
    services:[...services.values()].map(s=>({...s,visits:s.visits.size,revenue:s.cents/100,average:s.paidCount?s.cents/100/s.paidCount:null})).sort((a,b)=>b.revenue-a.revenue || a.name.localeCompare(b.name)),
    months:[...months.values()].sort((a,b)=>a.month.localeCompare(b.month)).map(m=>({...m,revenue:m.cents/100})),
  }
}

export function serviceReportCsv(report, from, to) {
  const rows = [
    ['Dentaprime service report',from,to],
    ['Completed visits; Philippine completion dates. Missing completion dates use scheduled dates.'],
    ['Service','Treatments','Visits','Recorded paid (PHP)','Average recorded payment (PHP)','Payments missing'],
    ...report.services.map(s=>[s.name,s.count,s.visits,s.paidCount?s.revenue.toFixed(2):'Not recorded',s.average==null?'':s.average.toFixed(2),s.missing]),
    [],['Visit totals (PHP)',report.revenue.toFixed(2)],['Service totals (PHP)',report.allocated.toFixed(2)],
    ['Difference (PHP)',report.difference.toFixed(2)],['Visits missing a total',report.missingTotals],
    ['Visits missing service records',report.missingBreakdowns],['Visits using scheduled date',report.fallbackDates],
  ]
  return '\uFEFF'+rows.map(row=>row.map(value=>{
    let text = String(value)
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text
    return '"'+text.replaceAll('"','""')+'"'
  }).join(',')).join('\r\n')
}
