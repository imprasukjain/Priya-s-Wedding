import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toPublicData } from '../src/lib/public-data.mjs';
import { loadLanguage } from '../src/lib/i18n.mjs';
import { buildAnnouncements, renderAnnounceIcs, shiftIst } from '../src/lib/announcements.mjs';

const read = async (p) => JSON.parse(await readFile(new URL(`../${p}`, import.meta.url), 'utf8'));
const eventData = await read('event-data.json');
const config = await read('content/announcements.json');
const en = loadLanguage('en');
const hi = loadLanguage('hi');
const list = buildAnnouncements(toPublicData(eventData), config, en, hi);
const byId = Object.fromEntries(list.map((a) => [a.id, a]));

test('shiftIst moves across midnight', () => {
  assert.deepEqual(shiftIst('2026-11-22', '06:00', -30), { date: '2026-11-22', time: '05:30' });
  assert.deepEqual(shiftIst('2026-11-22', '00:10', -30), { date: '2026-11-21', time: '23:40' });
});

test('one announcement per public function, in schedule order', () => {
  assert.equal(list.length, eventData.schedule.filter((i) => i.display_on_website).length);
  assert.equal(list[0].id, 'mehendi');
  assert.equal(list.at(-1).id, 'vidayi');
});

test('functions are due 30 minutes early; meals are due on time and marked as food', () => {
  assert.deepEqual(byId.haldi.due, { date: '2026-11-20', time: '13:00' });
  assert.equal(byId.haldi.kind, 'function');
  assert.deepEqual(byId['lunch-20-nov'].due, { date: '2026-11-20', time: '11:00' });
  assert.equal(byId['lunch-20-nov'].kind, 'food');
});

test('messages carry the real time, place, dress code and a Hindi line', () => {
  const haldi = byId.haldi.message;
  assert.match(haldi, /Haldi starts at 1:30 PM/);
  assert.match(haldi, /Near the swimming pool at CP Banquet/);
  assert.match(haldi, /Dress code: Pastel colours/);
  assert.match(haldi, /हल्दी — दोपहर 1:30 बजे से/);
  assert.match(byId['dinner-21-nov'].message, /Served until 10:00 PM sharp/);
  assert.match(byId.mehendi.message, /from 7:00 PM onwards/);
  assert.doesNotMatch(byId.vidayi.message, /📍/, 'Vidayi has no place line');
});

test('calendar alert for each announcement at its due time (UTC)', () => {
  const ics = renderAnnounceIcs(list, { siteUrl: config.site_url, generatedAt: new Date('2026-11-13T00:00:00Z'), en });
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, list.length);
  assert.match(ics, /DTSTART:20261120T073000Z/, 'Haldi reminder 1:00 PM IST = 07:30 UTC');
  assert.match(ics, /URL:https:\/\/imprasukjain\.github\.io\/Priya-s-Wedding\/announce\/#a-haldi/);
});
