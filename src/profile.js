// User profile persistence for dsh-bookmate. The profile lives at
// ~/.dsh/book-profile.md and records the user's interest tags. Reads/writes
// take an explicit filePath (defaulting there) so tests can use a temp file
// without touching the real one.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const DEFAULT_PROFILE_PATH = join(homedir(), '.dsh', 'book-profile.md')

// Parse interest tags out of a profile markdown body: entries under the
// "## 兴趣标签" section, or any bullet list of simple lowercase tokens.
export function parseTags(text) {
  const section = text.split(/^##\s*兴趣标签\s*$/m)[1] ?? text
  const tags = []
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*[-*]?\s*([a-z0-9][a-z0-9-]*)\s*$/i)
    if (m) tags.push(m[1].toLowerCase())
  }
  return [...new Set(tags)]
}

export function mergeTags(existing, incoming) {
  return [...new Set([...existing, ...incoming])]
}

// Canonical dedup key for a recommended book: case-insensitive title+author
// with ALL whitespace removed, so CJK/latin spacing variants (「深入浅出
// TypeScript」 vs 「深入浅出TypeScript」) and casing differences are one book.
export function normalizeBookKey(title, author) {
  const norm = (s) => String(s).trim().replace(/\s+/g, '').toLowerCase()
  return `${norm(title)}::${norm(author)}`
}

// Parse the "## 已推荐" section: bullets of the form `- Title — Author — Date`.
// Sections absent (older profiles) simply yield no entries.
export function parseRecommended(text) {
  const section = text.split(/^##\s*已推荐\s*$/m)[1] ?? ''
  const entries = []
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*-\s*(.+?)\s*$/)
    if (!m) continue
    if (/^##/.test(m[1])) break
    const [title, author, date] = m[1].split(/\s+—\s+/)
    if (!title || !author) continue
    entries.push(date ? { title, author, date } : { title, author })
  }
  return entries
}

export async function loadProfile(filePath = DEFAULT_PROFILE_PATH) {
  try {
    const text = await readFile(filePath, 'utf8')
    return { exists: true, tags: parseTags(text), recommended: parseRecommended(text), text }
  } catch {
    return { exists: false, tags: [], recommended: [], text: '' }
  }
}

export async function saveProfile({ tags, recommended = [] }, filePath = DEFAULT_PROFILE_PATH) {
  const seen = new Set()
  const lines = ['# 用户画像（dsh-bookmate）', '', '## 兴趣标签']
  for (const tag of tags) lines.push(`- ${tag}`)
  if (recommended.length > 0) {
    lines.push('', '## 已推荐')
    for (const { title, author, date } of recommended) {
      const key = normalizeBookKey(title, author)
      if (seen.has(key)) continue
      seen.add(key)
      lines.push(`- ${title} — ${author}${date ? ` — ${date}` : ''}`)
    }
  }
  lines.push('')
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, lines.join('\n'), 'utf8')
}
