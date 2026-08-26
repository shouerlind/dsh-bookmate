import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allBooks, booksMatching } from '../src/catalog.js'

test('catalog ships a non-empty book set with required fields', () => {
  const books = allBooks()
  assert.ok(books.length >= 15, 'expected a useful built-in catalog')
  for (const book of books) {
    assert.ok(book.id, 'every book has an id')
    assert.ok(book.title, 'every book has a title')
    assert.ok(Array.isArray(book.tags) && book.tags.length > 0, 'every book has tags')
    assert.ok(book.blurb, 'every book has a one-line reason')
  }
})

test('booksMatching filters by canonical label', () => {
  const hits = booksMatching(['typescript'])
  assert.ok(hits.length > 0)
  assert.ok(hits.every((book) => book.tags.includes('typescript')))
})
