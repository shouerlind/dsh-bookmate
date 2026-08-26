// Extract canonical topic labels from a conversation by scanning the domain
// lexicon. Latin triggers match on word boundaries (so 'ts' doesn't hit inside
// 'results'), Chinese triggers match as substrings (Chinese has no spaces).
// Deterministic: labels come back in lexicon definition order, deduplicated.
import { LEXICON, isLatinTrigger } from './lexicon.js'

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractTopics(text) {
  const lower = String(text).toLowerCase()
  const found = new Set()

  for (const [tag, { triggers }] of Object.entries(LEXICON)) {
    if (found.has(tag)) continue
    for (const trigger of triggers) {
      const hit = isLatinTrigger(trigger)
        ? new RegExp(`(^|[^a-z0-9])${escapeRegExp(trigger)}([^a-z0-9]|$)`).test(lower)
        : lower.includes(trigger)
      if (hit) {
        found.add(tag)
        break
      }
    }
  }

  return Object.keys(LEXICON).filter((tag) => found.has(tag))
}
