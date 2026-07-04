// Refreshes src/data/liftosaur-cache.json — the fallback Liftosaur workout
// snapshot src/lib/liftosaur.ts's content-layer loader falls back to when the
// live API call fails during a Netlify build. Run daily by
// .github/workflows/fitness-rebuild.yml, before triggering the Netlify build
// hook, and committed straight to main if the snapshot changed.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fetchLiftosaurRecords } from '../src/lib/liftosaur.ts';

const key = process.env.LIFTOSAUR_API_KEY;
if (!key) {
  console.error('LIFTOSAUR_API_KEY not set — skipping cache refresh.');
  process.exit(1);
}

const records = await fetchLiftosaurRecords(key);
const cachePath = fileURLToPath(new URL('../src/data/liftosaur-cache.json', import.meta.url));
writeFileSync(cachePath, `${JSON.stringify({ fetchedAt: new Date().toISOString(), records }, null, 2)}\n`);
console.log(`Wrote ${records.length} workout(s) to ${cachePath}`);
