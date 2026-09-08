import { supabase } from '../services/supabaseClient'
import { result } from './data'
import { sortAppointments } from './appointments'

// Fetch all pages explicitly; Supabase otherwise caps list results at its row limit.
export async function allRows(makeQuery) {
  const rows = []
  for (let from = 0; ; from += 500) {
    const page = await result(makeQuery().range(from, from + 499))
    rows.push(...page)
    if (page.length < 500) return rows
  }
}
export const loadServices = () => allRows(() => supabase.from('services').select('*').order('name').order('id'))
export const loadSettings = () => result(supabase.from('clinic_settings').select('*').eq('id', 1).single())
export const loadManagementAppointments = async () => sortAppointments(await allRows(() => supabase.from('appointments').select('*, services(name, price), profiles(full_name, phone)').order('appointment_date').order('id')))
export const loadPatientAppointments = async (userId) => sortAppointments(await allRows(() => supabase.from('appointments').select('*, services(name, price)').eq('patient_id', userId).order('appointment_date').order('id')))
