import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { talkUrl } from '../lib/talk-url';
import { hasTranscript } from '../lib/transcripts';

/**
 * Machine-readable site index for LLM crawlers (llmstxt.org spec).
 * Generated at build time from live content — do not add a static public/llms.txt.
 */
export const GET: APIRoute = async ({ site }) => {
  const talks = (await getCollection('talks')).sort(
    (a, b) => b.data.presentedOn.getTime() - a.data.presentedOn.getTime(),
  );

  const siteHref = site!.href.replace(/\/$/, '');
  const talksWithTranscripts = talks.filter((t) => hasTranscript(t.id));
  const talkCount = talks.length;
  const years = talks.map((t) => t.data.presentedOn.getFullYear());
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const lines: string[] = [
    '# Matty Stratton — Speaking Archive',
    '',
    `> A complete archive of conference talks by Matty Stratton, ${minYear}–${maxYear}. Covers DevOps, incident response, team culture, cloud infrastructure, and Postgres. ${talkCount} talks, ${talksWithTranscripts.length} with full transcripts.`,
    '',
    '## Key pages',
    '',
    `- [Home](${siteHref}/): Overview and featured talks`,
    `- [All Talks](${siteHref}/talks): Full archive, ${talkCount} talks organized by year`,
    `- [Videos](${siteHref}/videos): Recorded talks on YouTube and Vimeo`,
    `- [Speaker Bio & Kit](${siteHref}/bio): Bio, headshots, and links for event organizers`,
    `- [Talk Topics](${siteHref}/tags): Browse talks by topic`,
    `- [Full-text search corpus](${siteHref}/deep-index.json): Transcript and slide text for all talks (JSON)`,
    '',
    `## Talks with transcripts (${talksWithTranscripts.length})`,
    '',
  ];

  for (const t of talksWithTranscripts) {
    const url = new URL(talkUrl(t), site).href;
    const plainText = t.data.abstractHtml?.replace(/<[^>]+>/g, '') ?? '';
    const firstSentence = plainText.match(/^[^.!?]+[.!?]/)?.[0]?.trim() ?? plainText.slice(0, 120);
    const transcriptUrl = `${siteHref}/transcripts/${t.id}.txt`;
    lines.push(
      `- [${t.data.title}](${url})${firstSentence ? `: ${firstSentence}` : ''} Transcript: ${transcriptUrl}`,
    );
  }

  lines.push('', `## All talks (${talkCount})`, '');

  for (const t of talks) {
    const url = new URL(talkUrl(t), site).href;
    const year = t.data.presentedOn.getFullYear();
    lines.push(`- [${t.data.title}](${url}) (${year})`);
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
