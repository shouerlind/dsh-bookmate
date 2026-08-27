// OpenLibrary adapter (pure part): turn raw search.json docs into candidate
// books and decide which candidates are worth recommending. The HTTP call
// itself lives in the book_search tool (lib side); this module stays pure so
// the response shape and the acceptance rules are testable without network.
export function normalizeOpenLibraryDocs(docs) {
  return (docs ?? []).map((doc) => ({
    id: (doc.key ?? '').split('/').pop(),
    title: doc.title ?? '',
    author: doc.author_name?.[0] ?? '',
    language: doc.language?.[0] ?? '',
    tags: [],
    blurb: ''
  }))
}

// Acceptance rules (design consensus): a book needs a title, an author, and a
// Chinese-language record — this plugin recommends to a Chinese-speaking user.
// OpenLibrary spells Chinese as 'chi' (MARC) or 'zh'.
export function isRecommendable(book) {
  return Boolean(book.title) && Boolean(book.author) && /^(zh|chi)/.test(book.language ?? '')
}
