---
title: 'How Do PostgreSQL Indices Work, Anyways?'
published: true
description: 'You''ve created hundreds of indexes but do you know what''s actually happening underneath? B-tree internals, page splits, MVCC bloat, and the diagnostic queries to see it all for yourself.'
tags: post
canonical_url: 'https://dev.to/tigerdata/how-do-postgresql-indices-work-anyways-3jnn'
id: 3364185
cover_image: 'https://dev-to-uploads.s3.amazonaws.com/uploads/articles/y4ohbx1ve78ttegal7iw.png'
date: '2026-03-18T14:35:21Z'
---
You've probably created a hundred indexes in your career. Maybe a thousand. You ran `EXPLAIN ANALYZE`, saw "Index Scan" instead of "Seq Scan," pumped your fist, and moved on.

But do you actually know what's happening underneath? Because once you do, a lot of things about PostgreSQL performance start to make a *lot* more sense. And some of the pain points you've been fighting start to feel less like mysteries and more like, well, physics.

## It's a tree. Obviously.

The default index type in PostgreSQL is a B-tree. You knew that. But let's talk about what that actually means for your data.

When you create an index on, say, a `timestamp` column, PostgreSQL builds a balanced tree structure where each node contains keys and pointers. The leaf nodes point to actual heap tuples (your rows on disk). The internal nodes just help you navigate. Think of it like a phone book. (Do people still know what phone books are? I'm aging myself.)

The key thing to understand: the index is a *separate data structure* from your table. It lives in its own pages on disk. When you insert a row, PostgreSQL doesn't just write your row. It also has to update every index on that table. Every. Single. One.

So if you have a table with five indexes and you're doing 50,000 inserts per second, that's not 50K write operations. That's 250K+ B-tree insertions per second, plus the heap write. Oof.

You can see exactly how much space each index is consuming with `\di+` in psql:

```sql
\di+ public.*

-- Or if you want programmatic access:
SELECT indexrelid::regclass AS index_name,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
       idx_scan AS times_used,
       idx_tup_read AS tuples_read
FROM   pg_stat_user_indexes
WHERE  schemaname = 'public'
ORDER  BY pg_relation_size(indexrelid) DESC;
```

Run that on your biggest table. If you see indexes measured in gigabytes that have `idx_scan = 0`, those indexes are costing you writes and giving you nothing back. They're dead weight.

## Pages, not rows

Here's where it gets interesting. PostgreSQL doesn't read individual rows from disk. It reads 8KB pages. Always. Even if you only want one tiny row, you're pulling in a full 8KB page.

Your B-tree is also organized into 8KB pages. Each page holds as many index entries as it can fit. For a simple index on a `bigint` column, you can fit a few hundred entries per page. For a compound index on `(tenant_id, event_type, created_at)`, you're fitting fewer because each entry is wider.

When PostgreSQL traverses your B-tree, it starts at the root page, reads it, follows a pointer to the right internal page, reads that, and eventually gets to a leaf page that tells it where your actual row lives on the heap. For a table with a million rows, that's maybe three or four page reads. For a billion rows, it might be five or six. Logarithmic scaling is your friend here.

You can see this in action with `EXPLAIN (ANALYZE, BUFFERS)`:

```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM events WHERE created_at > now() - interval '1 hour';

-- Look for lines like:
--   Index Scan using events_created_at_idx on events
--     Buffers: shared hit=4 read=2
```

The `shared hit` count tells you how many pages came from the buffer cache. The `read` count tells you how many had to come from disk. If you're seeing high `read` values on a query you run frequently, your working set has outgrown your `shared_buffers`.

But. (There's always a but.)

## The part nobody thinks about

Those leaf pages need to stay ordered. When you insert a new value that belongs in the middle of a page that's already full, PostgreSQL has to split that page. Page splits are expensive. They cause write amplification and can fragment your index over time.

For time-series data (timestamps always increasing), you mostly dodge this problem because new values go to the rightmost leaf. That's nice. But it creates a different problem: hot-page contention. Every concurrent insert is fighting to write to the same leaf page at the end of the tree.

And then there's the part that really gets you: MVCC overhead.

PostgreSQL's multiversion concurrency control means that even your index has to deal with tuple visibility. Index entries don't get removed immediately when a row is deleted or updated. They stick around until `VACUUM` cleans them up. So your index isn't just tracking live rows. It's tracking *all the versions* of your rows until the cleanup crew gets around to it.

For a high-churn table, your index can be significantly larger than you'd expect just from the row count. I've seen cases where the index is effectively 2-3x the "expected" size because of dead tuple bloat.

Here's how to check if bloat is eating your indexes alive:

```sql
SELECT relname,
       n_dead_tup,
       n_live_tup,
       round(n_dead_tup * 100.0 / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum
FROM   pg_stat_user_tables
WHERE  n_dead_tup > 10000
ORDER  BY n_dead_tup DESC;
```

If `dead_pct` is climbing above 10-20% and `last_autovacuum` was hours ago (or null), autovacuum is falling behind. That bloat isn't just wasting space. It's making every index scan touch more pages than it should.

## Index-only scans (and why they're worth understanding)

There's one more behavior worth knowing about, because it changes how you think about index design.

Normally, PostgreSQL uses the index to find *where* a row lives on the heap, then goes and reads the actual row. That's two separate lookups: the index, then the heap.

But if every column your query needs is already *in* the index, PostgreSQL can skip the heap entirely. That's an index-only scan, and it's significantly faster.

```sql
-- This index covers both the WHERE clause and the SELECT list:
CREATE INDEX idx_events_covering ON events (created_at) INCLUDE (event_type, value);

-- Now this query never touches the heap:
EXPLAIN (ANALYZE, BUFFERS)
SELECT event_type, value FROM events WHERE created_at > now() - interval '1 hour';

-- Look for:
--   Index Only Scan using idx_events_covering on events
--     Heap Fetches: 0
```

The `Heap Fetches: 0` is what you want. That means PostgreSQL answered the entire query from the index alone.

The catch: index-only scans only work well when the visibility map is up to date, which brings us right back to VACUUM. If VACUUM hasn't visited a page recently, PostgreSQL can't trust the index alone and has to check the heap anyway. So even this optimization depends on keeping autovacuum healthy.

## Partial indexes (less is more)

One more tool that's underused: partial indexes. If you only query a subset of your data most of the time, you can index just that subset.

```sql
-- Instead of indexing every row:
CREATE INDEX idx_events_status ON events (status);

-- Index only the rows that matter:
CREATE INDEX idx_events_active ON events (status) WHERE status = 'active';
```

The partial index is smaller, faster to scan, and cheaper to maintain on writes. For high-churn tables where most queries filter to a small slice of data, this is free performance.

## So why does this matter?

Understanding this stuff isn't just academic. It explains real problems you hit in production:

**Why adding indexes slows down writes.** Every index is another B-tree that needs to be maintained on every insert. It's not free. It's never been free. The cost just hides until you're at scale.

**Why your queries get slower over time even though nothing changed.** Index bloat from dead tuples. Pages that used to be tightly packed are now half-empty after splits and vacuuming. Your three-page-read query is now a six-page-read query.

**Why VACUUM matters so much.** It's not just reclaiming table space. It's keeping your indexes healthy. If autovacuum can't keep up, your indexes degrade. And if you're inserting fast enough, autovacuum can fall behind. That's not a bug. That's just the architecture working as designed.

**Why partitioning helps (and then stops helping).** Smaller partitions mean smaller indexes mean fewer tree levels. Great. But now your query planner has to evaluate all those partitions to figure out which ones to scan. And that planning cost scales linearly with partition count. You're trading one bottleneck for another.

## The bigger picture

I wrote about this cycle more extensively in a piece about [the PostgreSQL optimization treadmill](https://www.tigerdata.com/blog/postgres-optimization-treadmill?utm_source=devto&utm_medium=da-activity&utm_campaign=matty-digital). The short version: there's a pretty predictable progression that teams go through. Optimize indexes. Partition tables. Tune autovacuum. Scale vertically. Add read replicas. Each phase buys you a few months.

That's not a criticism of PostgreSQL. Postgres is an incredible database. But it's a *general-purpose* relational database, and its architecture reflects that. The heap storage model, MVCC, the query planner, B-trees. They're all designed to handle a wide range of workloads really well. The tradeoff is that for very specific access patterns (like time-series data at scale), those general-purpose design choices start working against you instead of for you.

Understanding *how* your indexes work is the first step to understanding *when* they stop being enough. And knowing when you're fighting the architecture instead of optimizing within it can save you months of whack-a-mole performance tuning.

But that's a topic for another day. For now, go run these queries on your biggest table:

```sql
-- How big are your indexes, really?
SELECT indexrelid::regclass AS index_name,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size,
       idx_scan AS scans
FROM   pg_stat_user_indexes
WHERE  relname = 'your_table_here'
ORDER  BY pg_relation_size(indexrelid) DESC;

-- Are any of them unused?
SELECT indexrelid::regclass AS index_name,
       idx_scan
FROM   pg_stat_user_indexes
WHERE  idx_scan = 0
  AND  schemaname = 'public'
ORDER  BY pg_relation_size(indexrelid) DESC;
```

You might be surprised.
