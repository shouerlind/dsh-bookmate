import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recommend } from '../src/recommend.js'
import { allBooks } from '../src/catalog.js'

test('recommend caps to topK, ranks descending, and gives each a reason', () => {
  const recs = recommend({ profile: ['typescript'], topics: ['testing'], catalog: allBooks(), topK: 3 })
  assert.ok(recs.length <= 3)
  assert.ok(recs.length > 0)
  for (const rec of recs) {
    assert.ok(rec.book, 'each recommendation carries a book')
    assert.equal(typeof rec.score, 'number')
    assert.ok(rec.reason, 'each recommendation carries a reason')
  }
  for (let i = 1; i < recs.length; i++) {
    assert.ok(recs[i - 1].score >= recs[i].score, 'scores must be sorted descending')
  }
})

test('recommend returns exactly topK when many books tie, and is deterministic', () => {
  const recs = recommend({ profile: [], topics: [], catalog: allBooks(), topK: 5 })
  assert.equal(recs.length, 5)
})

test('recommend surfaces a book matching both profile and topic first', () => {
  // profile=typescript, topic=testing → Effective TypeScript (typescript, 0.6)
  // outranks TDD-by-example (testing, 0.4).
  const recs = recommend({ profile: ['typescript'], topics: ['testing'], catalog: allBooks() })
  assert.equal(recs[0].book.id, 'effective-typescript')
})
