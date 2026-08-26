// dsh-bookmate plugin entry. Registers the `book-recommend` skill on the host
// skill registry so every agent preset's scope chain carries it. The engine
// (src/recommend.js) stays a pure, tested library; the skill teaches the model
// how to use it (trigger on wrap-up, match against topics + the profile file).
//
// Provider protocol mirrors @deepseek-ai/dsh-skill-filesystem:
//   - list() discovers skills/<name>/SKILL.md candidates (frontmatter metadata)
//   - get() parses the SKILL.md and returns the full definition with a
//     directory resource base for relative references (e.g. BOOKS.md)
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const name = 'dsh-bookmate'
const inject = ['skills']
const SKILL_RANK = 550
const SOURCE = 'custom'

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  const block = text.slice(3, end)
  const body = text.slice(end + 4).replace(/^\n+/, '')
  const metadata = {}
  let currentKey = null
  let folded = false
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trimEnd()
    if (/^[ \t]/.test(line) && currentKey !== null) {
      const value = line.trim()
      if (value) {
        metadata[currentKey] = folded
          ? `${metadata[currentKey]} ${value}`
          : `${metadata[currentKey]}\n${value}`
      }
      continue
    }
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (!match) {
      currentKey = null
      folded = false
      continue
    }
    let value = match[2].trim()
    folded = value === '>' || value === '>-' || value === '>+'
    if (folded) value = ''
    else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    metadata[match[1]] = value
    currentKey = folded ? match[1] : null
  }
  return { metadata, body }
}

async function parseSkillFile(skillFile, signal) {
  let text
  try {
    text = await readFile(skillFile, 'utf8')
  } catch {
    return undefined
  }
  if (signal?.aborted) return undefined
  const parsed = parseFrontmatter(text)
  if (!parsed) return undefined
  return {
    name: parsed.metadata.name ?? '',
    description: parsed.metadata.description ?? '',
    whenToUse: parsed.metadata.whenToUse,
    metadata: parsed.metadata,
    content: parsed.body
  }
}

function invocationFrom(metadata) {
  if (metadata['disable-model-invocation'] === 'true') {
    return { modelInvocable: false, userInvocable: true }
  }
  return { modelInvocable: true, userInvocable: true }
}

export function apply(ctx) {
  const skillsRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills')
  ctx.skills.registerProvider((control) => ({
    name,
    async list(options) {
      let entries
      try {
        entries = await readdir(skillsRoot, { withFileTypes: true })
      } catch {
        return []
      }
      const candidates = []
      for (const entry of entries) {
        if (control.signal?.aborted) break
        if (!entry.isDirectory()) continue
        const skillDir = join(skillsRoot, entry.name)
        const skillFile = join(skillDir, 'SKILL.md')
        const parsed = await parseSkillFile(skillFile, control.signal)
        if (!parsed) continue
        candidates.push({
          name: parsed.name,
          description: parsed.description,
          ...(parsed.whenToUse !== undefined ? { whenToUse: parsed.whenToUse } : {}),
          invocation: invocationFrom(parsed.metadata),
          source: SOURCE,
          provider: name,
          rank: SKILL_RANK,
          locator: skillDir,
          path: skillFile
        })
      }
      return candidates
    },
    async get(candidate, options) {
      const parsed = await parseSkillFile(candidate.path, control.signal)
      if (!parsed) return undefined
      return {
        name: parsed.name,
        description: parsed.description,
        ...(parsed.whenToUse !== undefined ? { whenToUse: parsed.whenToUse } : {}),
        invocation: invocationFrom(parsed.metadata),
        source: SOURCE,
        provider: name,
        resourceBase: { kind: 'directory', path: candidate.locator },
        path: candidate.path,
        content: parsed.content
      }
    }
  }))
}

export { name, inject }
export default { apply, name, inject }
