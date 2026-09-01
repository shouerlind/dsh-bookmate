// The book_rank tool: the second adapter on the Catalog seam. The model tags
// candidates (its semantic judgment) and hands them here; this tool adapts
// them into the recommend() engine (unchanged interface), feeding the profile
// tags as the stable signal and excluding books already recorded in 已推荐.
// Every invalid candidate the model sends is skipped; only a batch with no
// valid book at all is rejected. Optional url/cover from book_search ride
// through so the final recommendation can carry a clickable page and cover.
import { recommend } from './recommend.js'
import { loadProfile, normalizeBookKey } from './profile.js'

const DEFAULT_TOP_K = 3
const MAX_TOP_K = 10

function normalizeTag(tag) {
  return String(tag ?? '').trim().toLowerCase()
}

function normalizeCandidates(books) {
  return (Array.isArray(books) ? books : [])
    .map((book) => ({
      id: typeof book?.id === 'string' && book.id.length > 0 ? book.id : undefined,
      title: String(book?.title ?? '').trim(),
      author: String(book?.author ?? '').trim(),
      tags: [...new Set((Array.isArray(book?.tags) ? book.tags : []).map(normalizeTag).filter(Boolean))],
      ...(typeof book?.url === 'string' && book.url.length > 0 ? { url: book.url } : {}),
      ...(typeof book?.cover === 'string' && book.cover.length > 0 ? { cover: book.cover } : {})
    }))
    .filter((book) => book.title.length > 0 && book.author.length > 0)
}

// The browser can't reach covers.openlibrary.org without a proxy (the machine's
// direct connection needs 127.0.0.1:7890, which the GUI's image renderer does
// not use). So the DSH server fetches the cover here — it routes through the
// proxy like book_search did — and embeds it as a base64 data URI, which the
// browser renders without any external fetch. On any failure we keep the
// original URL rather than dropping the cover.
async function coverToDataUri(cover, fetchImpl) {
  if (typeof cover !== 'string') return cover
  if (cover.startsWith('data:')) return cover
  if (!/^https?:\/\//.test(cover)) return cover
  try {
    const res = await fetchImpl(cover)
    if (!res.ok) return cover
    const mime = res.headers.get?.('content-type') || 'image/jpeg'
    const bytes = Buffer.from(await res.arrayBuffer())
    return `data:${mime};base64,${bytes.toString('base64')}`
  } catch {
    return cover
  }
}

export function createBookRankTool({ loadProfileImpl = loadProfile, fetchImpl = fetch } = {}) {
  return {
    name: 'book_rank',
    description:
      'Rank tagged book candidates for this user. Pass the candidates with your own topic tags plus the current conversation topics; ' +
      'the tool scores them against the user profile, drops books already recommended before, and returns the top-k with reasons, ' +
      'embedding each cover as a base64 data URI so it renders in the browser. ' +
      'Carry each candidate\'s optional url and cover through from book_search.',
    parameters: {
      type: 'object',
      properties: {
        books: {
          type: 'array',
          description: 'Candidates to rank, each with title, author, and your topic tags.',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string', description: 'Optional source id (e.g. the OpenLibrary work id).' },
              title: { type: 'string' },
              author: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Your topic tags for this book (kebab-case).' },
              url: { type: 'string', description: 'Optional OpenLibrary work/edition page, carried through from book_search.' },
              cover: { type: 'string', description: 'Optional cover thumbnail URL, carried through from book_search.' }
            },
            required: ['title', 'author', 'tags']
          }
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Topic tags extracted from the current conversation (kebab-case).'
        },
        topK: { type: 'integer', description: `How many ranked books to return (1-${MAX_TOP_K}, default ${DEFAULT_TOP_K}).` }
      },
      required: ['books', 'topics'],
      additionalProperties: false
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ranked: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                author: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                score: { type: 'number' },
                reason: { type: 'string' },
                url: { type: 'string', description: 'OpenLibrary work/edition page, when the candidate carried one.' },
                cover: { type: 'string', description: 'Cover as a base64 data URI (renders in the browser), when the candidate carried one.' }
              },
              required: ['title', 'author', 'tags', 'score', 'reason']
            }
          }
        },
        required: ['ranked']
      },
      render: (_args, value) => [{ type: 'text', text: renderRanked(value) }]
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const topics = [...new Set((Array.isArray(args?.topics) ? args.topics : []).map(normalizeTag).filter(Boolean))]
      const candidates = normalizeCandidates(args?.books)
      if (candidates.length === 0) throw new Error('book_rank: books 里没有可排序的有效书（每本需要非空 title 和 author）')
      const topK = Number.isInteger(args?.topK) ? Math.min(Math.max(args.topK, 1), MAX_TOP_K) : DEFAULT_TOP_K

      const profile = await loadProfileImpl()
      const recommendedKeys = new Set(profile.recommended.map((entry) => normalizeBookKey(entry.title, entry.author)))
      const fresh = candidates.filter((book) => !recommendedKeys.has(normalizeBookKey(book.title, book.author)))
      const ranked = recommend({ profile: profile.tags, topics, catalog: fresh, topK })
        .map(({ book, score, reason }) => ({
          ...book.id !== undefined ? { id: book.id } : {},
          title: book.title,
          author: book.author,
          tags: book.tags,
          score,
          reason,
          ...(book.url ? { url: book.url } : {}),
          ...(book.cover ? { cover: book.cover } : {})
        }))
      for (const entry of ranked) {
        if (entry.cover !== undefined) entry.cover = await coverToDataUri(entry.cover, fetchImpl)
      }
      return { ranked }
    }
  }
}

function renderRanked(value) {
  if (value.ranked.length === 0) {
    return '这些候选书此前都已推荐过。请换一批候选，或从你自己的知识里另找新书（注明“未经线上核验”）。'
  }
  const lines = value.ranked.map((book, index) => {
    const id = book.id !== undefined ? `（id: ${book.id}）` : ''
    const link = book.url !== undefined ? ` ${book.url}` : ''
    // cover is now a data URI (potentially large); keep the render compact so
    // the model's context isn't bloated — the structured `cover` holds the value.
    const cover = book.cover !== undefined ? ` [封面]` : ''
    return `${index + 1}. 《${book.title}》 ${book.author}${id}${link}${cover} — ${book.reason}`
  })
  return `按画像与本次主题排序（top ${value.ranked.length}）：\n${lines.join('\n')}`
}
