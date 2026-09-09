export function errorMessage(error) {
  if (error?.code === '23P01') return 'This visit overlaps another reserved appointment. Refresh availability and choose another time. (23P01)'
  if (error?.code === '23505') {
    // Show the constraint name, never PostgreSQL details containing patient values.
    const constraint = error.message?.match(/constraint "([a-zA-Z0-9_]+)"/)?.[1]
    return `A record with this unique value already exists. ${constraint ? `Reference: ${constraint} (23505).` : 'Reference: 23505.'}`
  }
  if (['PGRST202', 'PGRST205', '42703', '42P01'].includes(error?.code)) return 'This feature is not available yet. Please contact the clinic.'
  return error?.message || 'Unable to connect. Please try again.'
}
