// External entries for the Postgres field guide at /writing. These point at
// posts published on tigerdata.com (the "founding content" of the collection,
// per matty-writing-plan.md). Native posts authored on this site (the `writing`
// collection) slot into the same 4-part arc alongside these.
//
// URLs/descriptions sourced from Tiger Den (the marketing content index), so
// they're real, not guessed. Add newer posts here as the guide grows.

export type PartKey = 'mechanics' | 'limits' | 'traps' | 'decision';

export interface FieldGuideLink {
  title: string;
  description: string;
  part: PartKey;
  url: string;
}

export const externalFieldGuide: FieldGuideLink[] = [
  // Part 1 — What's happening inside Postgres
  {
    title: 'MVCC: The Feature You’re Paying For But Not Using',
    description:
      'MVCC is great for concurrent workloads. For append-only data, it’s 23 bytes of overhead per row that never gets used. Here’s what that actually costs.',
    part: 'mechanics',
    url: 'https://www.tigerdata.com/blog/mvcc-feature-youre-paying-for-but-not-using',
  },
  {
    title: 'Write Amplification in Postgres: The 3-4x Tax on Every Insert',
    description:
      'Every 1 KB insert in Postgres becomes ~2.5 KB of committed I/O before it’s done. Here’s where the multiplier comes from, and where the tuning knobs run out.',
    part: 'mechanics',
    url: 'https://www.tigerdata.com/blog/write-amplification-in-postgres-the-3-4x-tax-on-every-insert',
  },
  {
    title: 'When Continuous Ingestion Breaks Traditional Postgres',
    description:
      'Postgres maintenance depends on quiet periods your continuous workload eliminated. Here’s what happens inside the database when the gaps disappear.',
    part: 'mechanics',
    url: 'https://www.tigerdata.com/blog/when-continuous-ingestion-breaks-traditional-postgres',
  },

  // Part 2 — Why you're hitting the wall
  {
    title: 'Understanding Postgres Performance Limits for Analytics on Live Data',
    description:
      'PostgreSQL hits hard limits under analytics workloads. Here’s why MVCC, WAL, and row storage compound, and what to do instead.',
    part: 'limits',
    url: 'https://www.tigerdata.com/blog/postgres-optimization-treadmill',
  },
  {
    title: 'Six Signs That Postgres Tuning Won’t Fix Your Performance Problems',
    description:
      'When Postgres tuning won’t fix performance: recognize the six characteristics of time-series workloads that need a purpose-built architecture.',
    part: 'limits',
    url: 'https://www.tigerdata.com/blog/six-signs-postgres-tuning-wont-fix-performance-problems',
  },
  {
    title: 'Postgres Performance: Why Peak Throughput Benchmarks Miss the Real Problem',
    description:
      'Peak throughput tells you what Postgres can do in a sprint. Production asks what it can do forever. Those are different questions.',
    part: 'limits',
    url: 'https://www.tigerdata.com/blog/postgres-performance-why-peak-throughput-benchmarks-miss-real-problem',
  },
  {
    title: 'Vertical Scaling: Buying Time You Can’t Afford',
    description:
      'Postgres vertical scaling works, until it doesn’t. Why high-frequency ingestion workloads hit an architectural wall, and what to do about it.',
    part: 'limits',
    url: 'https://www.tigerdata.com/blog/vertical-scaling-buying-time-you-cant-afford',
  },

  // Part 3 — The traps
  {
    title: 'Why Adding More Indexes Eventually Makes Things Worse',
    description:
      'Every Postgres index is a flat tax on every insert. At high ingestion rates, that tax is the whole problem.',
    part: 'traps',
    url: 'https://www.tigerdata.com/blog/why-adding-more-indexes-eventually-makes-things-worse',
  },
  {
    title: 'The Hidden Costs of Table Partitioning at Scale',
    description:
      'Table partitioning fixes retention and pruning, but adds hidden costs in planning time, schema migrations, and ops overhead. Know the tradeoffs before you commit.',
    part: 'traps',
    url: 'https://www.tigerdata.com/blog/hidden-costs-table-partitioning-scale',
  },
  {
    title: 'Read Replicas Don’t Solve Write Bottlenecks',
    description:
      'Read replicas fix read contention. They don’t fix write throughput. Here’s the mechanical reason why, and what actually changes the trajectory.',
    part: 'traps',
    url: 'https://www.tigerdata.com/blog/read-replicas-dont-solve-write-bottlenecks',
  },

  // Part 4 — The decision
  {
    title: 'Optimization vs. Architecture: Knowing the Difference',
    description:
      'Optimization problems stay fixed. Architectural ones come back. A framework for knowing which you’re dealing with before you’ve spent months on the wrong fix.',
    part: 'decision',
    url: 'https://www.tigerdata.com/blog/optimization-vs-architecture-knowing-the-difference',
  },
  {
    title: 'The Best Time to Migrate Was at 10M Rows. The Second Best Time Is Now.',
    description:
      'Migration cost scales with data volume. The optimization tax you pay while waiting scales faster.',
    part: 'decision',
    url: 'https://www.tigerdata.com/blog/when-to-migrate-postgres-to-timescaledb',
  },
  {
    title: 'Document Databases: Be Honest',
    description:
      'Most MongoDB pain isn’t a MongoDB problem. It’s a workload shape problem that would follow you to Postgres.',
    part: 'decision',
    url: 'https://www.tigerdata.com/blog/document-databases-be-honest',
  },
  {
    title: 'ClickHouse Is Fast. Your Pipeline Isn’t.',
    description:
      'ClickHouse is fast. But the pipeline tax, ACID trade-offs, and two-system overhead are part of the decision too. Here’s the full picture.',
    part: 'decision',
    url: 'https://www.tigerdata.com/blog/clickhouse-is-fast-your-pipeline-isnt',
  },
];
