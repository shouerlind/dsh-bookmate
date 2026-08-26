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

export async function loadProfile(filePath = DEFAULT_PROFILE_PATH) {
  try {
    const text = await readFile(filePath, 'utf8')
    return { exists: true, tags: parseTags(text), text }
  } catch {
    return { exists: false, tags: [], text: '' }
  }
}

export async function saveProfile({ tags }, filePath = DEFAULT_PROFILE_PATH) {
  const lines = ['# 用户画像（dsh-bookmate）', '', '## 兴趣标签']
  for (const tag of tags) lines.push(`- ${tag}`)
  lines.push('')
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, lines.join('\n'), 'utf8')
}
