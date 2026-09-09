import { supabase } from '../services/supabaseClient'
import { allRows } from './queries'
import { addDays } from './calendar'

// Only report fields are fetched; no patient names, contact details or treatment notes.
const fields = 'id,patient_id,appointment_date,completed_at,price,appointment_services(service_id,service_name,paid_amount)'
export async function loadReport(from,to) {
  const end = addDays(to,1)
  const [dated,legacy,scheduled] = await Promise.all([
    allRows(()=>supabase.from('appointments').select(fields).eq('status','completed')
      .gte('completed_at',`${from}T00:00:00+08:00`).lt('completed_at',`${end}T00:00:00+08:00`).order('completed_at').order('id')),
    allRows(()=>supabase.from('appointments').select(fields).eq('status','completed').is('completed_at',null)
      .gte('appointment_date',from).lte('appointment_date',to).order('appointment_date').order('id')),
    allRows(()=>supabase.from('appointments').select('id,status').gte('appointment_date',from).lte('appointment_date',to).order('appointment_date').order('id')),
  ])
  return {completed:[...dated,...legacy],scheduled}
}
