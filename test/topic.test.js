import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractTopics } from '../src/topic.js'

test('extractTopics drops stopwords and returns lowercase unique keywords', () => {
  const topics = extractTopics('The TDD loop and the TypeScript refactor to test a module')
  assert.deepEqual(topics, ['tdd', 'loop', 'typescript', 'refactor', 'test', 'module'])
})
