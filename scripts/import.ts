import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

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

export function buildFrontMatter(article: DevToArticle): Record<string, unknown> {
  const parsed = matter(article.body_markdown)
  const existing = parsed.data

  const fm: Record<string, unknown> = {
    title: existing.title ?? article.title,
    published: true,
    description: existing.description ?? article.description,
    tags: article.tag_list.slice(0, 4),
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
  const parsed = matter(article.body_markdown)
  const fm = buildFrontMatter(article)
  return matter.stringify(parsed.content, fm)
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
    const content = buildMarkdown(article)
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  Created: posts/${article.slug}.md (id: ${article.id})`)
    created++
  }

  console.log(`Done. Created ${created} new post(s).`)
}

// Only run main when this file is executed directly (not imported by tests)
const isMain = process.argv[1] != null &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))

if (isMain) {
  main().catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
}
