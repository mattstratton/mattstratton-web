/**
 * Authored speaker-kit content (NOT migrated from Notist). Edit this file to
 * update bios, headshots, and links. The long bio is seeded from the Notist
 * profile; the one-liner and short bio are placeholders — replace them.
 *
 * Headshots: drop image files in public/headshots/ and list them below. Each
 * is offered as an individual download on /bio.
 */
export const role = 'Head of Developer Advocacy & Docs, Tiger Data';
export const pronouns = 'he/him';

export const socials = [
  { label: 'Mastodon', url: 'https://hachyderm.io/@mattstratton', icon: 'simple-icons:mastodon' },
  { label: 'GitHub', url: 'https://github.com/mattstratton', icon: 'simple-icons:github' },
  { label: 'Arrested DevOps', url: 'https://www.arresteddevops.com/', icon: 'lucide:mic' },
  { label: 'mattstratton.com', url: 'https://mattstratton.com', icon: 'lucide:globe' },
];

export const bios = {
  oneLiner:
    'Matty Stratton is Head of Developer Advocacy & Docs at Tiger Data, a DevOps community organizer, and co-host of the Arrested DevOps podcast.',
  short:
    "Matty Stratton is the Head of Developer Advocacy & Docs at Tiger Data. A longtime DevOps community member, he's the co-host of Arrested DevOps and a global organizer of DevOpsDays, with over 20 years of experience in IT operations and speaking at engineering events worldwide.",
  // Seeded from the Notist profile — edit freely.
  longHtml: `<p>Matty Stratton is the Head of Developer Advocacy &amp; Docs at Tiger Data, where he leads content strategy, developer relations, and documentation for one of the fastest-growing Postgres platforms in the world. He's a passionate advocate for helping developers make better database decisions and get more out of Postgres and time-series data.</p>
<p>A longtime member of the DevOps community, Matty is the founder and co-host of the <a href="https://www.arresteddevops.com/" rel="noopener">Arrested DevOps</a> podcast and a global organizer of <a href="https://www.devopsdays.org/" rel="noopener">DevOpsDays</a>. He has over 20 years of experience in IT operations and has spoken at engineering-focused events worldwide. Demonstrating his keen insight into the changing landscape of technology, he still hasn't changed his license plate from <code>KUBECTL</code>.</p>
<p>He lives in the Chicagoland area with his wife, five kids, two Australian Shepherds, and a flock of chickens, all of whom he loves just a little bit more than he loves Diet Coke.</p>`,
};

/**
 * Headshots offered on /bio at multiple sizes (Notist-style "photos for
 * publication"). To add one: drop public/headshots/{name}.png, run
 * `npm run headshots`, then list { name, label } here. `name` must match the
 * source filename (sans extension); sizes come from src/data/headshots.json.
 */
export const headshots: { name: string; label: string }[] = [
  { name: 'purple-hair', label: 'Purple hair' },
  { name: 'formal', label: 'Formal' },
];
