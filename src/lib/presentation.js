export const priceLabel = value => value == null || value === '' ? 'Ask the clinic' : `₱${Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
export const visitDateLabel = value => value ? new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(`${value}T12:00:00+08:00`)) : 'Choose a date'
