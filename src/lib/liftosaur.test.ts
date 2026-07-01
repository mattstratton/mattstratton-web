import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseWorkoutText,
  computePersonalRecords,
  computeTrend,
  sparklinePoints,
  sortedWorkouts,
  groupWorkoutsByYear,
  exerciseIsPR,
  workoutHasPR,
  workoutsForExercise,
  setStatus,
  MAIN_LIFTS,
  type ParsedWorkout,
} from './liftosaur.ts';

const SAMPLE =
  '2026-06-30 23:54:55 +00:00 / program: "GZCLP: Blacknoir version" / dayName: "Day 1" / week: 1 / dayInWeek: 1 / duration: 3240s / exercises: {\n' +
  '  Squat / 2x5 147.5lb, 1x6 147.5lb / warmup: 1x5 72.5lb, 1x5 117.5lb / target: 2x5 147.5lb, 1x5+ 147.5lb\n' +
  '  Bench Press / 4x8 85lb / warmup: 1x5 67.5lb / target: 4x8 85lb\n' +
  '  Lat Pulldown / 3x12 73.75lb, 1x20 73.75lb / target: 3x12 73.75lb 90s, 1x12+ 73.75lb 90s\n' +
  '}';

test('parseWorkoutText reads date, program, dayName, and duration', () => {
  const w = parseWorkoutText(1782863695156, SAMPLE);
  assert.equal(w.id, '1782863695156');
  assert.equal(w.date, '2026-06-30T23:54:55.000Z');
  assert.equal(w.program, 'GZCLP: Blacknoir version');
  assert.equal(w.dayName, 'Day 1');
  assert.equal(w.durationSeconds, 3240);
});

test('parseWorkoutText extracts exercise names in order', () => {
  const w = parseWorkoutText(1, SAMPLE);
  assert.deepEqual(
    w.exercises.map((e) => e.name),
    ['Squat', 'Bench Press', 'Lat Pulldown'],
  );
});

test('parseWorkoutText parses completed sets, ignoring warmup and target', () => {
  const w = parseWorkoutText(1, SAMPLE);
  const squat = w.exercises[0];
  assert.deepEqual(squat.sets, [
    { reps: 5, weight: 147.5, unit: 'lb' },
    { reps: 5, weight: 147.5, unit: 'lb' },
    { reps: 6, weight: 147.5, unit: 'lb' },
  ]);
});

test('parseWorkoutText parses targetSets from the target: segment', () => {
  const w = parseWorkoutText(1, SAMPLE);
  assert.deepEqual(w.exercises[0].targetSets, [
    { reps: 5, weight: 147.5, unit: 'lb' },
    { reps: 5, weight: 147.5, unit: 'lb' },
    { reps: 5, weight: 147.5, unit: 'lb' },
  ]);
});

test('parseWorkoutText handles an exercise line with no warmup segment', () => {
  const w = parseWorkoutText(1, SAMPLE);
  const latPulldown = w.exercises[2];
  assert.deepEqual(latPulldown.sets, [
    { reps: 12, weight: 73.75, unit: 'lb' },
    { reps: 12, weight: 73.75, unit: 'lb' },
    { reps: 12, weight: 73.75, unit: 'lb' },
    { reps: 20, weight: 73.75, unit: 'lb' },
  ]);
});

test('parseWorkoutText handles kg units', () => {
  const kgText =
    '2026-01-01 00:00:00 +00:00 / program: "P" / dayName: "D" / week: 1 / dayInWeek: 1 / duration: 60s / exercises: {\n' +
    '  Deadlift / 1x5 100kg / target: 1x5 100kg\n' +
    '}';
  const w = parseWorkoutText(1, kgText);
  assert.deepEqual(w.exercises[0].sets, [{ reps: 5, weight: 100, unit: 'kg' }]);
});

function workout(date: string, exercise: string, sets: Array<[number, number]>): ParsedWorkout {
  return {
    id: date,
    date,
    program: 'P',
    dayName: 'D',
    durationSeconds: 60,
    exercises: [{ name: exercise, sets: sets.map(([reps, weight]) => ({ reps, weight, unit: 'lb' as const })) }],
  };
}

test('computePersonalRecords picks the heaviest set per exercise and its date', () => {
  const workouts = [
    workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]),
    workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]),
    workout('2026-01-03T00:00:00.000Z', 'Bench Press', [[5, 80]]),
  ];
  const prs = computePersonalRecords(workouts);
  assert.deepEqual(prs, [
    { exercise: 'Squat', weight: 110, unit: 'lb', reps: 5, date: '2026-01-08T00:00:00.000Z' },
    { exercise: 'Bench Press', weight: 80, unit: 'lb', reps: 5, date: '2026-01-03T00:00:00.000Z' },
  ]);
});

test('computePersonalRecords keeps the earliest date when a weight is tied', () => {
  const workouts = [
    workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]),
    workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 110]]),
  ];
  const prs = computePersonalRecords(workouts);
  assert.equal(prs[0].date, '2026-01-01T00:00:00.000Z');
});

test('computeTrend returns the top weight per workout for an exercise, sorted by date', () => {
  const workouts = [
    workout('2026-01-08T00:00:00.000Z', 'Squat', [
      [5, 110],
      [3, 120],
    ]),
    workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]),
    workout('2026-01-05T00:00:00.000Z', 'Bench Press', [[5, 80]]),
  ];
  const trend = computeTrend(workouts, 'Squat');
  assert.deepEqual(trend, [
    { date: '2026-01-01T00:00:00.000Z', weight: 100 },
    { date: '2026-01-08T00:00:00.000Z', weight: 120 },
  ]);
});

test('sparklinePoints returns an empty string for no data', () => {
  assert.equal(sparklinePoints([], 100, 20), '');
});

test('sparklinePoints places a single point at vertical center', () => {
  const points = sparklinePoints([{ date: 'd', weight: 100 }], 100, 20);
  assert.equal(points, '0,10');
});

test('sparklinePoints maps min/max weight to bottom/top of the given height', () => {
  const points = sparklinePoints(
    [
      { date: 'a', weight: 100 },
      { date: 'b', weight: 150 },
      { date: 'c', weight: 200 },
    ],
    100,
    20,
  );
  assert.equal(points, '0,20 50,10 100,0');
});

test('sparklinePoints draws a flat mid-height line when all weights are equal', () => {
  const points = sparklinePoints(
    [
      { date: 'a', weight: 100 },
      { date: 'b', weight: 100 },
    ],
    100,
    20,
  );
  assert.equal(points, '0,10 100,10');
});

test('MAIN_LIFTS is the fixed set of headline exercises', () => {
  assert.deepEqual(MAIN_LIFTS, ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']);
});

test('sortedWorkouts maps collection entries to ParsedWorkout, newest first', () => {
  const entries = [
    {
      id: '1',
      data: {
        date: new Date('2026-01-01T00:00:00.000Z'),
        program: 'P',
        dayName: 'D',
        durationSeconds: 60,
        exercises: [],
      },
    },
    {
      id: '2',
      data: {
        date: new Date('2026-01-08T00:00:00.000Z'),
        program: 'P',
        dayName: 'D',
        durationSeconds: 60,
        exercises: [],
      },
    },
  ] as Parameters<typeof sortedWorkouts>[0];

  const workouts = sortedWorkouts(entries);
  assert.deepEqual(workouts.map((w) => w.id), ['2', '1']);
  assert.equal(workouts[0].date, '2026-01-08T00:00:00.000Z');
  assert.equal(workouts[0].program, 'P');
});

test('groupWorkoutsByYear groups by year, descending, workouts newest first within a year', () => {
  const workouts = [
    workout('2025-03-01T00:00:00.000Z', 'Squat', [[5, 100]]),
    workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 110]]),
    workout('2025-01-01T00:00:00.000Z', 'Squat', [[5, 90]]),
  ];
  const grouped = groupWorkoutsByYear(workouts);
  assert.deepEqual(
    grouped.map(([year]) => year),
    [2026, 2025],
  );
  assert.deepEqual(
    grouped[1][1].map((w) => w.date),
    ['2025-03-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'],
  );
});

test('exerciseIsPR is true only for the workout that first set the record', () => {
  const older = workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]);
  const pr = workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]);
  const later = workout('2026-01-15T00:00:00.000Z', 'Squat', [[5, 110]]); // repeats the PR weight
  const records = computePersonalRecords([older, pr, later]);

  assert.equal(exerciseIsPR(pr, 'Squat', records), true);
  assert.equal(exerciseIsPR(older, 'Squat', records), false);
  assert.equal(exerciseIsPR(later, 'Squat', records), false);
});

test('exerciseIsPR is false for an exercise with no record at all', () => {
  const w = workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]);
  assert.equal(exerciseIsPR(w, 'Bench Press', []), false);
});

test('workoutHasPR is true if any exercise in the workout was a PR that day', () => {
  const w = {
    id: 'multi',
    date: '2026-01-08T00:00:00.000Z',
    program: 'P',
    dayName: 'D',
    durationSeconds: 60,
    exercises: [
      { name: 'Squat', sets: [{ reps: 5, weight: 110, unit: 'lb' as const }] },
      { name: 'Bench Press', sets: [{ reps: 5, weight: 80, unit: 'lb' as const }] },
    ],
  };
  const records = [
    { exercise: 'Squat', weight: 110, unit: 'lb' as const, reps: 5, date: '2026-01-08T00:00:00.000Z' },
    { exercise: 'Bench Press', weight: 90, unit: 'lb' as const, reps: 5, date: '2025-12-01T00:00:00.000Z' },
  ];
  assert.equal(workoutHasPR(w, records), true);
});

test('workoutHasPR is false when no exercise in the workout matches its PR date', () => {
  const w = workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]);
  const records = [{ exercise: 'Squat', weight: 110, unit: 'lb' as const, reps: 5, date: '2026-01-08T00:00:00.000Z' }];
  assert.equal(workoutHasPR(w, records), false);
});

test('workoutsForExercise returns only workouts containing that exercise, order preserved', () => {
  const squatDay = workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]);
  const benchDay = workout('2026-01-05T00:00:00.000Z', 'Bench Press', [[5, 80]]);
  const workouts = [squatDay, benchDay];
  assert.deepEqual(workoutsForExercise(workouts, 'Squat'), [squatDay]);
});

test('workoutsForExercise returns an empty array when the exercise was never logged', () => {
  const w = workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]);
  assert.deepEqual(workoutsForExercise([w], 'Bench Press'), []);
});

test('setStatus is failed when zero reps were completed', () => {
  assert.equal(setStatus({ reps: 0, weight: 125, unit: 'lb' }, { reps: 10, weight: 125, unit: 'lb' }), 'failed');
});

test('setStatus is partial when reps fall short of target', () => {
  assert.equal(setStatus({ reps: 6, weight: 125, unit: 'lb' }, { reps: 10, weight: 125, unit: 'lb' }), 'partial');
});

test('setStatus is met when reps hit or exceed target', () => {
  assert.equal(setStatus({ reps: 10, weight: 125, unit: 'lb' }, { reps: 10, weight: 125, unit: 'lb' }), 'met');
  assert.equal(setStatus({ reps: 6, weight: 147.5, unit: 'lb' }, { reps: 5, weight: 147.5, unit: 'lb' }), 'met');
});

test('setStatus is met when there is no target to compare against', () => {
  assert.equal(setStatus({ reps: 5, weight: 100, unit: 'lb' }, undefined), 'met');
});
