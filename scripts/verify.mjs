// Milestone 01 acceptance checks against the built dist/ output.
// Run with: npm run verify   (builds first)
import { readdir, readFile } from 'node:fs/promises';
import { loadValidatedData } from '../src/lib/load-data.mjs';
import { formatTime, icsUtcStamp } from '../src/lib/format.mjs';

const dist = new URL('../dist/', import.meta.url);
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });

const { eventData } = await loadValidatedData();
check('event-data.json and content/updates.json are schema-valid', true);

const files = await readdir(dist);
const outputs = Object.fromEntries(
  await Promise.all(files.map(async (f) => [f, await readFile(new URL(f, dist), 'utf8')])),
);
const html = outputs['index.html'];
const ics = outputs['schedule.ics'];
const everything = Object.values(outputs).join('\n');
const lower = everything.toLowerCase();

// 1. Exact public counts per day, read from the rendered HTML.
const panel = (date) => html.split(`id="day-${date}"`)[1]?.split('</section>')[0] ?? '';
const count = (date) => (panel(date).match(/data-schedule-item=/g) || []).length;
check('20 November shows exactly 4 public entries', count('2026-11-20') === 4, `found ${count('2026-11-20')}`);
check('21 November shows exactly 4 public entries', count('2026-11-21') === 4, `found ${count('2026-11-21')}`);
check('Calendar download has exactly 8 events', (ics.match(/BEGIN:VEVENT/g) || []).length === 8);

// 2. No WhatsApp-only material anywhere in the output (HTML, CSS, JS, ICS).
for (const item of eventData.notification_material) {
  const tokens = [
    item.id,
    item.title,
    item.time,
    formatTime(item.time),
    icsUtcStamp(item.date, item.time),
  ];
  for (const token of tokens) {
    check(`Private "${item.title}" absent: ${JSON.stringify(token)}`, !lower.includes(token.toLowerCase()));
  }
}
for (const word of ['phere', 'ritual', 'lunch', 'notification_material', 'open_questions']) {
  check(`No "${word}" anywhere in the output`, !lower.includes(word));
}

// 3. Required public content.
check('21 Nov dinner shows the 10:00 PM sharp end time',
  panel('2026-11-21').includes('4:00 PM onwards · ends 10:00 PM sharp'));
check('Haldi location reads "Near the swimming pool at CP Palace"',
  panel('2026-11-20').includes('Near the swimming pool at CP Palace'));
check('Tea/coffee note shown under 20 November',
  panel('2026-11-20').includes('Tea and coffee available throughout the day') &&
  !panel('2026-11-21').includes('Tea and coffee'));
check('Every schedule item shows a timing status',
  (html.match(/class="pill pill--(confirmed|provisional)"/g) || []).length === 8);
check('Order within each day is chronological', ['2026-11-20', '2026-11-21'].every((d) => {
  const starts = [...panel(d).matchAll(/data-start="[^"]*T(\d\d:\d\d)"/g)].map((m) => m[1]);
  return starts.every((t, i) => i === 0 || starts[i - 1] <= t);
}));

// 4. Pending states, not invented details.
check('Address shown as pending', html.includes('Full address awaiting confirmation'));
check('Map link shown as pending', html.includes('An approved map link will be added here'));
check('On-day contact shown as pending', html.includes('on-day contact') && !/tel:/.test(html));
check('Updates empty state shown', html.includes('No updates yet'));

// 5. Sections and prototype safety.
for (const id of ['top', 'schedule', 'venue', 'updates', 'help']) {
  check(`Section #${id} present`, html.includes(`id="${id}"`));
}
check('Preview is marked noindex', html.includes('content="noindex, nofollow"'));
check('No external network URLs or WhatsApp links in output',
  !/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(everything) && !/wa\.me|api\.whatsapp/i.test(everything));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
