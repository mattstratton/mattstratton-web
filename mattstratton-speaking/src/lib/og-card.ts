/**
 * Build-time Open Graph card renderer.
 *
 * satori turns a small VDOM into an SVG (rendering text to vector <path>s, so the
 * output carries no font dependency), then sharp rasterises that SVG to PNG. Both
 * are plain npm packages — no system tools — so this runs unchanged in a pure
 * `astro build` on Netlify. Cards are 1200×630, the standard OG/Twitter size.
 *
 * Fonts are committed static TTFs under src/assets/og/fonts (asset ownership, no
 * CDN). They are read from the project root, which is the cwd during dev + build.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const FONT_DIR = path.join(process.cwd(), 'src/assets/og/fonts');
const fonts = [
  { name: 'Hanken Grotesk', weight: 600 as const, style: 'normal' as const, data: readFileSync(path.join(FONT_DIR, 'HankenGrotesk-SemiBold.ttf')) },
  { name: 'Hanken Grotesk', weight: 700 as const, style: 'normal' as const, data: readFileSync(path.join(FONT_DIR, 'HankenGrotesk-Bold.ttf')) },
  { name: 'JetBrains Mono', weight: 500 as const, style: 'normal' as const, data: readFileSync(path.join(FONT_DIR, 'JetBrainsMono-Medium.ttf')) },
];

// Brand tokens, mirrored from src/styles/global.css.
const PAPER = '#f5f1e8';
const INK = '#1b1712';
const INK_SOFT = '#6d6354';
const ACCENT = '#6d28d9';
const ACCENT_BRIGHT = '#d6298f';

const WIDTH = 1200;
const HEIGHT = 630;
const THUMB_W = 430;

/** Minimal hyperscript so we avoid a JSX toolchain just for satori. */
type Node = { type: string; props: Record<string, unknown> };
function h(type: string, props: Record<string, unknown> = {}, ...children: unknown[]): Node {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  // satori requires an explicit `display: flex` on any div with multiple children.
  const style = (props.style as Record<string, unknown>) ?? {};
  const finalStyle = type === 'div' && style.display === undefined ? { display: 'flex', ...style } : style;
  return { type, props: { ...props, style: finalStyle, children: kids.length === 1 ? kids[0] : kids } };
}

/** Larger type for short titles, smaller for long ones, so the card never overflows. */
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 30) return 76;
  if (n <= 55) return 64;
  if (n <= 85) return 52;
  return 44;
}

/** Read a /public image into a data URI for embedding (satori can't fetch). */
function thumbDataUri(thumbnailPath: string): string | null {
  try {
    const abs = path.join(process.cwd(), 'public', thumbnailPath.replace(/^\//, ''));
    const buf = readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export interface OgCardOptions {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  /** Repo path like /thumbnails/{id}.jpg; embedded as a side panel when present. */
  thumbnailPath?: string | null;
}

export async function renderOgCard(opts: OgCardOptions): Promise<Buffer> {
  const { eyebrow = 'MATTY STRATTON / SPEAKS', subtitle, badge } = opts;
  const title = opts.title.length > 120 ? `${opts.title.slice(0, 117).trimEnd()}…` : opts.title;
  const thumb = opts.thumbnailPath ? thumbDataUri(opts.thumbnailPath) : null;

  const leftColumn = h(
    'div',
    {
      style: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 64px',
      },
    },
    // Top row: eyebrow + optional badge pill.
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('div', { style: { fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: 22, letterSpacing: '0.14em', color: INK_SOFT } }, eyebrow),
      badge &&
        h(
          'div',
          {
            style: {
              fontFamily: 'JetBrains Mono',
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: '0.16em',
              color: '#ffffff',
              background: ACCENT,
              padding: '8px 16px',
              borderRadius: '999px',
            },
          },
          badge,
        ),
    ),
    // Middle: title + subtitle.
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h(
        'div',
        {
          style: {
            fontFamily: 'Hanken Grotesk',
            fontWeight: 700,
            fontSize: titleSize(title),
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: INK,
          },
        },
        title,
      ),
      subtitle &&
        h(
          'div',
          { style: { fontFamily: 'Hanken Grotesk', fontWeight: 600, fontSize: 30, lineHeight: 1.25, color: INK_SOFT, marginTop: 22 } },
          subtitle,
        ),
    ),
    // Footer.
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center' } },
      h('div', { style: { width: 28, height: 6, borderRadius: '3px', background: ACCENT_BRIGHT, marginRight: 16 } }),
      h('div', { style: { fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: 22, color: INK } }, 'speaking.mattstratton.com'),
    ),
  );

  const rightColumn = thumb
    ? h(
        'div',
        { style: { display: 'flex', width: THUMB_W, height: '100%', borderLeft: `3px solid ${INK}` } },
        h('img', { src: thumb, width: THUMB_W, height: HEIGHT - 14, style: { width: THUMB_W, height: '100%', objectFit: 'cover' } }),
      )
    : null;

  const tree = h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: PAPER } },
    // Top accent bar.
    h('div', { style: { display: 'flex', height: 14, width: '100%', background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_BRIGHT})` } }),
    // Body.
    h('div', { style: { display: 'flex', flex: '1' } }, leftColumn, rightColumn),
  );

  const svg = await satori(tree as never, { width: WIDTH, height: HEIGHT, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
