// Fetch six preview rows and server-side totals, never the entire history.
export async function managementSummary(client, date) {
  const responses = await Promise.all([
    client.from('appointments').select('*, services(name, price), profiles(full_name, phone)', { count: 'exact' })
      .eq('appointment_date', date).not('status', 'in', '(cancelled,no_show)')
      .order('starts_at').order('id').limit(6),
    client.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    client.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'cancellation_requested'),
    client.from('appointments').select('id', { count: 'exact', head: true }),
  ])
  for (const response of responses) {
    if (response.error) throw response.error
    if (response.count == null) throw new Error('Appointment totals are unavailable. Please refresh.')
  }
  return {
    today: responses[0].data,
    todayCount: responses[0].count,
    pendingCount: responses[1].count,
    cancellationCount: responses[2].count,
    totalCount: responses[3].count,
  }
}
