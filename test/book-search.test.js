import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchOpenLibrary, createBookSearchTool } from '../src/book-search.js'

const stubResponse = (docs) => ({ ok: true, status: 200, json: async () => ({ docs }) })

test('searchOpenLibrary queries OpenLibrary and returns normalized recommendable books', async () => {
  const calls = []
  const controller = new AbortController()
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options })
    return stubResponse([
      { key: '/works/OL1W', title: '深入浅出TypeScript', author_name: ['廿三'], language: ['chi'] },
      { key: '/works/OL2W', title: 'An English Book', author_name: ['Someone'], language: ['eng'] },
      { key: '/works/OL3W', title: '无作者', language: ['chi'] }
    ])
  }
  const books = await searchOpenLibrary({ query: 'typescript 入门', limit: 5, fetchImpl, signal: controller.signal })
  assert.equal(calls.length, 1)
  const url = new URL(calls[0].url)
  assert.equal(url.origin + url.pathname, 'https://openlibrary.org/search.json')
  assert.equal(url.searchParams.get('q'), 'typescript 入门')
  assert.equal(url.searchParams.get('language'), 'chi')
  assert.equal(url.searchParams.get('limit'), '5')
  assert.ok(calls[0].options.headers['user-agent'])
  assert.equal(calls[0].options.signal, controller.signal)
  assert.deepEqual(books, [
    { id: 'OL1W', title: '深入浅出TypeScript', author: '廿三', language: 'chi', url: 'https://openlibrary.org/works/OL1W' }
  ])
})

test('searchOpenLibrary collapses duplicate editions and keeps the one with a cover', async () => {
  const fetchImpl = async () => stubResponse([
    { key: '/works/OL1W', title: '重构', author_name: ['马丁·福勒'], language: ['chi'] },
    { key: '/works/OL2W', title: ' 重构 ', author_name: ['马丁·福勒'], language: ['chi'], cover_i: 777 }
  ])
  const books = await searchOpenLibrary({ query: '重构', fetchImpl })
  assert.equal(books.length, 1, 'the same title+author collapses to one recommendable candidate')
  assert.equal(books[0].id, 'OL1W', 'the first edition wins identity')
  assert.equal(books[0].cover, 'https://covers.openlibrary.org/b/id/777-S.jpg', 'a duplicate with a cover upgrades the kept entry')
})

test('searchOpenLibrary turns HTTP errors into clear failures for the model fallback', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) })
  await assert.rejects(searchOpenLibrary({ query: 'x', fetchImpl }), /OpenLibrary HTTP 500/)
})

test('searchOpenLibrary surfaces network failures with the underlying cause', async () => {
  const fetchImpl = async () => {
    throw new TypeError('fetch failed')
  }
  await assert.rejects(searchOpenLibrary({ query: 'x', fetchImpl }), /fetch failed/)
})

test('searchOpenLibrary returns an empty list when nothing matches', async () => {
  const fetchImpl = async () => stubResponse([])
  assert.deepEqual(await searchOpenLibrary({ query: 'x', fetchImpl }), [])
})

test('book_search tool executes through its output contract and renders candidate text', async () => {
  const fetchImpl = async () => stubResponse([
    { key: '/works/OL9W', title: '重构', author_name: ['马库斯·福勒'], language: ['chi'], cover_i: 55 }
  ])
  const tool = createBookSearchTool({ fetchImpl })
  assert.equal(tool.name, 'book_search')
  const exec = { signal: new AbortController().signal }
  const value = await tool.execute({ query: '重构工程' }, exec)
  assert.deepEqual(value, {
    source: 'openlibrary',
    books: [{
      id: 'OL9W',
      title: '重构',
      author: '马库斯·福勒',
      language: 'chi',
      url: 'https://openlibrary.org/works/OL9W',
      cover: 'https://covers.openlibrary.org/b/id/55-S.jpg'
    }]
  })
  const blocks = tool.output.render({ query: '重构' }, value)
  assert.equal(blocks.length, 1)
  assert.match(blocks[0].text, /重构/)
  assert.match(blocks[0].text, /马库斯·福勒/)
  assert.match(blocks[0].text, /OL9W/)
  assert.match(blocks[0].text, /https:\/\/openlibrary.org\/works\/OL9W/, 'render surfaces the work page link')
  assert.match(blocks[0].text, /covers\.openlibrary\.org\/b\/id\/55-S\.jpg/, 'render surfaces the cover URL so the model can pass it on')
})

test('book_search reports an empty result as a fallback instruction, not an error', async () => {
  const fetchImpl = async () => stubResponse([])
  const tool = createBookSearchTool({ fetchImpl })
  const exec = { signal: new AbortController().signal }
  const value = await tool.execute({ query: '冷门检索' }, exec)
  assert.deepEqual(value, { source: 'openlibrary', books: [] })
  const blocks = tool.output.render({ query: '冷门' }, value)
  assert.match(blocks[0].text, /未经线上核验/)
})

test('book_search rejects a blank query with a clear error', async () => {
  const tool = createBookSearchTool({ fetchImpl: async () => stubResponse([]) })
  const exec = { signal: new AbortController().signal }
  await assert.rejects(tool.execute({ query: '   ' }, exec), /query/)
})

test('book_search rejects a query shorter than OpenLibrary minimum with clear broadening guidance', async () => {
  const tool = createBookSearchTool({ fetchImpl: async () => stubResponse([]) })
  const exec = { signal: new AbortController().signal }
  await assert.rejects(tool.execute({ query: '重构' }, exec), /至少 3 个字符/)
  await assert.rejects(tool.execute({ query: '算法' }, exec), /refactoring/)
})
