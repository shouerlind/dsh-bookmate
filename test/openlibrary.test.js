import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOpenLibraryDocs, isRecommendable } from '../src/openlibrary.js'

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

test('normalizeOpenLibraryDocs turns raw search docs into candidate books', () => {
  const books = normalizeOpenLibraryDocs(rawDocs)
  assert.deepEqual(books, [
    {
      id: 'OL2711254W',
      title: '机器学习',
      author: 'Tom M. Mitchell',
      language: 'chi'
    },
    {
      id: 'OL999W',
      title: 'Untitled Notes',
      author: '',
      language: 'eng'
    }
  ])
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
