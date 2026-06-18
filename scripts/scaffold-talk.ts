import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stringify } from 'yaml';

export interface NewEvent {
  id: string;
  notistEventId: string;
  name: string;
  date?: string;
  location?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
}

export interface NewTalk {
  id: string;
  title: string;
  notistSlug: string;
  presentedOn: string;
  eventId: string;
  abstractHtml?: string;
  slideSource: 'pdf' | 'images' | 'none';
  slidesPdf: string | null;
  slideImageCount: number;
  video: { provider: 'youtube' | 'vimeo'; id: string } | null;
  thumbnail: string | null;
  topics: string[];
  tech: string[];
}

const frontmatter = (obj: Record<string, unknown>): string => `---\n${stringify(obj)}---\n`;

export function talkMarkdown(t: NewTalk): string {
  // No notistId for new talks (identity is the filename). Field order mirrors
  // the ingest-written legacy files for readable diffs.
  return frontmatter({
    title: t.title,
    notistSlug: t.notistSlug,
    presentedOn: t.presentedOn,
    event: t.eventId,
    ...(t.abstractHtml ? { abstractHtml: t.abstractHtml } : {}),
    slideSource: t.slideSource,
    slidesPdf: t.slidesPdf,
    slideImageCount: t.slideImageCount,
    video: t.video,
    resources: [],
    thumbnail: t.thumbnail,
  });
}

export function eventMarkdown(e: NewEvent): string {
  return frontmatter({
    notistEventId: e.notistEventId,
    name: e.name,
    ...(e.date ? { date: e.date } : {}),
    ...(e.location ? { location: e.location } : {}),
    ...(e.url ? { url: e.url } : {}),
    ...(e.latitude != null ? { latitude: e.latitude } : {}),
    ...(e.longitude != null ? { longitude: e.longitude } : {}),
  });
}

export async function scaffold(
  talk: NewTalk,
  event: NewEvent | null,
  root: string,
): Promise<{ talkFile: string; eventFile?: string }> {
  const talkFile = resolve(root, 'src/content/talks', `${talk.id}.md`);
  await writeFile(talkFile, talkMarkdown(talk));

  let eventFile: string | undefined;
  if (event) {
    eventFile = resolve(root, 'src/content/events', `${event.id}.md`);
    await writeFile(eventFile, eventMarkdown(event));
  }

  // Merge the tag entry (keyed by notistSlug), keep keys sorted for stable diffs.
  const tagsPath = resolve(root, 'src/data/tags.json');
  const tags = JSON.parse(await readFile(tagsPath, 'utf8')) as Record<
    string,
    { topics: string[]; tech: string[] }
  >;
  tags[talk.notistSlug] = { topics: talk.topics, tech: talk.tech };
  const sorted = Object.fromEntries(Object.keys(tags).sort().map((k) => [k, tags[k]]));
  await writeFile(tagsPath, JSON.stringify(sorted, null, 2) + '\n');

  return { talkFile, ...(eventFile ? { eventFile } : {}) };
}
