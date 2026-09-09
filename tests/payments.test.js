import test from 'node:test'
import assert from 'node:assert/strict'
import { paymentCentavos, paymentTotal } from '../src/lib/payments.js'

test('payment inputs distinguish blank from zero and total decimal amounts in centavos', () => {
  for (const value of ['', null, undefined, '-1', '1.234', 'NaN', 'Infinity', '1e3', ' 1']) assert.equal(paymentCentavos(value),null)
  assert.equal(paymentCentavos('0'),0)
  assert.equal(paymentCentavos('10.5'),1050)
  assert.equal(paymentTotal([{id:'a'},{id:'b'}],{a:'0.10',b:'0.20'}),0.3)
  assert.equal(paymentTotal([{id:'a'},{id:'b'}],{a:'0'}),null)
  assert.equal(paymentTotal([],{}),null)
})
