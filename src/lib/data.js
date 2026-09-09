import { supabase } from '../services/supabaseClient'
export async function result(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}
export async function updateOne(table, id, changes) {
  return result(supabase.from(table).update(changes).eq('id', id).select().single())
}
export { errorMessage } from './errors'
