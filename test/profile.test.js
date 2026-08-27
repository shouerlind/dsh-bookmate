import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadProfile, saveProfile, parseTags, mergeTags, parseRecommended, normalizeBookKey } from '../src/profile.js'

test('parseTags reads tags from the 兴趣标签 section', () => {
  const text = '# 用户画像\n\n## 兴趣标签\n- typescript\n- testing\n\n## 历史\n随便\n'
  assert.deepEqual(parseTags(text), ['typescript', 'testing'])
})

test('mergeTags dedupes and preserves order', () => {
  assert.deepEqual(mergeTags(['typescript'], ['testing', 'typescript', 'ai']), ['typescript', 'testing', 'ai'])
})

test('loadProfile returns exists:false for an absent file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bookmate-'))
  try {
    const p = await loadProfile(join(dir, 'missing.md'))
    assert.equal(p.exists, false)
    assert.deepEqual(p.tags, [])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('saveProfile then loadProfile round-trips the tags', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bookmate-'))
  const file = join(dir, 'book-profile.md')
  try {
    await saveProfile({ tags: ['typescript', 'ai'] }, file)
    const loaded = await loadProfile(file)
    assert.equal(loaded.exists, true)
    assert.deepEqual(loaded.tags, ['typescript', 'ai'])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('saveProfile then loadProfile round-trips recommended books with their dates', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bookmate-'))
  const file = join(dir, 'book-profile.md')
  try {
    const recommended = [
      { title: 'Machine Learning', author: 'Tom Mitchell', date: '2026-08-28' },
      { title: '重构', author: 'Martin Fowler', date: '2026-08-27' }
    ]
    await saveProfile({ tags: ['ai'], recommended }, file)
    const loaded = await loadProfile(file)
    assert.deepEqual(loaded.recommended, recommended)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('saveProfile counts the same book once even if spelled differently', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bookmate-'))
  const file = join(dir, 'book-profile.md')
  try {
    const recommended = [
      { title: 'Machine Learning', author: 'Tom Mitchell', date: '2026-08-28' },
      { title: '  machine  learning ', author: 'tom MITCHELL', date: '2026-08-29' }
    ]
    await saveProfile({ tags: [], recommended }, file)
    const loaded = await loadProfile(file)
    assert.equal(loaded.recommended.length, 1, 'case/whitespace variants of one book dedupe to one entry')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('parseRecommended reads only the 已推荐 section, not tag bullets', () => {
  const text = [
    '# 用户画像',
    '',
    '## 兴趣标签',
    '- Effective TypeScript — Dan Vanderkam',
    '',
    '## 已推荐',
    '- Machine Learning — Tom Mitchell — 2026-08-28',
    '',
    '## 历史',
    '- 2026-08-28 聊了机器学习'
  ].join('\n')
  assert.deepEqual(parseRecommended(text), [
    { title: 'Machine Learning', author: 'Tom Mitchell', date: '2026-08-28' }
  ])
})

test('normalizeBookKey is case and whitespace insensitive', () => {
  assert.equal(normalizeBookKey('  Machine  Learning ', 'Tom Mitchell'), normalizeBookKey('machine learning', 'TOM MITCHELL'))
  assert.notEqual(normalizeBookKey('Machine Learning', 'Tom Mitchell'), normalizeBookKey('Machine Learning', ' başka'))
})
