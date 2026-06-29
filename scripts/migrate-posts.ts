/**
 * Bulk-convert the legacy Hugo blog (content/post/**) into an Astro content
 * collection at src/content/posts/.
 *
 * Design: reads from the Hugo source, writes to a fresh output dir — never edits
 * source, so it's safe to re-run (deterministic: same input → same output). Each
 * file's transform is wrapped in try/catch; failures are quarantined verbatim and
 * recorded in migration-report.json rather than failing the whole batch.
 *
 * Run: npm run migrate
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = join(ROOT, 'content', 'post');
const OUT_DIR = join(ROOT, 'src', 'content', 'posts');
const QUARANTINE_DIR = join(OUT_DIR, '_quarantine');
const PUBLIC_DIR = join(ROOT, 'public');
const REPORT = join(ROOT, 'scripts', 'migration-report.json');

// ── Pure helpers (unit-tested in migrate-posts.test.ts) ──────────────────────

export type Format = 'yaml' | 'toml';

export function detectFormat(raw: string): Format {
  return raw.startsWith('+++') ? 'toml' : 'yaml';
}

/** Split frontmatter from body on the FIRST pair of delimiter lines only
 *  (post bodies can themselves contain `---` or `+++`). */
export function splitFrontmatter(raw: string, fmt: Format): { fm: string; body: string } {
  const delim = fmt === 'toml' ? '+++' : '---';
  const lines = raw.split('\n');
  if (lines[0]?.trim() !== delim) throw new Error('no opening frontmatter delimiter');
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === delim) { end = i; break; }
  }
  if (end === -1) throw new Error('no closing frontmatter delimiter');
  return { fm: lines.slice(1, end).join('\n'), body: lines.slice(end + 1).join('\n') };
}

/** Minimal TOML reader for the 2 legacy TOML posts: `key = "value"` / `key = value`. */
export function parseSimpleToml(fm: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    let v: string = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

/** Coerce a possibly-single, possibly-missing, possibly-array value to string[]. */
export function toArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x)).filter((s) => s.length > 0);
  return [String(v)].filter((s) => s.length > 0);
}

/** Strip dead kramdown attribute-list tokens like {.snap_shots} {.tt-flickr}. */
export function cleanBody(body: string): string {
  return body.replace(/\{\.[\w.\- ]+\}/g, '');
}

/** url: "/life-in-general/foo" → "life-in-general/foo"; missing → "post/<slug>". */
export function buildPermalink(url: unknown, fallbackSlug: string): string {
  if (typeof url === 'string' && url.trim().length > 0) {
    return url.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  }
  return `post/${fallbackSlug}`;
}

/**
 * Resolve a featured/hero image, restoring what WordPress designated:
 *   1. explicit `image:` (Hugo rendered these)
 *   2. `thesis_post_image` (WordPress featured image; Hugo silently dropped it)
 *   3. fallback: the post's first LOCAL /wp-content/uploads image (real on-disk
 *      media — external Flickr/LiveJournal firsts are skipped as they're dead)
 * The dead cdn.mattstratton.com host is rewritten to the local path. Existence on
 * disk is checked by the caller (so we never set a broken hero).
 */
export function resolveHeroImage(fm: Record<string, unknown>, body: string): string | undefined {
  let raw = toArray(fm.image)[0] ?? toArray(fm.thesis_post_image)[0];
  if (!raw) {
    const m = body.match(/(?:src=["']|!\[[^\]]*\]\()(\/wp-content\/uploads\/[^"')\s>]+\.(?:png|jpe?g|gif|webp))/i);
    if (m) raw = m[1];
  }
  if (!raw) return undefined;
  return raw.replace(/^https?:\/\/cdn\.mattstratton\.com/i, '');
}

/** Normalize a parsed frontmatter object into the clean Astro schema (allowlist). */
export function normalizeFrontmatter(
  fm: Record<string, unknown>,
  fallbackSlug: string,
  body = '',
): Record<string, unknown> {
  const clean: Record<string, unknown> = {
    title: fm.title != null ? String(fm.title) : fallbackSlug,
    date: fm.date != null ? String(fm.date) : undefined,
    permalink: buildPermalink(fm.url, fallbackSlug),
    author: fm.author != null ? String(fm.author) : 'Matt Stratton',
    categories: toArray(fm.categories),
    tags: toArray(fm.tags),
    legacy: true,
  };
  if (fm.description != null) clean.description = String(fm.description);
  const hero = resolveHeroImage(fm, body);
  if (hero) clean.image = hero;
  const dsq = toArray(fm.dsq_thread_id)[0];
  if (dsq) clean.disqusThreadId = dsq;
  return clean;
}

// ── Driver ───────────────────────────────────────────────────────────────────

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

interface ReportEntry { file: string; status: 'ok' | 'quarantined'; permalink?: string; error?: string; }

function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const files = walk(SRC_DIR).filter((f) => basename(f) !== '_index.md');
  const permalinks = new Map<string, string>();
  const report: ReportEntry[] = [];
  let droppedFields = new Set<string>();

  for (const file of files) {
    const rel = relative(SRC_DIR, file);
    try {
      const raw = readFileSync(file, 'utf8');
      const fmt = detectFormat(raw);
      const { fm: fmRaw, body } = splitFrontmatter(raw, fmt);
      const fm = fmt === 'toml' ? parseSimpleToml(fmRaw) : (YAML.parse(fmRaw) as Record<string, unknown>);

      // Output filename: flatten bundles (dir/index.md → dir.md), else keep basename.
      const isBundle = basename(file) === 'index.md';
      const slug = isBundle ? basename(file.replace(/\/index\.md$/, '')) : basename(file, '.md');
      const outName = `${slug}.md`;

      const clean = normalizeFrontmatter(fm ?? {}, slug, body);
      // Drop a resolved hero that points at a local file we don't actually have,
      // so we never ship a broken featured image.
      if (typeof clean.image === 'string' && clean.image.startsWith('/') && !existsSync(join(PUBLIC_DIR, clean.image.replace(/^\//, '')))) {
        delete clean.image;
      }
      // If the hero image also appears inline in the body, flag it so the post
      // page renders it once (no top-hero duplicate) — the body already shows it.
      // The list thumbnail still uses `image` regardless.
      if (typeof clean.image === 'string') {
        const base = clean.image.split('/').pop();
        if (base && body.includes(base)) clean.heroInBody = true;
      }
      for (const k of Object.keys(fm ?? {})) {
        if (!['title', 'date', 'url', 'author', 'description', 'image', 'thesis_post_image', 'categories', 'tags', 'dsq_thread_id'].includes(k)) {
          droppedFields.add(k);
        }
      }

      const permalink = clean.permalink as string;
      if (permalinks.has(permalink)) {
        throw new Error(`duplicate permalink "${permalink}" (also from ${permalinks.get(permalink)})`);
      }
      permalinks.set(permalink, rel);

      const out = `---\n${YAML.stringify(clean, { lineWidth: 0 }).trimEnd()}\n---\n${cleanBody(body)}`;
      writeFileSync(join(OUT_DIR, outName), out, 'utf8');

      // Co-located bundle assets → public/ at the path the body references.
      if (isBundle) {
        const bundleDir = file.replace(/\/index\.md$/, '');
        for (const asset of readdirSync(bundleDir)) {
          if (asset === 'index.md') continue;
          const dest = join(PUBLIC_DIR, 'post', slug);
          mkdirSync(dest, { recursive: true });
          copyFileSync(join(bundleDir, asset), join(dest, asset));
        }
      }

      report.push({ file: rel, status: 'ok', permalink });
    } catch (err) {
      mkdirSync(QUARANTINE_DIR, { recursive: true });
      try { copyFileSync(file, join(QUARANTINE_DIR, basename(file))); } catch { /* ignore */ }
      report.push({ file: rel, status: 'quarantined', error: String(err) });
    }
  }

  const ok = report.filter((r) => r.status === 'ok').length;
  const quarantined = report.filter((r) => r.status === 'quarantined');
  writeFileSync(
    REPORT,
    JSON.stringify({ total: files.length, ok, quarantined: quarantined.length, droppedFields: [...droppedFields].sort(), entries: report }, null, 2),
  );

  console.log(`migrated ${ok}/${files.length} posts → src/content/posts/`);
  console.log(`dropped frontmatter fields (allowlisted out): ${[...droppedFields].sort().join(', ')}`);
  if (quarantined.length) {
    console.log(`⚠ ${quarantined.length} quarantined → src/content/posts/_quarantine/ (see migration-report.json)`);
    for (const q of quarantined) console.log(`  - ${q.file}: ${q.error}`);
  }
}

main();
