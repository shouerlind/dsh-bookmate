import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBookRankTool } from '../src/book-rank.js'

const exec = { signal: new AbortController().signal }

const profileOf = (profile) => async () => profile

test('book_rank scores tagged candidates against profile and topics, top-k with reasons', async () => {
  const tool = createBookRankTool({
    loadProfileImpl: profileOf({ exists: true, tags: ['typescript'], recommended: [], text: '' })
  })
  const value = await tool.execute({
    books: [
      { id: 'OL1W', title: '深入浅出TypeScript', author: '廿三', tags: ['typescript'] },
      { title: '某烹饪书', author: '某作者', tags: ['cooking'] }
    ],
    topics: ['typescript']
  }, exec)
  assert.equal(value.ranked.length, 2)
  assert.equal(value.ranked[0].title, '深入浅出TypeScript')
  assert.equal(value.ranked[0].score, 1)
  assert.match(value.ranked[0].reason, /typescript/)
  assert.equal(value.ranked[1].score, 0)
  const blocks = tool.output.render({}, value)
  assert.equal(blocks.length, 1)
  assert.match(blocks[0].text, /深入浅出TypeScript/)
  assert.match(blocks[0].text, /1\./)
})

test('book_rank drops already-recommended books before ranking (key is case/whitespace-insensitive)', async () => {
  const tool = createBookRankTool({
    loadProfileImpl: profileOf({
      exists: true,
      tags: ['typescript'],
      recommended: [{ title: '深入浅出 typescript', author: '廿三' }],
      text: ''
    })
  })
  const value = await tool.execute({
    books: [
      { title: '深入浅出TypeScript', author: '廿三', tags: ['typescript'] },
      { title: '别的新书', author: '别的作者', tags: ['typescript'] }
    ],
    topics: ['typescript']
  }, exec)
  assert.deepEqual(value.ranked.map((book) => book.title), ['别的新书'])
})

test('book_rank tolerates an absent profile and ranks by topics alone', async () => {
  const tool = createBookRankTool({
    loadProfileImpl: profileOf({ exists: false, tags: [], recommended: [], text: '' })
  })
  const value = await tool.execute({
    books: [
      { title: '甲书', author: '甲作者', tags: ['tdd'] },
      { title: '乙书', author: '乙作者', tags: ['cooking'] }
    ],
    topics: ['tdd']
  }, exec)
  assert.equal(value.ranked[0].title, '甲书')
  assert.equal(value.ranked[0].score, 0.4)
  assert.equal(value.ranked[1].score, 0)
})

test('book_rank normalizes model-supplied tags and topics (trim + lowercase)', async () => {
  const tool = createBookRankTool({
    loadProfileImpl: profileOf({ exists: true, tags: ['tdd'], recommended: [], text: '' })
  })
  const value = await tool.execute({
    books: [{ title: '甲书', author: '甲作者', tags: [' TDD', 'Testing '] }],
    topics: ['TDD']
  }, exec)
  assert.equal(value.ranked[0].score, 1)
})

test('book_rank caps results at topK', async () => {
  const tool = createBookRankTool({
    loadProfileImpl: profileOf({ exists: false, tags: [], recommended: [], text: '' })
  })
  const value = await tool.execute({
    books: [
      { title: '甲', author: 'a', tags: ['x'] },
      { title: '乙', author: 'b', tags: ['x'] },
      { title: '丙', author: 'c', tags: ['x'] }
    ],
    topics: ['x'],
    topK: 2
  }, exec)
  assert.equal(value.ranked.length, 2)
})

test('book_rank reports an all-excluded batch as an empty ranked list', async () => {
  const tool = createBookRankTool({
    loadProfileImpl: profileOf({
      exists: true,
      tags: [],
      recommended: [{ title: '旧书', author: '旧作者' }],
      text: ''
    })
  })
  const value = await tool.execute({ books: [{ title: '旧书', author: '旧作者', tags: ['x'] }], topics: ['x'] }, exec)
  assert.deepEqual(value, { ranked: [] })
  const blocks = tool.output.render({}, value)
  assert.match(blocks[0].text, /另找/)
})

test('book_rank rejects candidate lists without a single valid book', async () => {
  const tool = createBookRankTool({
    loadProfileImpl: profileOf({ exists: false, tags: [], recommended: [], text: '' })
  })
  await assert.rejects(tool.execute({ books: [], topics: [] }, exec), /books/)
  await assert.rejects(tool.execute({ books: [{ title: '  ', author: '某作者' }], topics: [] }, exec), /books/)
})
