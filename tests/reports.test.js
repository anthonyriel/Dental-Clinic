import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReport, serviceReportCsv } from '../src/lib/reports.js'

test('reports sum actual service payments, count visits separately, and group renamed services', () => {
  const report = buildReport([
    {id:'a',patient_id:'patient',appointment_date:'2030-02-10',completed_at:'2030-01-31T16:30:00Z',price:'100.30',appointment_services:[
      {service_id:'clean',service_name:'Cleaning',paid_amount:'100.10',quoted_price:900},
      {service_id:'fill',service_name:'Filling',paid_amount:'0.20'},
    ]},
    {id:'b',patient_id:null,appointment_date:'2030-02-11',completed_at:'2030-02-01T03:00:00Z',price:'0',appointment_services:[
      {service_id:'clean',service_name:'Renamed cleaning',paid_amount:'0'},
    ]},
  ],[{status:'pending'},{status:'completed'},{status:'cancelled'}])
  assert.equal(report.revenue,100.3)
  assert.equal(report.allocated,100.3)
  assert.equal(report.difference,0)
  assert.equal(report.visits,2)
  assert.equal(report.treatments,3)
  assert.equal(report.services.length,2)
  assert.equal(report.services[0].count,2)
  assert.equal(report.services[0].visits,2)
  assert.equal(report.services[0].average,50.05)
  assert.equal(report.walkIns,1)
  assert.equal(report.registered,1)
  assert.equal(report.months[0].month,'2030-02') // Manila, not UTC or scheduled day
  assert.equal(report.months[0].revenue,100.3)
  assert.equal(report.statuses.cancelled,1)
  assert.equal(report.scheduled,3)
})

test('historical missing amounts remain missing; quotes never become payments', () => {
  const report = buildReport([
    {id:'a',patient_id:'p',appointment_date:'2030-01-03',price:'500',appointment_services:[{service_id:'x',service_name:'Old service',paid_amount:null,quoted_price:500}]},
    {id:'b',patient_id:'p',appointment_date:'2030-01-04',price:null,appointment_services:[]},
  ],[])
  assert.equal(report.revenue,500)
  assert.equal(report.allocated,0)
  assert.equal(report.services[0].average,null)
  assert.equal(report.services[0].missing,1)
  assert.equal(report.missingLines,1)
  assert.equal(report.missingTotals,1)
  assert.equal(report.missingBreakdowns,1)
  assert.equal(report.fallbackDates,2)
  assert.equal(report.average,500)
  assert.equal(report.difference,500)
  assert(serviceReportCsv(report,'2030-01-01','2030-01-31').includes('"Not recorded"'))
})

test('empty reports and deleted catalog services remain usable; CSV escapes formula-like names', () => {
  const empty = buildReport([],[])
  assert.equal(empty.revenue,0)
  assert.equal(empty.average,null)
  assert.deepEqual(empty.services,[])
  const report = buildReport([{id:'a',appointment_date:'2030-01-01',price:1,appointment_services:[{service_id:null,service_name:'=SUM(1,2) "test"',paid_amount:1}]}],[])
  assert.equal(report.services.length,1)
  const csv = serviceReportCsv(report,'2030-01-01','2030-01-31')
  assert(csv.startsWith('\uFEFF'))
  assert(csv.includes('"\'=SUM(1,2) ""test"""'))
  assert(csv.includes('2030-01-31'))
})
