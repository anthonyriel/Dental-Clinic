import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeMobile, formatMobile } from '../src/lib/phone.js'

test('booking accepts local and international mobile formats and saves one consistent format', () => {
  for (const value of ['09123456789', '0912 345 6789', '+639123456789', '+63 912 345 6789', '639123456789', ' (0912) 345-6789 ']) {
    assert.equal(normalizeMobile(value), '09123456789')
  }
  assert.equal(formatMobile('+639123456789'), '+63 912 345 6789')
  assert.equal(formatMobile('09123456789'), '0912 345 6789')
})

test('incomplete, excessive and invalid numbers are rejected rather than silently truncated', () => {
  for (const value of ['', '09', '0912345678', '091234567890', '+63912345678', '08123456789', 'abc09123456789', '++639123456789']) {
    assert.equal(normalizeMobile(value), null)
    assert.equal(formatMobile(value), value)
  }
})
