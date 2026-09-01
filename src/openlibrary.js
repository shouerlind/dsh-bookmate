// OpenLibrary adapter (pure part): turn raw search.json docs into candidate
// books, decide which candidates are worth recommending, and collapse the
// same book's multiple editions/works into one. The HTTP call itself lives in
// the book_search tool (lib side); this module stays pure so the response
// shape, the acceptance rules, and the dedup are testable without network.
import { normalizeBookKey } from './profile.js'

export function normalizeOpenLibraryDocs(docs) {
  return (docs ?? []).map((doc) => {
    // search.json's language:chi filter matches works that HAVE a Chinese
    // edition, but chi typically sits mid-array — surface it when present.
    const langs = doc.language ?? []
    // key is a work (or edition) path like /works/OL123W or /books/OL456M.
    const key = typeof doc.key === 'string' ? doc.key : ''
    const url = key ? `https://openlibrary.org${key}` : undefined
    // OpenLibrary exposes a cover-image id (cover_i); build the medium-size URL.
    const cover = Number.isFinite(doc.cover_i) && doc.cover_i > 0
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined
    return {
      id: key.split('/').pop(),
      title: doc.title ?? '',
      author: doc.author_name?.[0] ?? '',
      language: langs.find((l) => /^(zh|chi)/.test(l)) ?? langs[0] ?? '',
      ...(url ? { url } : {}),
      ...(cover ? { cover } : {})
    }
  })
}

// Acceptance rules (design consensus): a book needs a title, an author, and a
// Chinese-language record — this plugin recommends to a Chinese-speaking user.
// OpenLibrary spells Chinese as 'chi' (MARC) or 'zh'.
export function isRecommendable(book) {
  return Boolean(book.title) && Boolean(book.author) && /^(zh|chi)/.test(book.language ?? '')
}

// Collapse the same book's multiple editions/works into one entry for ranking.
// Identity is the normalized title+author (case/whitespace-insensitive, CJK
// spacing-safe). The FIRST occurrence wins identity; a later duplicate that
// carries richer presentation (a cover or link) upgrades the kept entry rather
// than being dropped, so the model actually gets the clickable/visual info.
export function dedupeBooks(books) {
  const seen = new Set()
  const byKey = new Map()
  const out = []
  for (const book of books) {
    const key = normalizeBookKey(book.title, book.author)
    if (seen.has(key)) {
      const keep = byKey.get(key)
      if (!keep.cover && book.cover) keep.cover = book.cover
      if (!keep.url && book.url) keep.url = book.url
      continue
    }
    seen.add(key)
    byKey.set(key, book)
    out.push(book)
  }
  return out
}
