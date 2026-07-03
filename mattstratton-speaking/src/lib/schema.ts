import { socials, role } from '../data/bio';

export const AUTHOR_PERSON = {
  '@type': 'Person',
  name: 'Matty Stratton',
  url: 'https://mattstratton.com',
  jobTitle: role,
  sameAs: socials.map((s) => s.url),
};

export function buildBreadcrumb(items: Array<{ name: string; item: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}
