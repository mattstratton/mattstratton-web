import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

export interface DevToArticle {
  id: number
  slug: string
  title: string
  description: string
  tag_list: string[]
  canonical_url: string | null
  cover_image: string | null
  series: string | null
  body_markdown: string
  published: boolean
}

const POSTS_DIR = path.join(process.cwd(), 'posts')
const USER_AGENT = 'devto-git-sync/1.0 (github.com/mattstratton/mattstratton-dev-to)'

export function getTrackedIds(postsDir: string): Set<number> {
  const ids = new Set<number>()
  if (!fs.existsSync(postsDir)) return ids

  const entries = fs.readdirSync(postsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const filePath = path.join(postsDir, entry.name)
    const content = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(content)
    if (data.id != null) ids.add(Number(data.id))
  }
  return ids
}

function parseBodyMarkdown(bodyMarkdown: string): { data: Record<string, unknown>; content: string } {
  try {
    const parsed = matter(bodyMarkdown)
    return { data: parsed.data, content: parsed.content }
  } catch {
    // body_markdown has a front matter block with invalid YAML (e.g. unquoted colon in title).
    // Strip the front matter block and fall back to API JSON fields for all metadata.
    const stripped = bodyMarkdown.replace(/^---[\s\S]*?---\n?/, '')
    return { data: {}, content: stripped }
  }
}

// Checks whether a markdown string's front matter is valid YAML. Used both to warn when
// dev.to's stored copy of an article is malformed, and to verify our own generated output
// before writing it to disk (a broken front matter block written now would re-break the
// publish workflow's "retrieve existing articles" step down the line).
export function isParseableFrontMatter(markdown: string): boolean {
  try {
    matter(markdown)
    return true
  } catch {
    return false
  }
}

export function buildFrontMatter(article: DevToArticle): Record<string, unknown> {
  const { data: existing } = parseBodyMarkdown(article.body_markdown)

  const fm: Record<string, unknown> = {
    title: existing.title ?? article.title,
    published: true,
    description: existing.description ?? article.description,
    tags: (existing.tags as string[] | undefined)?.slice(0, 4) ?? article.tag_list.slice(0, 4),
    canonical_url:
      existing.canonical_url ??
      article.canonical_url ??
      `https://dev.to/${article.slug}`,
    id: article.id,
  }

  if (existing.cover_image ?? article.cover_image) {
    fm.cover_image = existing.cover_image ?? article.cover_image
  }

  if (existing.series ?? article.series) {
    fm.series = existing.series ?? article.series
  }

  return fm
}

export function buildMarkdown(article: DevToArticle): string {
  const { content } = parseBodyMarkdown(article.body_markdown)
  const fm = buildFrontMatter(article)
  return matter.stringify(content, fm)
}

async function fetchPublishedArticles(apiKey: string): Promise<DevToArticle[]> {
  const articles: DevToArticle[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://dev.to/api/articles/me/published?page=${page}&per_page=1000`,
      {
        headers: {
          'api-key': apiKey,
          'User-Agent': USER_AGENT,
        },
      }
    )

    if (!res.ok) {
      throw new Error(`dev.to API error: ${res.status} ${res.statusText}`)
    }

    const batch = (await res.json()) as DevToArticle[]
    if (batch.length === 0) break
    articles.push(...batch)
    if (batch.length < 1000) break
    page++
  }

  return articles
}

async function main() {
  const apiKey = process.env.DEVTO_API_KEY
  if (!apiKey) {
    console.error('DEVTO_API_KEY env var is required')
    process.exit(1)
  }

  console.log('Fetching published articles from dev.to...')
  const articles = await fetchPublishedArticles(apiKey)
  console.log(`Found ${articles.length} published article(s) on dev.to`)

  const trackedIds = getTrackedIds(POSTS_DIR)
  console.log(`Found ${trackedIds.size} already-tracked post(s) in git`)

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }

  let created = 0
  for (const article of articles) {
    if (trackedIds.has(article.id)) {
      continue
    }
    const filePath = path.join(POSTS_DIR, `${article.slug}.md`)
    if (fs.existsSync(filePath)) {
      console.warn(`  Skipped: posts/${article.slug}.md already exists on disk (slug collision — git-native draft?)`)
      continue
    }
    if (!isParseableFrontMatter(article.body_markdown)) {
      console.warn(
        `  Warning: article ${article.id} (${article.slug}) has unparseable front matter stored on dev.to (likely an unquoted colon in title/description); falling back to API fields`
      )
    }
    const content = buildMarkdown(article)
    if (!isParseableFrontMatter(content)) {
      console.error(`  Error: generated front matter for posts/${article.slug}.md is not valid YAML, skipping this article`)
      continue
    }
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  Created: posts/${article.slug}.md (id: ${article.id})`)
    created++
  }

  console.log(`Done. Created ${created} new post(s).`)
}

// Only run main when this file is executed directly (not imported by tests)
const isMain = process.argv[1] != null && process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  main().catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
}
