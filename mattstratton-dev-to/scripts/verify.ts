import * as fs from 'fs'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'
import { normalizeTags } from './import.js'

// PR-time guard: before a changed post merges (and the publisher overwrites dev.to with
// it), make sure git isn't about to DESTROY live data. Deliberately one-directional —
// it flags git being emptier/shorter than live, not any difference. A strict equality
// check would fire on every legitimate edit (retitling a post) and get ignored.
//
// Intentionally not compared: body_markdown and cover_image. The publisher rewrites
// relative image paths on send, so those never match what dev.to stores.

export interface LiveArticle {
  title?: string | null
  description?: string | null
  canonical_url?: string | null
  tags?: unknown // array on GET /articles/{id}
  tag_list?: unknown // comma-separated string on the same endpoint
}

export function findDestructive(git: Record<string, unknown>, live: LiveArticle): string[] {
  const problems: string[] = []

  const gitTags = normalizeTags(git.tags) ?? []
  const liveTags = normalizeTags(live.tags) ?? normalizeTags(live.tag_list) ?? []
  if (gitTags.length < liveTags.length) {
    problems.push(`tags: git has ${JSON.stringify(gitTags)}, live has ${JSON.stringify(liveTags)}`)
  }

  for (const field of ['title', 'description', 'canonical_url'] as const) {
    const g = String(git[field] ?? '').trim()
    const l = String(live[field] ?? '').trim()
    if (!g && l) problems.push(`${field}: git is empty, live has ${JSON.stringify(l)}`)
  }

  return problems
}

// dev.to 403s the default Node/Python user-agent ("403 Forbidden Bots"). Without an explicit
// one every fetch fails — easy to misread as "nothing wrong" if errors get swallowed.
const USER_AGENT = 'devto-git-sync/1.0 (github.com/mattstratton/mattstratton-dev-to)'

async function fetchLive(id: number): Promise<LiveArticle> {
  // Public endpoint: no API key needed.
  const res = await fetch(`https://dev.to/api/articles/${id}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`dev.to API error for article ${id}: ${res.status} ${res.statusText}`)
  return (await res.json()) as LiveArticle
}

async function main(files: string[]) {
  let bad = 0
  for (const file of files) {
    // Deleted in the PR, or a new git-native post with no `id` yet: nothing live to protect.
    if (!fs.existsSync(file)) continue
    const { data } = matter(fs.readFileSync(file, 'utf8'))
    if (data.id == null) continue

    const problems = findDestructive(data, await fetchLive(Number(data.id)))
    if (problems.length > 0) {
      bad++
      console.error(`✗ ${file} (id ${data.id}) would overwrite live data:`)
      for (const p of problems) console.error(`    ${p}`)
    } else {
      console.log(`✓ ${file}`)
    }
    // ponytail: sequential + fixed delay is fine for a handful of changed posts per PR.
    await new Promise((r) => setTimeout(r, 350))
  }
  if (bad > 0) process.exit(1)
}

const isMain = process.argv[1] != null && process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  main(process.argv.slice(2)).catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
}
