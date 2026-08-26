import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractTopics } from '../src/topic.js'

test('extractTopics maps zh + en triggers to canonical topic labels', () => {
  const topics = extractTopics('我想用 TDD 重构这个 TypeScript 模块，顺便写点测试')
  assert.deepEqual(new Set(topics), new Set(['typescript', 'testing', 'refactoring']))
})

test('extractTopics avoids unrelated triggers and returns [] when nothing hits', () => {
  const topics = extractTopics('今天天气不错，出去散步')
  assert.deepEqual(topics, [])
})
