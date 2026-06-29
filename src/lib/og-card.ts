/**
 * Build-time Open Graph card renderer (1200×630).
 *
 * satori turns a small VDOM into an SVG (text → vector paths, so no font
 * dependency at runtime), then sharp rasterises to PNG. Both are pure npm
 * packages — no system tools — so this runs unchanged in `astro build` on
 * Netlify. Adapted from the speaking site, differentiated by the teal/amber
 * accent and the "WRITES" eyebrow. Fonts are committed TTFs (no CDN).
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

// Brand tokens, mirrored from src/styles/global.css (differentiated from speaking).
const PAPER = '#f5f1e8';
const INK = '#1b1712';
const INK_SOFT = '#6d6354';
const ACCENT = '#0f766e';
const ACCENT_BRIGHT = '#c2410c';

const WIDTH = 1200;
const HEIGHT = 630;

type Node = { type: string; props: Record<string, unknown> };
function h(type: string, props: Record<string, unknown> = {}, ...children: unknown[]): Node {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  const style = (props.style as Record<string, unknown>) ?? {};
  const finalStyle = type === 'div' && style.display === undefined ? { display: 'flex', ...style } : style;
  return { type, props: { ...props, style: finalStyle, children: kids.length === 1 ? kids[0] : kids } };
}

function titleSize(title: string): number {
  const n = title.length;
  if (n <= 30) return 76;
  if (n <= 55) return 64;
  if (n <= 85) return 52;
  return 44;
}

/** The brand mark: a teal rounded square with the "M" monogram (matches favicon.svg). */
function monogram(size: number, radius: number, fontSize: number): Node {
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: radius, background: ACCENT } },
    h('div', { style: { fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize, color: PAPER, lineHeight: 1, marginTop: -2 } }, 'M'),
  );
}

export interface OgCardOptions {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
}

export async function renderOgCard(opts: OgCardOptions): Promise<Buffer> {
  const { eyebrow = 'MATTY STRATTON / WRITES', subtitle, badge } = opts;
  const title = opts.title.length > 120 ? `${opts.title.slice(0, 117).trimEnd()}…` : opts.title;

  const body = h(
    'div',
    { style: { flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 64px' } },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 18 } },
        monogram(60, 14, 38),
        h('div', { style: { fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: 22, letterSpacing: '0.14em', color: INK_SOFT } }, eyebrow),
      ),
      badge &&
        h(
          'div',
          { style: { fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: 18, letterSpacing: '0.16em', color: '#ffffff', background: ACCENT, padding: '8px 16px', borderRadius: '999px' } },
          badge,
        ),
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: titleSize(title), lineHeight: 1.05, letterSpacing: '-0.02em', color: INK } }, title),
      subtitle &&
        h('div', { style: { fontFamily: 'Hanken Grotesk', fontWeight: 600, fontSize: 30, lineHeight: 1.25, color: INK_SOFT, marginTop: 22 } }, subtitle),
    ),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center' } },
      h('div', { style: { width: 28, height: 6, borderRadius: '3px', background: ACCENT_BRIGHT, marginRight: 16 } }),
      h('div', { style: { fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: 22, color: INK } }, 'mattstratton.com'),
    ),
  );

  const tree = h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: PAPER } },
    h('div', { style: { display: 'flex', height: 14, width: '100%', background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_BRIGHT})` } }),
    h('div', { style: { display: 'flex', flex: '1' } }, body),
  );

  const svg = await satori(tree as never, { width: WIDTH, height: HEIGHT, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Square brand icon (apple-touch-icon + Buttondown upload): teal field, paper "M". */
export async function renderIcon(size = 512): Promise<Buffer> {
  const tree = h(
    'div',
    { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: ACCENT } },
    h('div', { style: { fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: Math.round(size * 0.66), color: PAPER, lineHeight: 1, marginTop: -Math.round(size * 0.04) } }, 'M'),
  );
  const svg = await satori(tree as never, { width: size, height: size, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
