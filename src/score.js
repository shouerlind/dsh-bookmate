// Minimal implementation for the scoreBook slice: count how many of the
// book's tags appear in the profile and in the topic list, weigh the two
// counts, and sum them. Defaults favour the stable profile signal over the
// transient conversation topic.
export function scoreBook(book, profile, topics, weights = { profileWeight: 0.6, topicWeight: 0.4 }) {
  const bookTags = new Set(book.tags)
  const profileHits = profile.filter((tag) => bookTags.has(tag)).length
  const topicHits = topics.filter((tag) => bookTags.has(tag)).length
  return profileHits * weights.profileWeight + topicHits * weights.topicWeight
}
