// OpenLibrary adapter (impure part) + the model-facing book_search tool.
// searchOpenLibrary owns the HTTP call: request shape, User-Agent, signal
// forwarding, and error normalization — every failure throws a plain Error
// whose message reaches the model verbatim (registry renders `Error: <msg>`),
// which is the agreed degradation channel: the model falls back to its own
// knowledge and marks the recommendation 未经线上核验.
// createBookSearchTool builds the raw ToolDefinition for ctx.tools.register
// (the host registry needs no author-DSL — a plain definition object works).
import { normalizeOpenLibraryDocs, isRecommendable } from './openlibrary.js'

const SEARCH_URL = 'https://openlibrary.org/search.json'
const USER_AGENT = 'dsh-bookmate/0.1.0 (DeepSeek Harness plugin)'
const DEFAULT_LIMIT = 8
const MAX_LIMIT = 20
const TIMEOUT_MS = 15000

export async function searchOpenLibrary({ query, limit = DEFAULT_LIMIT, fetchImpl = fetch, signal }) {
  const bounded = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : DEFAULT_LIMIT
  const url = `${SEARCH_URL}?${new URLSearchParams({
    q: query,
    language: 'chi',
    limit: String(bounded),
    fields: 'key,title,author_name,language'
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
  return normalizeOpenLibraryDocs(payload?.docs)
    .filter(isRecommendable)
    .map(({ id, title, author, language }) => ({ id, title, author, language }))
}

export function createBookSearchTool({ fetchImpl = fetch } = {}) {
  return {
    name: 'book_search',
    description:
      'Search OpenLibrary for Chinese book candidates matching a free-text query. ' +
      'Returns normalized candidates (id, title, author, language) for you to tag and rank. ' +
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
                language: { type: 'string' }
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
      const books = await searchOpenLibrary({ query, limit: args?.limit, fetchImpl, signal: exec.signal })
      return { source: 'openlibrary', books }
    }
  }
}

function renderBooks(value) {
  if (value.books.length === 0) {
    return 'OpenLibrary 没有返回可推荐的中文书。请从你自己的知识里推荐，并注明“未经线上核验”。'
  }
  const lines = value.books.map((book) => `- 《${book.title}》 ${book.author}（id: ${book.id}）`)
  return `OpenLibrary 候选（${value.books.length} 本）：\n${lines.join('\n')}`
}
