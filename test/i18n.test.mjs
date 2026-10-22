import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LANGUAGES, loadLanguage } from '../src/lib/i18n.mjs';

const read = (code) => JSON.parse(readFileSync(new URL(`../content/i18n/${code}.json`, import.meta.url), 'utf8'));

test('every language has exactly the English set of interface strings', () => {
  const keys = Object.keys(read('en').ui).sort();
  for (const code of LANGUAGES) {
    assert.deepEqual(Object.keys(read(code).ui).sort(), keys, `${code}.json`);
  }
});

test('placeholders in each translation match the English string', () => {
  const placeholders = (s) => (Array.isArray(s) ? '' : [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(','));
  const en = read('en').ui;
  for (const code of LANGUAGES) {
    const ui = read(code).ui;
    for (const key of Object.keys(en)) assert.equal(placeholders(ui[key]), placeholders(en[key]), `${code}: ${key}`);
  }
});

test('times use the local words for parts of the day', () => {
  const hi = loadLanguage('hi').fmt;
  const bn = loadLanguage('bn').fmt;
  const en = loadLanguage('en').fmt;
  assert.equal(en.formatTime('19:30'), '7:30 PM');
  assert.equal(hi.formatTime('06:00'), 'सुबह 6:00');
  assert.equal(hi.formatTime('13:30'), 'दोपहर 1:30');
  assert.equal(hi.formatTime('19:30'), 'शाम 7:30');
  assert.equal(hi.formatTime('23:00'), 'रात 11:00');
  assert.equal(bn.formatTime('16:00'), 'বিকেল 4:00');
  assert.equal(bn.formatTime('19:00'), 'সন্ধ্যা 7:00');
  assert.equal(hi.longDay('2026-11-19'), 'गुरुवार, 19 नवंबर');
  assert.equal(bn.dateRange(['2026-11-19', '2026-11-22']), '19–22 নভেম্বর 2026');
});

test('untranslated event text falls back to English and is reported', () => {
  const hi = loadLanguage('hi');
  assert.equal(hi.tc('Haldi'), 'हल्दी');
  assert.equal(hi.tc('CP Banquet'), 'CP Banquet');
  assert.equal(hi.missingContent.has('CP Banquet'), false, 'kept-as-written names are not reported');
  assert.equal(hi.tc('A brand new function'), 'A brand new function');
  assert.equal(hi.missingContent.has('A brand new function'), true);
});
