import test from 'node:test'
import assert from 'node:assert/strict'
import { managementSummary } from '../src/lib/managementSummary.js'

function fixture(responses) {
  const calls = []
  return {
    calls,
    from(table) {
      const index = calls.length
      const call = { table, filters: [], orders: [] }
      calls.push(call)
      const query = {
        select(columns, options) { Object.assign(call, { columns, options }); return query },
        eq(...args) { call.filters.push(['eq', ...args]); return query },
        not(...args) { call.filters.push(['not', ...args]); return query },
        order(value) { call.orders.push(value); return query },
        limit(value) { call.limit = value; return query },
        then(resolve, reject) { return Promise.resolve(responses[index]).then(resolve, reject) },
      }
      return query
    },
  }
}

test('dashboard uses server totals and a bounded daily preview, not downloaded history', async () => {
  const rows = Array.from({length: 6}, (_, id) => ({ id }))
  const client = fixture([
    { data: rows, count: 12 }, { count: 7 }, { count: 2 }, { count: 15000 },
  ])
  assert.deepEqual(await managementSummary(client, '2026-09-09'), {
    today: rows, todayCount: 12, pendingCount: 7, cancellationCount: 2, totalCount: 15000,
  })
  assert.equal(client.calls[0].limit, 6)
  assert.deepEqual(client.calls[0].filters, [['eq','appointment_date','2026-09-09'],['not','status','in','(cancelled,no_show)']])
  assert.deepEqual(client.calls[0].orders, ['starts_at','id'])
  assert(client.calls.slice(1).every(call => call.options.head && call.options.count === 'exact'))
})

test('dashboard reports failed or unavailable counts instead of presenting zero appointments', async () => {
  await assert.rejects(() => managementSummary(fixture([{error:new Error('offline')},{count:0},{count:0},{count:0}]), '2026-09-09'), /offline/)
  await assert.rejects(() => managementSummary(fixture([{data:[],count:0},{count:null},{count:0},{count:0}]), '2026-09-09'), /totals are unavailable/)
})
