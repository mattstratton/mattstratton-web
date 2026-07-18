import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Loader } from 'astro/loaders';
import type { CollectionEntry } from 'astro:content';

export interface WorkoutSet {
  reps: number;
  weight: number;
  unit: 'lb' | 'kg';
}

export interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
  targetSets: WorkoutSet[];
}

export interface ParsedWorkout {
  id: string;
  date: string;
  program: string;
  dayName: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
}

// The four lifts that matter most, shown on the /fitness landing page. Exact
// string matches against Liftosaur exercise names — no fuzzy matching.
export const MAIN_LIFTS = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];

// Maps `workouts` content-collection entries to ParsedWorkout (Date -> ISO
// string) and sorts newest first. Every /fitness page uses this instead of
// duplicating the mapping/sort inline.
export function sortedWorkouts(entries: CollectionEntry<'workouts'>[]): ParsedWorkout[] {
  return entries
    .map((e) => ({ id: e.id, ...e.data, date: e.data.date.toISOString() }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Groups workouts by calendar year (descending), each year's workouts newest
// first — the /fitness/workouts/ archive page renders one section per year,
// mirroring the pattern used by the /post/ archive.
export function groupWorkoutsByYear(workouts: ParsedWorkout[]): [number, ParsedWorkout[]][] {
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const years = new Map<number, ParsedWorkout[]>();
  for (const w of sorted) {
    const year = Number(
      new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'America/Chicago' }).format(new Date(w.date)),
    );
    if (!years.has(year)) years.set(year, []);
    years.get(year)!.push(w);
  }
  return [...years.entries()].sort((a, b) => b[0] - a[0]);
}

// True when this workout is the one where `exerciseName`'s current PR was
// first set (computePersonalRecords already keeps the earliest date on ties).
export function exerciseIsPR(workout: ParsedWorkout, exerciseName: string, records: PersonalRecord[]): boolean {
  const record = records.find((r) => r.exercise === exerciseName);
  return record != null && record.date === workout.date;
}

// True when any exercise logged in this workout was a PR that day.
export function workoutHasPR(workout: ParsedWorkout, records: PersonalRecord[]): boolean {
  return workout.exercises.some((ex) => exerciseIsPR(workout, ex.name, records));
}

// Workouts that logged the given exercise at all, in the input's existing order.
export function workoutsForExercise(workouts: ParsedWorkout[], exerciseName: string): ParsedWorkout[] {
  return workouts.filter((w) => w.exercises.some((ex) => ex.name === exerciseName));
}

export type SetStatus = 'failed' | 'partial' | 'met';

// Compares a completed set to its planned target: 'failed' when zero reps
// were done, 'partial' when some reps were done but short of target, 'met'
// otherwise (hits, exceeds, or AMRAP-overachieves — also the default when
// there's no target to compare against, since nothing was missed).
export function setStatus(actual: WorkoutSet, target: WorkoutSet | undefined): SetStatus {
  if (actual.reps === 0) return 'failed';
  if (target && actual.reps < target.reps) return 'partial';
  return 'met';
}

// Total volume (reps × weight, summed across completed sets) for one exercise.
export function exerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
}

// Epley formula estimated one-rep max for a single set, rounded to the
// nearest whole unit for display.
export function computeEst1RM(set: WorkoutSet): number {
  return Math.round(set.weight * (1 + set.reps / 30));
}

// Estimated 1RM per workout for a given exercise — the highest-estimating
// set that day, which isn't always the same set as the top raw weight (a
// higher-rep set at slightly lower weight can estimate a higher 1RM).
// Sorted oldest to newest, same shape/ordering as computeTrend.
export function computeEst1RMTrend(workouts: ParsedWorkout[], exerciseName: string): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (const workout of workouts) {
    const exercise = workout.exercises.find((e) => e.name === exerciseName);
    if (!exercise || exercise.sets.length === 0) continue;
    const best = Math.max(...exercise.sets.map(computeEst1RM));
    points.push({ date: workout.date, weight: best });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

// Liftosaur's /history API returns each workout as a compact Liftoscript-style
// text blob rather than structured JSON, e.g.:
//   2026-06-30 23:54:55 +00:00 / program: "GZCLP" / dayName: "Day 1" / week: 1 /
//   dayInWeek: 1 / duration: 3240s / exercises: {
//     Squat / 2x5 147.5lb, 1x6 147.5lb / warmup: 1x5 72.5lb / target: 2x5 147.5lb, 1x5+ 147.5lb
//   }
// Each exercise line's first (unlabeled) segment is the actually-completed
// sets; "warmup:" and "target:" segments are planned/warmup data we don't
// track for history/PRs/trends, so they're parsed out and discarded.
const SET_GROUP_RE = /(\d+)x(\d+)\+?\s+([\d.]+)(lb|kg)/g;

function parseSets(segment: string): WorkoutSet[] {
  const sets: WorkoutSet[] = [];
  for (const match of segment.matchAll(SET_GROUP_RE)) {
    const [, count, reps, weight, unit] = match;
    for (let i = 0; i < Number(count); i++) {
      sets.push({ reps: Number(reps), weight: Number(weight), unit: unit as 'lb' | 'kg' });
    }
  }
  return sets;
}

function parseExerciseLine(line: string): WorkoutExercise {
  const segments = line.trim().split(' / ');
  const name = segments[0];
  const completedSegment = segments.find((s) => !s.startsWith('warmup:') && !s.startsWith('target:') && s !== name);
  const targetSegment = segments.find((s) => s.startsWith('target:'));
  return {
    name,
    sets: completedSegment ? parseSets(completedSegment) : [],
    targetSets: targetSegment ? parseSets(targetSegment) : [],
  };
}

export function parseWorkoutText(id: number, text: string): ParsedWorkout {
  const dateMatch = text.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) ([+-]\d{2}:\d{2})/);
  const programMatch = text.match(/program: "([^"]*)"/);
  const dayNameMatch = text.match(/dayName: "([^"]*)"/);
  const durationMatch = text.match(/duration: (\d+)s/);
  const exercisesMatch = text.match(/exercises: \{\n([\s\S]*)\n\}/);

  const date = dateMatch ? new Date(`${dateMatch[1].replace(' ', 'T')}${dateMatch[2]}`).toISOString() : '';
  const exerciseLines = exercisesMatch ? exercisesMatch[1].split('\n').filter((l) => l.trim()) : [];

  return {
    id: String(id),
    date,
    program: programMatch?.[1] ?? '',
    dayName: dayNameMatch?.[1] ?? '',
    durationSeconds: durationMatch ? Number(durationMatch[1]) : 0,
    exercises: exerciseLines.map(parseExerciseLine),
  };
}

export interface PersonalRecord {
  exercise: string;
  weight: number;
  unit: 'lb' | 'kg';
  reps: number;
  date: string;
}

// One row per exercise, in first-seen order. Ties on weight keep the earliest
// date (the PR is when it was first hit, not when it was last repeated).
export function computePersonalRecords(workouts: ParsedWorkout[]): PersonalRecord[] {
  const byExercise = new Map<string, PersonalRecord>();
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  for (const workout of sorted) {
    for (const exercise of workout.exercises) {
      const best = exercise.sets.reduce<WorkoutSet | null>(
        (max, set) => (!max || set.weight > max.weight ? set : max),
        null,
      );
      if (!best) continue;

      const existing = byExercise.get(exercise.name);
      if (!existing || best.weight > existing.weight) {
        byExercise.set(exercise.name, {
          exercise: exercise.name,
          weight: best.weight,
          unit: best.unit,
          reps: best.reps,
          date: workout.date,
        });
      }
    }
  }

  return [...byExercise.values()];
}

export interface TrendPoint {
  date: string;
  weight: number;
}

// Top weight lifted per workout for a given exercise, sorted oldest to newest.
export function computeTrend(workouts: ParsedWorkout[], exerciseName: string): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (const workout of workouts) {
    const exercise = workout.exercises.find((e) => e.name === exerciseName);
    if (!exercise || exercise.sets.length === 0) continue;
    const topWeight = Math.max(...exercise.sets.map((s) => s.weight));
    points.push({ date: workout.date, weight: topWeight });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

// SVG polyline `points` attribute for a trend series, mapping index to x and
// weight to y (inverted, since SVG y grows downward) within a width x height box.
export function sparklinePoints(trend: TrendPoint[], width: number, height: number): string {
  if (trend.length === 0) return '';
  if (trend.length === 1) return `0,${height / 2}`;

  const weights = trend.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min;

  return trend
    .map((point, i) => {
      const x = (i / (trend.length - 1)) * width;
      const y = range === 0 ? height / 2 : height - ((point.weight - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

export interface DualSparkline {
  a: string;
  b: string;
  min: number;
  max: number;
}

// Like sparklinePoints, but scales two series to one shared min/max so they
// can be plotted on the same axes and compared directly. Assumes both series
// share the same length/x-positions (true for computeTrend/computeEst1RMTrend
// run against the same workouts for the same exercise).
export function dualSparklinePoints(
  seriesA: TrendPoint[],
  seriesB: TrendPoint[],
  width: number,
  height: number,
): DualSparkline {
  const values = [...seriesA, ...seriesB].map((p) => p.weight);
  if (values.length === 0) return { a: '', b: '', min: 0, max: 0 };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const toPoints = (series: TrendPoint[]) => {
    if (series.length === 0) return '';
    if (series.length === 1) return `0,${height / 2}`;
    return series
      .map((point, i) => {
        const x = (i / (series.length - 1)) * width;
        const y = range === 0 ? height / 2 : height - ((point.weight - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return { a: toPoints(seriesA), b: toPoints(seriesB), min, max };
}

// import.meta.env is only populated under Vite/Astro — guard with optional
// chaining so this module also loads cleanly under the plain `node --test` runner.
const API_BASE =
  import.meta.env?.LIFTOSAUR_API_BASE ?? process.env.LIFTOSAUR_API_BASE ?? 'https://www.liftosaur.com/api/v1';

// Hard cap on pagination pages fetched per build — a backstop against an
// unbounded loop if the API's cursor/hasMore contract ever breaks, not a real
// limit on workout history size (100/page * 200 = 20k workouts).
const MAX_PAGES = 200;

export interface LiftosaurHistoryRecord {
  id: number;
  text: string;
}

interface LiftosaurHistoryResponse {
  data?: {
    records?: LiftosaurHistoryRecord[];
    hasMore?: boolean;
    nextCursor?: number;
  };
}

// Fetches the full paginated Liftosaur workout history for the given API
// key. Throws on a non-OK response or network error — callers decide how to
// handle failure (the build-time loader falls back to a cached snapshot;
// scripts/update-liftosaur-cache.ts lets the error abort the refresh).
export async function fetchLiftosaurRecords(key: string): Promise<LiftosaurHistoryRecord[]> {
  const records: LiftosaurHistoryRecord[] = [];
  let cursor: number | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${API_BASE}/history`);
    url.searchParams.set('limit', '100');
    if (cursor != null) url.searchParams.set('cursor', String(cursor));

    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) {
      throw new Error(`Liftosaur API ${res.status} ${res.statusText}`);
    }

    const body = (await res.json()) as LiftosaurHistoryResponse;
    records.push(...(body.data?.records ?? []));
    if (!body.data?.hasMore || body.data.nextCursor == null) break;
    cursor = body.data.nextCursor;
  }
  return records;
}

export interface LiftosaurCache {
  fetchedAt: string;
  records: LiftosaurHistoryRecord[];
}

const CACHE_PATH = fileURLToPath(new URL('../data/liftosaur-cache.json', import.meta.url));

// Committed fallback snapshot (src/data/liftosaur-cache.json), refreshed by
// scripts/update-liftosaur-cache.ts on the same daily cron that triggers the
// Netlify rebuild (.github/workflows/fitness-rebuild.yml). Netlify builds
// from a fresh checkout every time — there's no in-process "previous build"
// to fall back on — so a transient Liftosaur API outage during a build reads
// this file instead of wiping the page to empty.
function readLiftosaurCache(): LiftosaurCache | null {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as LiftosaurCache;
  } catch {
    return null;
  }
}

export interface LiftosaurFetchInfo {
  fetchedAt: string;
  source: 'live' | 'cache';
}

const FETCH_INFO_PATH = fileURLToPath(new URL('../../.liftosaur-meta.json', import.meta.url));

// Written by liftosaurLoader() during the content-layer sync and read by the
// /fitness page (after `getCollection('workouts')`) to render a "data as of"
// note. A file round-trip rather than a shared module export, because the
// loader and the page run in separate Vite SSR module graphs during
// `astro build` — a mutable export set by one isn't visible in the other.
export function readLiftosaurFetchInfo(): LiftosaurFetchInfo | null {
  try {
    return JSON.parse(readFileSync(FETCH_INFO_PATH, 'utf-8')) as LiftosaurFetchInfo;
  } catch {
    return null;
  }
}

// Astro content-layer loader for the fitness page. At build time it pulls
// workout history from the Liftosaur REST API and exposes it as a `workouts`
// collection. The API key is read from the environment (LIFTOSAUR_API_KEY,
// set as a Netlify env var + a local .env) — never committed. If the key is
// missing or the live fetch fails, it falls back to the committed cache
// snapshot; only if that's also unavailable does the page build empty (same
// last-resort convention as src/lib/buttondown.ts).
export function liftosaurLoader(): Loader {
  return {
    name: 'liftosaur',
    load: async ({ store, logger, parseData }) => {
      const key = import.meta.env?.LIFTOSAUR_API_KEY ?? process.env.LIFTOSAUR_API_KEY;

      let records: LiftosaurHistoryRecord[] = [];
      let fetchInfo: LiftosaurFetchInfo | null = null;

      if (!key) {
        logger.warn('LIFTOSAUR_API_KEY not set — falling back to cached workout data, if any.');
      } else {
        try {
          records = await fetchLiftosaurRecords(key);
          fetchInfo = { fetchedAt: new Date().toISOString(), source: 'live' };
        } catch (err) {
          logger.error(`Liftosaur fetch failed (${String(err)}) — falling back to cached workout data, if any.`);
        }
      }

      if (!fetchInfo) {
        const cache = readLiftosaurCache();
        if (cache) {
          records = cache.records;
          fetchInfo = { fetchedAt: cache.fetchedAt, source: 'cache' };
        }
      }

      if (!fetchInfo) {
        logger.warn('No live data and no cache available — fitness page will build empty.');
        try {
          writeFileSync(FETCH_INFO_PATH, 'null');
        } catch {
          // Best-effort — the page treats a missing/invalid file as "no info".
        }
        return;
      }

      store.clear();
      let count = 0;
      for (const record of records) {
        try {
          const parsed = parseWorkoutText(record.id, record.text);
          const data = await parseData({
            id: parsed.id,
            data: {
              date: parsed.date,
              program: parsed.program,
              dayName: parsed.dayName,
              durationSeconds: parsed.durationSeconds,
              exercises: parsed.exercises,
            },
          });
          store.set({ id: parsed.id, data });
          count++;
        } catch (err) {
          logger.warn(`Skipped Liftosaur workout ${record.id} (${String(err)}).`);
        }
      }
      try {
        writeFileSync(FETCH_INFO_PATH, JSON.stringify(fetchInfo));
      } catch {
        // Best-effort — the page treats a missing/invalid file as "no info".
      }
      logger.info(`Loaded ${count} workout(s) from Liftosaur (source: ${fetchInfo.source}).`);
    },
  };
}
