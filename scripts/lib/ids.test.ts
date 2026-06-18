import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, uniqueTalkId, eventId } from './ids.ts';

test('slugify lowercases and dashes', () => {
  assert.equal(slugify('Cloud Native & Kubernetes!'), 'cloud-native-kubernetes');
});

test('uniqueTalkId uses year-slug, suffixes on collision', () => {
  assert.equal(uniqueTalkId(2026, 'escaping-iiot', new Set()), '2026-escaping-iiot');
  assert.equal(
    uniqueTalkId(2026, 'escaping-iiot', new Set(['2026-escaping-iiot'])),
    '2026-escaping-iiot-2',
  );
  assert.equal(
    uniqueTalkId(2026, 'escaping-iiot', new Set(['2026-escaping-iiot', '2026-escaping-iiot-2'])),
    '2026-escaping-iiot-3',
  );
});

test('eventId is name-slug + year', () => {
  assert.equal(eventId('KubeCon EU', 2026), 'kubecon-eu-2026');
});
