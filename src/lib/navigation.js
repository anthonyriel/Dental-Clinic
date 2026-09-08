// Only the internal booking destination can be carried through authentication.
export function bookingDestination(value) {
  if (typeof value !== 'string' || !/^\/dashboard\/book(?:\?|$)/.test(value)) return null
  return value
}
