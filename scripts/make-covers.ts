/**
 * Render the hero/cover images for the fitness-tracker series.
 *
 * Same satori + sharp pipeline as src/lib/og-card.ts (text becomes vector
 * paths, so no runtime font dependency), but a dark 2000x840 layout matching
 * the hand-built covers already in public/writing/. 2000x840 is 2.38:1, which
 * is dev.to's native cover ratio, so one file serves both the site hero and
 * the crosspost.
 *
 * The right-hand panel carries real output from the post it belongs to. That
 * is the point: these are not decoration, they are the evidence, and every
 * line in them is reproducible against the live database.
 *
 * ASCII only inside the panels. satori draws glyphs from the committed TTFs,
 * and arrows/checkmarks/box-drawing are not reliably in them -- emphasis is
 * carried by colour and by small drawn rectangles instead.
 *
 *   npx tsx scripts/make-covers.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const FONT_DIR = path.join(process.cwd(), 'src/assets/og/fonts');
const fonts = [
  { name: 'Hanken Grotesk', weight: 600 as const, style: 'normal' as const, data: readFileSync(path.join(FONT_DIR, 'HankenGrotesk-SemiBold.ttf')) },
  { name: 'Hanken Grotesk', weight: 700 as const, style: 'normal' as const, data: readFileSync(path.join(FONT_DIR, 'HankenGrotesk-Bold.ttf')) },
  { name: 'JetBrains Mono', weight: 500 as const, style: 'normal' as const, data: readFileSync(path.join(FONT_DIR, 'JetBrainsMono-Medium.ttf')) },
];

const WIDTH = 2000;
const HEIGHT = 840;

const BG = '#0b0e13';
const PANEL = '#151b24';
const PANEL_BAR = '#1d2530';
const CREAM = '#f5f1e8';
const MUTED = '#8b98a8';
const DIM = '#5a6675';
const TEAL = '#2dd4bf';
const AMBER = '#f0a01e';
const GREEN = '#4ade80';
const RED = '#fb7185';

type Node = { type: string; props: Record<string, unknown> };
function h(type: string, props: Record<string, unknown> = {}, ...children: unknown[]): Node {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  const style = (props.style as Record<string, unknown>) ?? {};
  const finalStyle = type === 'div' && style.display === undefined ? { display: 'flex', ...style } : style;
  return { type, props: { ...props, style: finalStyle, children: kids.length === 1 ? kids[0] : kids } };
}

const mono = (size: number, color: string, extra: Record<string, unknown> = {}) => ({
  fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: size, color, ...extra,
});

/** One line inside the panel. `mark` draws a small colour chip in the gutter. */
type Line = { text: string; color?: string; mark?: string; rule?: boolean };

function panelLines(lines: Line[], fontSize: number): Node[] {
  return lines.map((l) => {
    if (l.rule) {
      return h('div', { style: { display: 'flex', alignItems: 'center', height: fontSize * 1.85 } },
        h('div', { style: { height: 1, width: 300, background: '#2c3644' } }),
        h('div', { style: { ...mono(fontSize * 0.78, DIM), marginLeft: 18 } }, l.text),
      );
    }
    return h('div', { style: { display: 'flex', alignItems: 'center', height: fontSize * 1.85 } },
      h('div', { style: { width: 16, height: 16, borderRadius: 4, marginRight: 18, background: l.mark ?? 'transparent' } }),
      h('div', { style: mono(fontSize, l.color ?? CREAM) }, l.text),
    );
  });
}

interface Cover {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  titleSize: number;
  panelTitle: string;
  panelFont: number;
  lines: Line[];
}

const COVERS: Cover[] = [
  {
    slug: 'the-past-keeps-changing',
    // Eyebrows stay under ~42 characters. The left column fits one line of
    // JetBrains Mono at 24px/0.16em and a wrapped eyebrow orphans a word.
    eyebrow: '69,000 ROWS. NOT A SCALE PROBLEM.',
    title: 'The Past Keeps Changing',
    subtitle: '69% of it, so far',
    accent: TEAL,
    titleSize: 100,
    panelTitle: 'basal_energy_kcal, observed 2026-08-09',
    panelFont: 27,
    lines: [
      { text: ' 718.42   reported 2026-08-09', color: MUTED },
      { text: '1746.06   reported 2026-08-09', color: MUTED },
      { text: '1817.51   reported 2026-08-09', color: MUTED },
      { text: 'the day ends', rule: true },
      { text: '1842.11   reported 2026-08-10', color: CREAM },
      { text: '1834.03   reported 2026-08-10   goes DOWN', color: AMBER, mark: AMBER },
      { text: '2319.02   reported 2026-08-10', color: CREAM },
      { text: '2319.02   reported 2026-08-11   settles', color: TEAL, mark: TEAL },
    ],
  },
  {
    slug: 'every-number-i-didnt-measure-was-wrong',
    eyebrow: 'FIVE NUMBERS. FOUR RETRACTIONS.',
    title: "Every Number I Didn't Measure Was Wrong",
    subtitle: 'one of them had a test defending it',
    accent: AMBER,
    titleSize: 82,
    panelTitle: 'db/migrations/0001_observations.sql',
    panelFont: 25,
    lines: [
      { text: '- a yearly chunk averages ~69 rows per metric', color: RED, mark: RED },
      { text: '+ measured over 73k LOADED rows: average 135,', color: GREEN, mark: GREEN },
      { text: '+ median 3 in 2025. The mean was the one', color: GREEN },
      { text: '+ statistic guaranteed to hide the problem.', color: GREEN },
      { text: 'tests/coach.test.ts', rule: true },
      { text: '- assert.match(prompt, /7% coverage/)', color: RED, mark: RED },
      { text: '+ assert.doesNotMatch(prompt, /\\d+% coverage/)', color: GREEN, mark: GREEN },
    ],
  },
  {
    slug: 'dont-give-the-model-sql',
    eyebrow: 'SIX TRAPS. THIRTEEN TOOLS. NO QUERY BOX.',
    title: "Don't Give the Model SQL",
    subtitle: 'the prompt mitigates, the tool guarantees',
    accent: TEAL,
    titleSize: 100,
    panelTitle: 'lib/coach/tools.ts',
    panelFont: 26,
    lines: [
      { text: 'SELECT avg(calories) FROM nutrition', color: RED, mark: RED },
      { text: 'WHERE observed_on > now() - 7', color: RED },
      { text: 'averages a half-finished day. Silently.', color: DIM },
      { text: '', rule: false },
      { text: 'get_nutrition({ days: 7 })', color: GREEN, mark: GREEN },
      { text: 'every window ends before today_local()', color: DIM },
      { text: 'today is not excluded. It is unreachable.', color: MUTED },
    ],
  },
];

function build(c: Cover): Node {
  const left = h('div',
    { style: { display: 'flex', flexDirection: 'column', width: 900, paddingLeft: 96, paddingTop: 118, paddingBottom: 96, justifyContent: 'center' } },
    h('div', { style: { ...mono(24, DIM, { letterSpacing: '0.16em' }), marginBottom: 40 } }, c.eyebrow),
    h('div', { style: { fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: c.titleSize, lineHeight: 1.03, letterSpacing: '-0.025em', color: CREAM } }, c.title),
    h('div', { style: { fontFamily: 'Hanken Grotesk', fontWeight: 600, fontSize: 40, color: c.accent, marginTop: 30 } }, c.subtitle),
    h('div', { style: { width: 132, height: 7, borderRadius: 4, background: AMBER, marginTop: 42 } }),
  );

  const panel = h('div',
    { style: { display: 'flex', flexDirection: 'column', flex: '1', marginRight: 88, marginTop: 104, marginBottom: 104, borderRadius: 20, background: PANEL, border: '1px solid #263040', overflow: 'hidden' } },
    h('div',
      { style: { display: 'flex', alignItems: 'center', height: 62, background: PANEL_BAR, paddingLeft: 26, paddingRight: 26, borderBottom: '1px solid #263040' } },
      h('div', { style: { width: 14, height: 14, borderRadius: 7, background: '#ff5f57' } }),
      h('div', { style: { width: 14, height: 14, borderRadius: 7, background: '#febc2e', marginLeft: 10 } }),
      h('div', { style: { width: 14, height: 14, borderRadius: 7, background: '#28c840', marginLeft: 10 } }),
      h('div', { style: { display: 'flex', flex: '1', justifyContent: 'flex-end' } },
        h('div', { style: mono(22, MUTED) }, c.panelTitle)),
    ),
    // Centred rather than top-aligned: the panels hold different line counts
    // and a top-aligned short one leaves a dead band along the bottom edge.
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center', padding: '30px 34px' } }, ...panelLines(c.lines, c.panelFont)),
  );

  return h('div',
    { style: { display: 'flex', width: '100%', height: '100%', background: BG, backgroundImage: `radial-gradient(900px 520px at 78% 12%, ${c.accent}1f, transparent)` } },
    left,
    panel,
  );
}

const OUT_SITE = path.join(process.cwd(), 'public/writing');
const OUT_DEVTO = path.join(process.cwd(), 'mattstratton-dev-to/posts/assets');

for (const c of COVERS) {
  const svg = await satori(build(c) as never, { width: WIDTH, height: HEIGHT, fonts });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  const dir = path.join(OUT_SITE, c.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${c.slug}-cover.png`), png);
  writeFileSync(path.join(OUT_DEVTO, `${c.slug}-cover.png`), png);
  console.log(`${c.slug}-cover.png  ${(png.length / 1024).toFixed(0)} KB  -> public/writing/${c.slug}/ and dev-to assets/`);
}
