import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreBook } from '../src/score.js'

test('scoreBook ranks a book hitting both profile and topic above one hitting neither', () => {
  const weights = { profileWeight: 0.6, topicWeight: 0.4 }
  const both = scoreBook({ id: '1', tags: ['typescript', 'testing'] }, ['typescript'], ['testing'], weights)
  const none = scoreBook({ id: '2', tags: ['cooking'] }, ['typescript'], ['testing'], weights)
  assert.ok(both > none, 'a book matching profile AND topic should outrank one matching neither')
})
