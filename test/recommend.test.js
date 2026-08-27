import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recommend } from '../src/recommend.js'

// Inline fixtures: recommend() accepts any book array (API results, model
// candidates), so the tests bring their own minimal catalog.
const fixtureCatalog = [
  { id: 'both', title: 'Both', author: 'X', tags: ['typescript', 'testing'], blurb: '' },
  { id: 'ts', title: 'Ts', author: 'X', tags: ['typescript'], blurb: '' },
  { id: 'tdd', title: 'Tdd', author: 'X', tags: ['testing'], blurb: '' },
  { id: 'off', title: 'Off', author: 'X', tags: ['cooking'], blurb: '' },
  { id: 'blank', title: 'Blank', author: 'X', tags: [], blurb: '' }
]

test('recommend caps to topK, ranks descending, and gives each a reason', () => {
  const recs = recommend({ profile: ['typescript'], topics: ['testing'], catalog: fixtureCatalog, topK: 2 })
  assert.equal(recs.length, 2)
  for (const rec of recs) {
    assert.ok(rec.book, 'each recommendation carries a book')
    assert.equal(typeof rec.score, 'number')
    assert.ok(rec.reason, 'each recommendation carries a reason')
  }
  assert.ok(recs[0].score >= recs[1].score, 'scores must be sorted descending')
})

test('recommend returns exactly topK when many books tie, and is deterministic', () => {
  const recs = recommend({ profile: [], topics: [], catalog: fixtureCatalog, topK: 5 })
  assert.equal(recs.length, 5)
  const again = recommend({ profile: [], topics: [], catalog: fixtureCatalog, topK: 5 })
  assert.deepEqual(again.map((r) => r.book.id), recs.map((r) => r.book.id))
})

test('recommend surfaces a book matching both profile and topic first', () => {
  const recs = recommend({ profile: ['typescript'], topics: ['testing'], catalog: fixtureCatalog })
  assert.equal(recs[0].book.id, 'both')
})
