// The main recommendation seam: rank a catalog against the user's profile and
// the current conversation's topics, cap to topK, and attach a human reason.
import { scoreBook } from './score.js'

function buildReason(book, profile, topics) {
  const matchedTopic = book.tags.find((tag) => topics.includes(tag))
  const matchedProfile = book.tags.find((tag) => profile.includes(tag))
  if (matchedTopic && matchedProfile) {
    return `既回应你本次聊的「${matchedTopic}」，也贴合你在意的「${matchedProfile}」。`
  }
  if (matchedProfile) return `贴合你在意的「${matchedProfile}」。`
  if (matchedTopic) return `正好回应你本次聊的「${matchedTopic}」。`
  return '一本值得列入待读清单的书。'
}

export function recommend({ profile, topics, catalog, weights, topK = 3 }) {
  const scored = catalog.map((book) => ({
    book,
    score: scoreBook(book, profile, topics, weights)
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, topK).map(({ book, score }) => ({
    book,
    score,
    reason: buildReason(book, profile, topics)
  }))
}
