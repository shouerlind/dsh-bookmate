// Minimal implementation to satisfy the first red test: lowercase the text,
// split on non-word boundaries, and keep distinctive tokens (dropping
// stopwords, preserving first-occurrence order, de-duplicated).
const STOPWORDS = new Set([
  'the', 'and', 'to', 'a', 'an', 'of', 'for', 'in', 'on', 'with',
  'is', 'are', 'was', 'this', 'that', 'it', 'at', 'by', 'as', 'from',
  '的', '了', '和', '用', '在', '要', '一个', '这个', '那个', '不', '很'
])

export function extractTopics(text) {
  const tokens = String(text)
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter(Boolean)

  const seen = new Set()
  const out = []
  for (const token of tokens) {
    if (STOPWORDS.has(token)) continue
    if (seen.has(token)) continue
    seen.add(token)
    out.push(token)
  }
  return out
}
