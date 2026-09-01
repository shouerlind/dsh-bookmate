// OpenLibrary adapter (impure part) + the model-facing book_search tool.
// searchOpenLibrary owns the HTTP call: request shape, User-Agent, signal
// forwarding, and error normalization — every failure throws a plain Error
// whose message reaches the model verbatim (registry renders `Error: <msg>`),
// which is the agreed degradation channel: the model falls back to its own
// knowledge and marks the recommendation 未经线上核验.
// createBookSearchTool builds the raw ToolDefinition for ctx.tools.register
// (the host registry needs no author-DSL — a plain definition object works).
import { normalizeOpenLibraryDocs, isRecommendable, dedupeBooks } from './openlibrary.js'

const SEARCH_URL = 'https://openlibrary.org/search.json'
const USER_AGENT = 'dsh-bookmate/0.1.0 (DeepSeek Harness plugin)'
const DEFAULT_LIMIT = 8
const MAX_LIMIT = 20
const TIMEOUT_MS = 15000
// OpenLibrary rejects queries shorter than this (2-char Chinese like 「重构」，
// 「算法」 get a 422 "too short"). Surface a clear message instead.
const MIN_QUERY_LENGTH = 3

export async function searchOpenLibrary({ query, limit = DEFAULT_LIMIT, fetchImpl = fetch, signal }) {
  const bounded = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : DEFAULT_LIMIT
  const url = `${SEARCH_URL}?${new URLSearchParams({
    q: query,
    language: 'chi',
    limit: String(bounded),
    fields: 'key,title,author_name,language,cover_i'
  })}`
  let response
  try {
    response = await fetchImpl(url, { headers: { 'user-agent': USER_AGENT }, signal })
  } catch (error) {
    throw new Error(`book_search: 无法连接 OpenLibrary（${error.message}）`, { cause: error })
  }
  if (!response.ok) throw new Error(`book_search: OpenLibrary HTTP ${response.status}`)
  let payload
  try {
    payload = await response.json()
  } catch (error) {
    throw new Error(`book_search: OpenLibrary 返回了无法解析的内容`, { cause: error })
  }
  return dedupeBooks(normalizeOpenLibraryDocs(payload?.docs).filter(isRecommendable))
}

export function createBookSearchTool({ fetchImpl = fetch } = {}) {
  return {
    name: 'book_search',
    description:
      'Search OpenLibrary for Chinese book candidates matching a free-text query. ' +
      'Returns normalized candidates (id, title, author, language, plus an optional work page url and cover thumbnail) ' +
      'for you to tag and rank. Same books across editions collapse to one. ' +
      'The query must be at least 3 characters — OpenLibrary rejects 2-char Chinese words like 「重构」, so prefer a ' +
      'longer Chinese phrase, a title fragment, or an English keyword (e.g. 「重构」→「refactoring」). ' +
      'When the search fails or returns nothing, fall back to recommending from your own knowledge.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search query: a topic, keyword, or title fragment.' },
        limit: { type: 'integer', description: `Maximum candidates to return (1-${MAX_LIMIT}, default ${DEFAULT_LIMIT}).` }
      },
      required: ['query'],
      additionalProperties: false
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          source: { type: 'string', const: 'openlibrary' },
          books: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                author: { type: 'string' },
                language: { type: 'string' },
                url: { type: 'string', description: 'OpenLibrary work/edition page.' },
                cover: { type: 'string', description: 'Medium cover thumbnail URL, when OpenLibrary has one.' }
              },
              required: ['id', 'title', 'author', 'language']
            }
          }
        },
        required: ['source', 'books']
      },
      render: (_args, value) => [{ type: 'text', text: renderBooks(value) }]
    },
    timeoutMs: TIMEOUT_MS,
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const query = typeof args?.query === 'string' ? args.query : ''
      if (query.trim().length === 0) throw new Error('book_search: query 必须是非空字符串')
      if (query.trim().length < MIN_QUERY_LENGTH) {
        throw new Error(`book_search: query 太短，OpenLibrary 要求至少 ${MIN_QUERY_LENGTH} 个字符（如 2 字中文「重构」会被拒绝）。请用更长的中文短语、书名片段或英文关键词（如「重构」→「refactoring」）。`)
      }
      const books = await searchOpenLibrary({ query, limit: args?.limit, fetchImpl, signal: exec.signal })
      return { source: 'openlibrary', books }
    }
  }
}

function renderBooks(value) {
  if (value.books.length === 0) {
    return 'OpenLibrary 没有返回可推荐的中文书。请从你自己的知识里推荐，并注明“未经线上核验”。'
  }
  const lines = value.books.map((book) => {
    const id = book.id ? `（id: ${book.id}）` : ''
    const link = book.url ? ` ${book.url}` : ''
    // show the cover URL so the model can carry it into book_rank (which embeds
    // it as a data URI) — otherwise the model never sees the cover to pass on.
    const cover = book.cover ? ` 封面: ${book.cover}` : ''
    return `- 《${book.title}》 ${book.author}${id}${link}${cover}`
  })
  return `OpenLibrary 候选（${value.books.length} 本）：\n${lines.join('\n')}`
}
