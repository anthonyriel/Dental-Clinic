import test from 'node:test'
import assert from 'node:assert/strict'
import { errorMessage } from '../src/lib/errors.js'

test('booking conflicts and duplicate keys are distinguishable without exposing row values', () => {
  assert.match(errorMessage({code:'23P01'}), /overlaps.*23P01/)
  const message = errorMessage({code:'23505',message:'duplicate key value violates unique constraint "appointments_pkey"',details:'Key (id)=(private-value) already exists.'})
  assert.match(message,/appointments_pkey.*23505/)
  assert(!message.includes('private-value'))
  assert.match(errorMessage({code:'23505'}),/Reference: 23505/)
})
