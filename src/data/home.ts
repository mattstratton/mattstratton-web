// Typed homepage content, ported from the old Hugo config.yml `params`.
// Mirrors the speaking site's src/data/bio.ts pattern: authored, singleton,
// structured content lives in a typed module, not a content collection.
//
// Prose below is written to match Matty's Tiger Den voice profile: conversational,
// second person, dry, no em-dashes, no marketing speak. Worth a final read-through
// before launch, but it's no longer placeholder text.

export interface SocialLink {
  label: string;
  url: string;
}

export interface ExperienceItem {
  job: string;
  company: string;
  companyUrl?: string;
  date: string;
  bullets?: string[];
  summary?: string;
}

export interface LinkCard {
  title: string;
  source: string;
  url: string;
  image?: string;
}

export const siteMeta = {
  description:
    'Matty Stratton writes about Postgres internals, performance tradeoffs, and database architecture, backed by 20+ years of running infrastructure.',
};

export const hero = {
  intro: 'Hi, my name is',
  name: 'Matty.',
  subtitle: 'I write about Postgres internals and the performance tradeoffs you usually learn the hard way.',
  content:
    'I run Developer Relations at Tiger Data. I write about what’s actually happening inside Postgres: MVCC, write amplification, and the walls you hit when you run analytics on live data. The credibility comes from twenty-plus years of operating infrastructure (sysadmin, SRE, DevOps), not from a marketing deck. I’m also learning physical AI and robotics in public, which is going about as well as you’d expect.',
  image: '/img/goto.jpg',
  resume: { name: 'Resume', url: '/Matty-Stratton-CV-2025.pdf' },
  socialLinks: [
    { label: 'GitHub', url: 'https://github.com/mattstratton' },
    { label: 'Twitter', url: 'https://twitter.com/mattstratton' },
  ] satisfies SocialLink[],
};

export const about = {
  title: 'About Me',
  image: '/img/matty-shades-500-sq.png',
  content:
    'I run Developer Relations at Tiger Data, where most of my writing time goes to Postgres: what it’s doing under the hood, why you hit performance walls, and how to tell a tuning problem from an architecture problem. That perspective comes from a couple of decades of actually operating the stuff. I started as a sysadmin, did the SRE and DevOps thing, and ran technology operations back before any of those were résumé words. That history is the whole point. It’s a lot easier to write honestly about database tradeoffs when you’ve been the person paged at 3am because of one. I’m also a longtime conference speaker, co-host of the Arrested DevOps podcast, and currently learning physical AI and robotics in public.',
  skills: [
    'PostgreSQL',
    'Time-Series Databases',
    'Kubernetes',
    'DevOps',
    'Developer Relations',
    'Infrastructure as Code',
    'Physical AI / Robotics (learning in public)',
  ],
};

export const experience: ExperienceItem[] = [
  {
    job: 'Head of Developer Relations',
    company: 'Tiger Data',
    companyUrl: 'https://www.tigerdata.com',
    date: '2024 - Present',
    bullets: [
      'Lead developer relations, helping engineers reason about Postgres and time-series performance at scale.',
      'Write about Postgres internals, performance tradeoffs, and when to reach for purpose-built data infrastructure.',
    ],
  },
  {
    job: 'Director, Developer Relations and Growth',
    company: 'Aiven',
    companyUrl: 'https://aiven.io',
    date: '2022 - 2024',
    bullets: [
      'Led global team of developer advocates, educators, community program managers, and growth specialists.',
      'Launched online developer workshops program to drive user account signup.',
      'Implemented comprehensive metrics program, including trackable CTAs and DevRel Qualified Leads to measure impact on both user growth and account influence.',
      'Collaborated with GTM and sales teams to expand usage of Aiven within existing accounts.',
      'Built PLG-focused motion on direct adoption of the Aiven platform, including self-service accounts and Product Qualified Leads handed off to sales.',
      'Responsible for Self-Service Revenue targets for Direct Adoption.',
    ],
  },
  {
    job: 'Staff Developer Advocate',
    company: 'Pulumi',
    companyUrl: 'https://www.pulumi.com/',
    date: '2021 - 2022',
    bullets: [
      'Keynote speaker at industry and community conferences on DevOps, Infrastructure as Code, and Cloud Engineering principles.',
      'Created and launched the “Puluminaries” community champion program to recognize and build advocates in the Pulumi user community.',
      'Engaged cross-functionally with Marketing to align community needs/voice with product marketing messaging and initiatives.',
      'Developed a community measurement program to correlate developer advocate actions to community growth, using the Orbit Model.',
      'Defined the concepts and pillars of the Cloud Engineering approach for Pulumi users and the larger industry community.',
    ],
  },
  {
    job: 'Transformation Specialist, NAPS Transformation Office',
    company: 'Red Hat',
    companyUrl: 'https://www.redhat.com/',
    date: '2020 - 2021',
    bullets: [
      "Built strategic relationships with executives and key leaders to promote Red Hat's portfolio of emerging tech products (cloud, OpenShift/Kubernetes, app dev, business process management, data federation, and more).",
      'Engaged as a trusted advisor with senior technology leadership in State/Local public sector agencies around cultural transformation.',
      'Created the “Five Elements Assessment” pre-sales tool to drive close of transformational services engagements.',
      'Represented the Public Sector Transformation Office at government-focused conferences and panels.',
    ],
  },
  {
    job: 'Senior Developer Advocate',
    company: 'PagerDuty',
    companyUrl: 'https://pagerduty.com',
    date: '2017 - 2020',
    bullets: [
      'Spoke at industry events worldwide on DevOps, HumanOps, and more to share PagerDuty’s values and principles with the larger community.',
      'Authored open-sourced Ops Guides on Incident Response, Operational Reviews, and more.',
      'Focused on results-oriented metrics and measurement of the Community and Advocacy team’s effectiveness.',
      'Met with senior IT leadership at customers and prospects to share good practices around digital transformation and DevOps.',
      'Created and ran the PagerDuty “Breakathon” event, including infrastructure, content, and event management.',
      'Mentored other Community team members on speaking, industry practices, and content creation.',
      'Worked closely with Product, Marketing, and Sales to provide a voice of the community.',
    ],
  },
  {
    job: 'Senior Solutions Architect',
    company: 'Chef',
    companyUrl: 'https://chef.io',
    date: '2014 - 2017',
  },
  {
    job: 'Managing Consultant',
    company: '10th Magnitude',
    date: '2013 - 2014',
    summary:
      'Led the 10th Magnitude practice for Infrastructure as a Service (IaaS), Infrastructure Automation, and DevOps consulting engagements, helping clients streamline delivery, eliminate waste, and increase velocity.',
  },
  {
    job: 'Director, Technology Operations',
    company: 'Apartments.com',
    date: '2007 - 2013',
  },
];

export const publications = {
  title: 'Publications',
  content: 'A selection of some of my published work.',
  items: [
    {
      title: 'Understanding Postgres Performance Limits for Analytics on Live Data',
      source: 'tigerdata.com',
      url: 'https://www.tigerdata.com/blog/postgres-optimization-treadmill',
    },
    {
      title: 'Why Adding More Indexes Eventually Makes Things Worse',
      source: 'tigerdata.com',
      url: 'https://www.tigerdata.com/blog/why-adding-more-indexes-eventually-makes-things-worse',
    },
    {
      title: 'The Hidden Costs of Table Partitioning at Scale',
      source: 'tigerdata.com',
      url: 'https://www.tigerdata.com/blog/hidden-costs-table-partitioning-scale',
    },
    {
      title: 'Write Amplification in Postgres: The 3-4x Tax on Every Insert',
      source: 'tigerdata.com',
      url: 'https://www.tigerdata.com/blog/write-amplification-in-postgres-the-3-4x-tax-on-every-insert',
    },
    {
      title: 'ClickHouse Is Fast. Your Pipeline Isn’t.',
      source: 'tigerdata.com',
      url: 'https://www.tigerdata.com/blog/clickhouse-is-fast-your-pipeline-isnt',
    },
  ] satisfies LinkCard[],
};

export const speaking = {
  title: 'Public speaking',
  // Rendered with a markdown link in the component.
  content:
    'A few of my favorite talks. The full list lives at [speaking.mattstratton.com](https://speaking.mattstratton.com).',
  items: [
    {
      title: 'Zero Trust is for Networks, Not Your Teams',
      source: 'GOTO Chicago 2023',
      url: 'https://speaking.mattstratton.com/tMd2Ny/zero-trust-is-for-networks-not-your-teams',
      image: '/img/speaking/goto-chicago-2023.jpg',
    },
    {
      title: 'Where Do We Go From Here? The Next Level of DevRel Value',
      source: 'DevRelCon Prague 2022',
      url: 'https://speaking.mattstratton.com/c7HCQ7/where-do-we-go-from-here-the-next-level-of-devrel-value',
      image: '/img/speaking/devrelcon-2022.jpg',
    },
    {
      title: 'Charting Your Own Course Through the Cloud Native Landscape',
      source: 'KubeCon Europe 2022',
      url: 'https://speaking.mattstratton.com/ajYcGf/charting-your-own-course-through-the-cloud-native-landscape',
      image: '/img/speaking/kubecon-2022.png',
    },
    {
      title: 'Avengers Assemble - The Thanos Incident',
      source: 'All Things Open 2019',
      url: 'https://speaking.mattstratton.com/6SPcBa/avengers-assemble-the-thanos-incident',
      image: '/img/speaking/ato-2019.png',
    },
    {
      title: 'Fight, Flight, or Freeze: Releasing Organizational Trauma',
      source: 'Monitorama 2019',
      url: 'https://speaking.mattstratton.com/kF4x1U/fight-flight-or-freeze-releasing-organizational-trauma',
      image: '/img/speaking/monitorama-2019.png',
    },
  ] satisfies LinkCard[],
};

export const newsletter = {
  title: 'Stay in the Loop',
  content:
    'New posts on Postgres internals and performance, delivered when something worth reading ships.',
  // Public Buttondown username (not a secret) — drives the embed signup form.
  buttondownUser: 'mattstratton' as string | null,
};

export const contact = {
  content:
    'My inbox is always open. Whether you have a question or just want to say hi, I’ll try my best to get back to you!',
  formspreeId: 'mzzbbdqj',
};

export const footerSocials: SocialLink[] = [
  { label: 'GitHub', url: 'https://github.com/mattstratton' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mattstratton/' },
  { label: 'Twitter', url: 'https://twitter.com/mattstratton' },
  { label: 'Instagram', url: 'https://instagram.com/mattstratton' },
];
