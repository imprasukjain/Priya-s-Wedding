import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toPublicData } from '../src/lib/public-data.mjs';

const eventData = JSON.parse(await readFile(new URL('../event-data.json', import.meta.url), 'utf8'));

test('public data never contains notification material or open questions', () => {
  const pub = toPublicData(eventData);
  const json = JSON.stringify(pub).toLowerCase();
  assert.equal('notification_material' in pub, false);
  assert.equal('open_questions' in pub, false);
  for (const item of eventData.notification_material) {
    assert.equal(json.includes(item.id), false);
    assert.equal(json.includes(item.title.toLowerCase()), false);
  }
});

test('filter is a hard filter even if a private item slips into schedule', () => {
  const tampered = structuredClone(eventData);
  tampered.schedule.push(
    { id: 'leak-a', date: '2026-11-20', start_time: '11:00', title: 'Hidden A', location: null, timing_status: 'confirmed', display_on_website: false, channels: ['website'] },
    { id: 'leak-b', date: '2026-11-21', start_time: '23:30', title: 'Hidden B', location: null, timing_status: 'confirmed', display_on_website: true, channels: ['whatsapp'] },
  );
  const titles = toPublicData(tampered).days.flatMap((d) => d.items.map((i) => i.title));
  assert.ok(!titles.includes('Hidden A'));
  assert.ok(!titles.includes('Hidden B'));
});

test('schedule is grouped by day, 4 + 4, sorted by start time with stable ties', () => {
  const { days } = toPublicData(eventData);
  assert.deepEqual(days.map((d) => [d.date, d.items.length]), [['2026-11-20', 4], ['2026-11-21', 4]]);
  assert.deepEqual(days[1].items.map((i) => i.id), ['barat-aagman', 'dinner-21-nov', 'bhatai-milap', 'stage-program']);
});

test('unknown fields are not copied into public output', () => {
  const extra = structuredClone(eventData);
  extra.schedule[0].internal_note = 'secret';
  assert.equal(JSON.stringify(toPublicData(extra)).includes('secret'), false);
});

test('updates are sorted newest first and approver is not exposed', () => {
  const pub = toPublicData(eventData, {
    updates: [
      { id: 'a', posted_at: '2026-11-20T09:00:00+05:30', title: 'Old', message: 'x', approved_by: 'Approver Name' },
      { id: 'b', posted_at: '2026-11-20T12:00:00+05:30', title: 'New', message: 'y', approved_by: 'Approver Name' },
    ],
  });
  assert.deepEqual(pub.updates.map((u) => u.id), ['b', 'a']);
  assert.equal(JSON.stringify(pub).includes('Approver Name'), false);
});
