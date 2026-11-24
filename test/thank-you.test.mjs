import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toPublicData } from '../src/lib/public-data.mjs';
import { loadLanguage } from '../src/lib/i18n.mjs';
import { renderThankYouPage } from '../src/lib/render.mjs';

const eventData = JSON.parse(await readFile(new URL('../event-data.json', import.meta.url), 'utf8'));
const pub = toPublicData(eventData);

test('thank-you page congratulates the couple and thanks guests in every language', () => {
  const expectations = {
    en: ['Priya', 'Sagar', 'Congratulations to the couple', 'Thank you'],
    hi: ['प्रिया', 'सागर', 'नवदंपती को हार्दिक बधाई', 'आप सभी का धन्यवाद'],
    bn: ['প্রিয়া', 'সাগর', 'নবদম্পতিকে আন্তরিক অভিনন্দন', 'সবাইকে ধন্যবাদ'],
  };
  for (const [code, needles] of Object.entries(expectations)) {
    const html = renderThankYouPage(pub, { lang: loadLanguage(code) });
    for (const needle of needles) assert.ok(html.includes(needle), `${code}: ${needle}`);
  }
});

test('thank-you page publishes no schedule, phone numbers or links', () => {
  const html = renderThankYouPage(pub, { lang: loadLanguage('en') });
  assert.doesNotMatch(html, /data-schedule-item|tel:|wa\.me|forms\.gle/);
  for (const phone of eventData.contacts.flatMap((c) => c.phones)) assert.ok(!html.includes(phone));
});
