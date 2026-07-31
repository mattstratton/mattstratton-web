import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import matter from 'gray-matter'
import {
  buildFrontMatter,
  buildMarkdown,
  getTrackedIds,
  isParseableFrontMatter,
  normalizeTags,
  type DevToArticle,
} from './import.js'

const sampleArticle: DevToArticle = {
  id: 12345,
  slug: 'my-cool-post',
  title: 'My Cool Post',
  description: 'A description',
  tag_list: ['typescript', 'devops'],
  canonical_url: 'https://dev.to/mattystratton/my-cool-post-xxxx',
  cover_image: 'https://example.com/cover.png',
  series: null,
  body_markdown: '# Hello\n\nThis is the body.',
  published: true,
}

const articleWithExistingFrontMatter: DevToArticle = {
  ...sampleArticle,
  id: 99999,
  slug: 'already-formatted',
  body_markdown: `---
title: "Already Formatted"
description: "Pre-existing front matter"
tags: [go, postgres]
---

# Already Formatted

Body content here.`,
}

const articleWithColonInTitle: DevToArticle = {
  ...sampleArticle,
  id: 77777,
  slug: 'colon-title',
  title: 'Postgres Extensions Cheat Sheet: Replace 7 Databases With SQL',
  body_markdown: `---
title: Postgres Extensions Cheat Sheet: Replace 7 Databases With SQL
published: true
tags: PostgreSQL,Extensions
---

Body content with colon in title.`,
}

// dev.to writes tags as a comma-separated string in the front matter it stores inside
// body_markdown. Unlike articleWithColonInTitle, this block is valid YAML, so it actually
// reaches the `existing.tags` branch instead of falling back to the API's tag_list array.
const articleWithCommaSeparatedTags: DevToArticle = {
  ...sampleArticle,
  id: 55555,
  slug: 'comma-tags',
  tag_list: ['fallback'],
  body_markdown: `---
title: "Comma Tags"
published: true
tags: devops, ai, webdev, cicd
---

Body content here.`,
}

// dev.to's stored front matter can carry an empty tag list even when the live article
// has real tags (tags edited in the web UI after the body was last saved).
const articleWithEmptyStoredTags: DevToArticle = {
  ...sampleArticle,
  id: 44444,
  slug: 'empty-stored-tags',
  tag_list: ['infosec', 'privacy', 'security'],
  body_markdown: `---
title: "Empty Stored Tags"
published: true
tags: []
---

Body content here.`,
}

describe('normalizeTags', () => {
  it('splits a comma-separated string into trimmed tags', () => {
    expect(normalizeTags('devops, ai, webdev, cicd')).toEqual(['devops', 'ai', 'webdev', 'cicd'])
  })

  it('passes an array through, trimming and dropping blanks', () => {
    expect(normalizeTags([' go ', '', 'postgres'])).toEqual(['go', 'postgres'])
  })

  it('returns undefined for nullish, empty, and whitespace-only input', () => {
    expect(normalizeTags(null)).toBeUndefined()
    expect(normalizeTags(undefined)).toBeUndefined()
    expect(normalizeTags([])).toBeUndefined()
    expect(normalizeTags('')).toBeUndefined()
    expect(normalizeTags('  ,  ')).toBeUndefined()
  })

  it('does not slice a string by character (the tag-truncation regression)', () => {
    expect(normalizeTags('devops, ai, webdev, cicd')).not.toContain('devo')
  })
})

describe('buildFrontMatter', () => {
  it('injects id from article', () => {
    const fm = buildFrontMatter(sampleArticle)
    expect(fm.id).toBe(12345)
  })

  it('sets published to true', () => {
    const fm = buildFrontMatter(sampleArticle)
    expect(fm.published).toBe(true)
  })

  it('truncates tags to 4 max', () => {
    const article: DevToArticle = {
      ...sampleArticle,
      tag_list: ['a', 'b', 'c', 'd', 'e'],
    }
    const fm = buildFrontMatter(article)
    expect((fm.tags as string[]).length).toBeLessThanOrEqual(4)
  })

  it('uses canonical_url from article when present', () => {
    const fm = buildFrontMatter(sampleArticle)
    expect(fm.canonical_url).toBe(sampleArticle.canonical_url)
  })

  it('does not include series key when series is null', () => {
    const fm = buildFrontMatter(sampleArticle)
    expect('series' in fm).toBe(false)
  })

  it('includes series key when series is set', () => {
    const article: DevToArticle = { ...sampleArticle, series: 'My Series' }
    const fm = buildFrontMatter(article)
    expect(fm.series).toBe('My Series')
  })

  it('preserves existing front matter fields from body_markdown', () => {
    const fm = buildFrontMatter(articleWithExistingFrontMatter)
    expect(fm.id).toBe(99999)
    expect(fm.published).toBe(true)
  })

  it('prefers existing tags from body_markdown when present', () => {
    const fm = buildFrontMatter(articleWithExistingFrontMatter)
    // articleWithExistingFrontMatter has tags: [go, postgres] in its body_markdown front matter
    expect((fm.tags as string[])).toEqual(['go', 'postgres'])
  })

  it('parses a comma-separated tags string from body_markdown into an array', () => {
    const fm = buildFrontMatter(articleWithCommaSeparatedTags)
    expect(fm.tags).toEqual(['devops', 'ai', 'webdev', 'cicd'])
  })

  it('still caps a comma-separated tags string at 4 tags', () => {
    const article: DevToArticle = {
      ...articleWithCommaSeparatedTags,
      body_markdown: articleWithCommaSeparatedTags.body_markdown.replace(
        'tags: devops, ai, webdev, cicd',
        'tags: a, b, c, d, e'
      ),
    }
    expect(buildFrontMatter(article).tags).toEqual(['a', 'b', 'c', 'd'])
  })

  it('falls back to API tag_list when stored front matter has an empty tag list', () => {
    const fm = buildFrontMatter(articleWithEmptyStoredTags)
    expect(fm.tags).toEqual(['infosec', 'privacy', 'security'])
  })

  it('does not throw when body_markdown front matter has an unquoted colon in title', () => {
    expect(() => buildFrontMatter(articleWithColonInTitle)).not.toThrow()
  })

  it('falls back to API title when body_markdown front matter is unparseable', () => {
    const fm = buildFrontMatter(articleWithColonInTitle)
    expect(fm.title).toBe('Postgres Extensions Cheat Sheet: Replace 7 Databases With SQL')
    expect(fm.id).toBe(77777)
  })
})

describe('buildMarkdown', () => {
  it('produces valid front matter block', () => {
    const md = buildMarkdown(sampleArticle)
    const parsed = matter(md)
    expect(parsed.data.id).toBe(12345)
    expect(parsed.data.published).toBe(true)
  })

  it('preserves body content', () => {
    const md = buildMarkdown(sampleArticle)
    const parsed = matter(md)
    expect(parsed.content.trim()).toContain('This is the body.')
  })

  it('does not throw when body_markdown has invalid YAML front matter (colon in title)', () => {
    expect(() => buildMarkdown(articleWithColonInTitle)).not.toThrow()
  })

  it('produces parseable output even when body_markdown had invalid front matter', () => {
    const md = buildMarkdown(articleWithColonInTitle)
    const parsed = matter(md)
    expect(parsed.data.id).toBe(77777)
    expect(parsed.data.title).toBe('Postgres Extensions Cheat Sheet: Replace 7 Databases With SQL')
    expect(parsed.content.trim()).toContain('Body content with colon in title.')
  })

  it('strips front matter from body when body_markdown already has it', () => {
    const md = buildMarkdown(articleWithExistingFrontMatter)
    const parsed = matter(md)
    // Should not double-nest front matter
    expect(parsed.content).not.toContain('---')
    expect(parsed.data.id).toBe(99999)
  })
})

describe('isParseableFrontMatter', () => {
  it('returns true for well-formed front matter', () => {
    expect(isParseableFrontMatter('---\ntitle: Fine\n---\nBody')).toBe(true)
  })

  it('returns false for an unquoted colon in the title', () => {
    expect(
      isParseableFrontMatter(
        '---\ntitle: Postgres Extensions Cheat Sheet: Replace 7 Databases With SQL\n---\nBody'
      )
    ).toBe(false)
  })

  it('returns false for an unquoted colon in the description', () => {
    expect(
      isParseableFrontMatter('---\ntitle: Fine\ndescription: A: B: C\n---\nBody')
    ).toBe(false)
  })

  it('returns true for output produced by buildMarkdown, even from a malformed source', () => {
    const md = buildMarkdown(articleWithColonInTitle)
    expect(isParseableFrontMatter(md)).toBe(true)
  })
})

describe('getTrackedIds', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devto-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns empty set when directory is empty', () => {
    const ids = getTrackedIds(tmpDir)
    expect(ids.size).toBe(0)
  })

  it('returns empty set when no markdown files have id', () => {
    fs.writeFileSync(path.join(tmpDir, 'post.md'), '---\ntitle: No ID\n---\n\nBody.')
    const ids = getTrackedIds(tmpDir)
    expect(ids.size).toBe(0)
  })

  it('returns id from a tracked post', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'post.md'),
      '---\ntitle: Has ID\nid: 42\n---\n\nBody.'
    )
    const ids = getTrackedIds(tmpDir)
    expect(ids.has(42)).toBe(true)
  })

  it('collects ids from multiple files', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '---\nid: 1\n---\nA')
    fs.writeFileSync(path.join(tmpDir, 'b.md'), '---\nid: 2\n---\nB')
    const ids = getTrackedIds(tmpDir)
    expect(ids.has(1)).toBe(true)
    expect(ids.has(2)).toBe(true)
  })

  it('ignores non-.md files', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitkeep'), '')
    fs.writeFileSync(path.join(tmpDir, 'image.png'), '')
    const ids = getTrackedIds(tmpDir)
    expect(ids.size).toBe(0)
  })
})
