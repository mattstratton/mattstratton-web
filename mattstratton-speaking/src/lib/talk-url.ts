// Single source of truth for a talk *delivery* URL. Legacy Notist talks keep
// their /{notistId}/{slug}; new talks (no notistId) get /{year}/{slug}.
// Structural input type — no `astro:content` import, so it unit-tests in isolation.
export interface TalkLike {
  id: string;
  data: { notistId?: string; notistSlug: string; presentedOn: Date };
}

export function talkRouteParams(talk: TalkLike): { id: string; slug: string } {
  const { notistId, notistSlug, presentedOn } = talk.data;
  const id = notistId ? notistId.toLowerCase() : String(presentedOn.getFullYear());
  return { id, slug: notistSlug };
}

export function talkUrl(talk: TalkLike): string {
  const { id, slug } = talkRouteParams(talk);
  return `/${id}/${slug}`;
}
