---
title: "Example: MVCC, the feature you're paying for but not using"
description: "A placeholder post demonstrating the writing layout, prose styling, and field-guide grouping. Replace or delete me before launch."
pubDate: 2026-06-29
part: mechanics
topics:
  - Postgres
  - MVCC
draft: false
# canonicalUrl: https://www.tigerdata.com/blog/...   # set when cross-posted
---

> **This is a sample post.** It exists so the `/writing` index and the article
> layout render during the migration. Replace it with real content (or delete it)
> before launch.

Postgres uses **multi-version concurrency control** so readers never block writers
and writers never block readers. Every update writes a new row version and leaves
the old one behind until `VACUUM` cleans it up. That's the feature — and the bill.

## Why it matters

When you understand what the database is actually doing on every write, the
performance walls later in this guide stop being mysterious.

- Old row versions accumulate until vacuumed.
- Indexes point at every version, not just the live one.
- High-churn tables pay for this on every single insert and update.

```sql
-- Inspect dead tuples piling up on a hot table
SELECT relname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 5;
```

That's the shape of a real entry: a clear claim, the mechanism, and something you
can run yourself.
