import { supabase } from '../services/supabaseClient'
export async function result(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}
export async function updateOne(table, id, changes) {
  return result(supabase.from(table).update(changes).eq('id', id).select().single())
}
export function errorMessage(error) {
  if (error?.code === '23P01' || error?.code === '23505') return 'That booking or value already exists. Refresh and try another option.'
  if (['PGRST202', 'PGRST205', '42703', '42P01'].includes(error?.code)) return 'This feature is not available yet. Please contact the clinic.'
  return error?.message || 'Unable to connect. Please try again.'
}
