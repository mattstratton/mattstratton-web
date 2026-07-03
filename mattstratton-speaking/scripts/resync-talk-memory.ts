import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { talkUrl } from '../src/lib/talk-url';
import {
  buildTalkMemoryContent,
  buildTalkMemoryMeta,
  talkMemoryTree,
  talkYear,
  type TalkFrontmatter,
  type EventFrontmatter,
  type TalkTags,
} from './lib/memory-sync.ts';

async function readFrontmatter<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null;
  const text = await readFile(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  return parseYaml(m[1]) as T;
}

export interface TalkMemoryPayload {
  tree: string;
  name: string;
  content: string;
  meta: Record<string, unknown>;
}

export async function prepareTalkMemory(
  id: string,
  root: string,
): Promise<TalkMemoryPayload | { error: 'not-found' }> {
  const talk = await readFrontmatter<TalkFrontmatter>(resolve(root, 'src/content/talks', `${id}.md`));
  if (!talk) return { error: 'not-found' };

  const event = talk.event
    ? await readFrontmatter<EventFrontmatter>(resolve(root, 'src/content/events', `${talk.event}.md`))
    : null;

  const transcriptPath = resolve(root, 'public/transcripts', `${id}.txt`);
  const transcriptText = existsSync(transcriptPath) ? await readFile(transcriptPath, 'utf8') : null;

  const allTags = JSON.parse(
    await readFile(resolve(root, 'src/data/tags.json'), 'utf8'),
  ) as Record<string, TalkTags>;
  const tags = allTags[talk.notistSlug];

  const url = `https://speaking.mattstratton.com${talkUrl({
    id,
    data: { notistId: talk.notistId, notistSlug: talk.notistSlug, presentedOn: new Date(talk.presentedOn) },
  })}`;

  return {
    tree: talkMemoryTree(talkYear(talk.presentedOn)),
    name: id,
    content: buildTalkMemoryContent(talk, event, transcriptText),
    meta: buildTalkMemoryMeta(id, talk, event, url, transcriptText !== null, tags),
  };
}
