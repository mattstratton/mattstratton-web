import { stripHtml } from '../../src/lib/strip-html';

export interface TalkFrontmatter {
  notistId?: string;
  title: string;
  notistSlug: string;
  presentedOn: string;
  event?: string;
  abstractHtml?: string;
  video?: { provider: 'youtube' | 'vimeo'; id: string } | null;
}

export interface EventFrontmatter {
  name: string;
  location?: string;
}

export interface TalkTags {
  topics: string[];
  tech: string[];
}

/** Year of a talk's `presentedOn` frontmatter string — no Date/timezone parsing. */
export function talkYear(presentedOn: string): number {
  const m = presentedOn.match(/^(\d{4})/);
  if (!m) throw new Error(`unparseable presentedOn: ${presentedOn}`);
  return Number(m[1]);
}

export function talkMemoryTree(year: number): string {
  return `~/talks/${year}`;
}

export function buildTalkMemoryContent(
  talk: TalkFrontmatter,
  event: EventFrontmatter | null,
  transcriptText: string | null,
): string {
  const date = talk.presentedOn.slice(0, 10);
  const lines = [
    talk.title,
    event
      ? `Delivered at ${event.name}, ${event.location ?? 'Unknown location'} — ${date}`
      : `Delivered — ${date}`,
  ];
  if (talk.abstractHtml) {
    lines.push('', 'Abstract:', stripHtml(talk.abstractHtml));
  }
  if (transcriptText) {
    lines.push('', 'Transcript:', transcriptText.trim());
  }
  return lines.join('\n');
}

export function buildTalkMemoryMeta(
  id: string,
  talk: TalkFrontmatter,
  event: EventFrontmatter | null,
  url: string,
  hasTranscript: boolean,
  tags: TalkTags | undefined,
): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    notistId: id,
    year: talkYear(talk.presentedOn),
    presentedOn: talk.presentedOn,
    hasVideo: !!talk.video,
    hasTranscript,
    url,
  };
  if (event) {
    meta.event = event.name;
    if (event.location) meta.eventLocation = event.location;
  }
  if (talk.video) {
    meta.videoProvider = talk.video.provider;
    meta.videoId = talk.video.id;
  }
  if (tags) {
    meta.topics = tags.topics;
    meta.tech = tags.tech;
  }
  return meta;
}
