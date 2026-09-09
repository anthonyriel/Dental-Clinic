// Use integer centavos for the displayed total; blank is not the same as zero paid.
export function paymentCentavos(value) {
  if (!/^[0-9]{1,10}(\.[0-9]{1,2})?$/.test(String(value ?? ''))) return null
  const [whole, fraction = ''] = String(value).split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

export function paymentTotal(services, amounts) {
  if (!services.length) return null
  const values = services.map(service => paymentCentavos(amounts[service.id]))
  return values.some(value => value === null) ? null : values.reduce((sum, value) => sum + value, 0) / 100
}
