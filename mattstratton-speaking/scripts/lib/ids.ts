import { tagSlug } from '../../src/lib/tags';

/** URL-safe slug: "Cloud Native & Kubernetes" → "cloud-native-kubernetes". */
export const slugify = tagSlug;

/** Unique talk entry id: {year}-{slug}, suffixed -2/-3… against existing ids. */
export function uniqueTalkId(year: number, slug: string, existing: Set<string>): string {
  const base = `${year}-${slug}`;
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Friendly event id: "KubeCon EU" + 2026 → "kubecon-eu-2026". */
export function eventId(name: string, year: number): string {
  return `${slugify(name)}-${year}`;
}
