export const addDays = (date, amount) => {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}
export const shiftMonth = (month, amount) => {
  const value = new Date(`${month}-01T12:00:00Z`)
  value.setUTCMonth(value.getUTCMonth() + amount)
  return value.toISOString().slice(0, 7)
}
export function monthDays(month) {
  const first = `${month}-01`
  const next = `${shiftMonth(month, 1)}-01`
  const days = []
  for (let date = first; date < next; date = addDays(date, 1)) days.push(date)
  return { offset: new Date(`${first}T12:00:00Z`).getUTCDay(), days }
}
export function calendarDayState(date, today, settings) {
  if (date < today) return 'past'
  if (date > addDays(today, settings.booking_horizon_days)) return 'later'
  if (!settings.opening_days.includes(new Date(`${date}T12:00:00Z`).getUTCDay())) return 'closed'
  return 'check'
}
