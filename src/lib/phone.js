// Accept Philippine mobile numbers in local or international form.
export function normalizeMobile(value) {
  const compact = value.trim().replace(/[\s()-]/g, '')
  if (/^09\d{9}$/.test(compact)) return compact
  if (/^(?:\+63|63)9\d{9}$/.test(compact)) return `0${compact.replace(/^\+?63/, '')}`
  return null
}

export function formatMobile(value) {
  const phone = normalizeMobile(value)
  if (!phone) return value
  if (value.trim().startsWith('+63')) return `+63 ${phone.slice(1, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
}
