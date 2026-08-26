import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadProfile, saveProfile, parseTags, mergeTags } from '../src/profile.js'

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
