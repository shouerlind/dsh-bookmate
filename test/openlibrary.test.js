import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOpenLibraryDocs, isRecommendable, dedupeBooks } from '../src/openlibrary.js'

// Fixture shaped like the docs array of OpenLibrary search.json
// (fields per https://openlibrary.org/dev/docs/api/search).
const rawDocs = [
  {
    key: '/works/OL2711254W',
    title: '机器学习',
    author_name: ['Tom M. Mitchell', 'Another Author'],
    language: ['chi', 'eng'],
    cover_i: 123456
  },
  {
    key: '/works/OL999W',
    title: 'Untitled Notes',
    language: ['eng']
  }
]

test('normalizeOpenLibraryDocs turns raw search docs into candidate books with a work page and cover', () => {
  const books = normalizeOpenLibraryDocs(rawDocs)
  assert.deepEqual(books, [
    {
      id: 'OL2711254W',
      title: '机器学习',
      author: 'Tom M. Mitchell',
      language: 'chi',
      url: 'https://openlibrary.org/works/OL2711254W',
      cover: 'https://covers.openlibrary.org/b/id/123456-S.jpg'
    },
    {
      id: 'OL999W',
      title: 'Untitled Notes',
      author: '',
      language: 'eng',
      url: 'https://openlibrary.org/works/OL999W'
    }
  ])
})

test('normalizeOpenLibraryDocs omits a cover when the work has no cover image', () => {
  const books = normalizeOpenLibraryDocs([
    { key: '/works/OL42W', title: '无封面之作', author_name: ['某人'], language: ['chi'] }
  ])
  assert.equal(books[0].url, 'https://openlibrary.org/works/OL42W')
  assert.ok(!('cover' in books[0]), 'no cover_i means no cover field')
})

test('normalizeOpenLibraryDocs prefers the Chinese code when chi is not first', () => {
  // Live shape: search.json's language:chi filter matches works that HAVE a
  // Chinese edition, but chi typically appears mid-array, not first.
  const books = normalizeOpenLibraryDocs([
    {
      key: '/works/OL1131092W',
      title: 'Intruder in the Dust',
      author_name: ['William Faulkner'],
      language: ['swe', 'chi', 'fre', 'eng']
    }
  ])
  assert.equal(books[0].language, 'chi')
  assert.equal(isRecommendable(books[0]), true, 'a work with a Chinese edition is recommendable even when chi is not the first code')
})

test('isRecommendable accepts a titled, authored, Chinese book and rejects the rest', () => {
  const good = { id: 'OL1', title: '机器学习', author: 'Tom Mitchell', language: 'chi' }
  const zhCode = { id: 'OL2', title: '机器学习', author: 'Tom Mitchell', language: 'zh' }
  const english = { id: 'OL3', title: 'Deep Learning', author: 'Goodfellow', language: 'eng' }
  const noAuthor = { id: 'OL4', title: '匿名之书', author: '', language: 'chi' }
  assert.equal(isRecommendable(good), true)
  assert.equal(isRecommendable(zhCode), true)
  assert.equal(isRecommendable(english), false, 'non-Chinese books are not recommendable to this user')
  assert.equal(isRecommendable(noAuthor), false, 'a book needs an author to be worth recommending')
})

test('dedupeBooks collapses the same book across editions, keeping the first and upgrading its cover', () => {
  const first = { id: 'OL1W', title: '深入浅出 TypeScript', author: '廿三', language: 'chi', url: 'https://openlibrary.org/works/OL1W' }
  const second = { id: 'OL2W', title: '深入浅出TypeScript', author: '廿三', language: 'chi', url: 'https://openlibrary.org/works/OL2W', cover: 'https://covers.openlibrary.org/b/id/9-S.jpg' }
  const other = { id: 'OL3W', title: '重构', author: '马丁·福勒', language: 'chi', url: 'https://openlibrary.org/works/OL3W' }
  const out = dedupeBooks([first, second, other])
  assert.equal(out.length, 2, 'the same title+author is one book, regardless of whitespace')
  assert.equal(out[0].id, 'OL1W', 'the first occurrence wins identity')
  assert.equal(out[0].cover, 'https://covers.openlibrary.org/b/id/9-S.jpg', 'a duplicate with a cover upgrades the kept entry')
  assert.equal(out[1].id, 'OL3W')
})

test('dedupeBooks keeps distinct books even with the same title but different authors', () => {
  const a = { id: 'OL1W', title: 'JavaScript', author: '甲', language: 'chi' }
  const b = { id: 'OL2W', title: 'JavaScript', author: '乙', language: 'chi' }
  assert.equal(dedupeBooks([a, b]).length, 2, 'title alone is not the identity for dedup')
})
