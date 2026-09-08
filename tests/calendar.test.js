import test from 'node:test'
import assert from 'node:assert/strict'
import { addDays, monthDays, shiftMonth, calendarDayState } from '../src/lib/calendar.js'

test('calendar includes leap days and positions dates under the correct weekday', () => {
  const february = monthDays('2028-02')
  assert.equal(february.days.length, 29)
  assert.equal(february.offset, 2)
  assert.equal(february.days.at(-1), '2028-02-29')
  assert.equal(monthDays('2027-02').days.length, 28)
  assert.equal(shiftMonth('2026-12', 1), '2027-01')
  assert.equal(shiftMonth('2027-01', -1), '2026-12')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
})

test('calendar respects past dates, weekly closures and inclusive booking horizon', () => {
  const settings = { opening_days: [1,2,3,4,5,6], booking_horizon_days: 7 }
  assert.equal(calendarDayState('2026-09-08','2026-09-09',settings), 'past')
  assert.equal(calendarDayState('2026-09-09','2026-09-09',settings), 'check')
  assert.equal(calendarDayState('2026-09-13','2026-09-09',settings), 'closed')
  assert.equal(calendarDayState('2026-09-16','2026-09-09',settings), 'check')
  assert.equal(calendarDayState('2026-09-17','2026-09-09',settings), 'later')
})
