// OpenLibrary adapter (pure part): turn raw search.json docs into candidate
// books and decide which candidates are worth recommending. The HTTP call
// itself lives in the book_search tool (lib side); this module stays pure so
// the response shape and the acceptance rules are testable without network.
export function normalizeOpenLibraryDocs(docs) {
  return (docs ?? []).map((doc) => {
    // search.json's language:chi filter matches works that HAVE a Chinese
    // edition, but chi typically sits mid-array — surface it when present.
    const langs = doc.language ?? []
    return {
      id: (doc.key ?? '').split('/').pop(),
      title: doc.title ?? '',
      author: doc.author_name?.[0] ?? '',
      language: langs.find((l) => /^(zh|chi)/.test(l)) ?? langs[0] ?? ''
    }
  })
}

// Acceptance rules (design consensus): a book needs a title, an author, and a
// Chinese-language record — this plugin recommends to a Chinese-speaking user.
// OpenLibrary spells Chinese as 'chi' (MARC) or 'zh'.
export function isRecommendable(book) {
  return Boolean(book.title) && Boolean(book.author) && /^(zh|chi)/.test(book.language ?? '')
}
