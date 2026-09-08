import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingDestination } from '../src/lib/navigation.js'
import { priceLabel, visitDateLabel } from '../src/lib/presentation.js'

test('booking return links preserve service selection and reject unrelated destinations', () => {
  assert.equal(bookingDestination('/dashboard/book?service=abc'), '/dashboard/book?service=abc')
  for (const path of [null, '', 'https://example.com', '//example.com', '/dashboard/bookings', '/management']) {
    assert.equal(bookingDestination(path), null)
  }
})

test('unknown prices are not presented as free and visit dates keep the clinic date', () => {
  assert.equal(priceLabel(null), 'Ask the clinic')
  assert.equal(priceLabel(''), 'Ask the clinic')
  assert.equal(priceLabel(0), '₱0')
  assert.equal(priceLabel('1200.50'), '₱1,200.5')
  assert.equal(visitDateLabel('2026-09-15'), 'September 15, 2026')
})
