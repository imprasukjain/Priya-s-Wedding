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
const panelOf = (id) => html.split(`id="${id}"`)[1]?.split('</section>')[0] ?? '';
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
const { venue, contacts, travel } = eventData;
check('Venue postal address shown', panelOf('venue').includes(venue.address));
check('Venue map opens the approved link', html.includes(`href="${venue.maps_url}"`));
const telLinks = [...html.matchAll(/href="tel:\+91(\d{10})"/g)].map((m) => m[1]).sort();
const expectedPhones = contacts.flatMap((c) => c.phones).sort();
check('Every on-day contact number is a tap-to-call link, and no others',
  JSON.stringify(telLinks) === JSON.stringify(expectedPhones), `${telLinks.length} links`);
for (const stay of travel.stays) check(`Stay "${stay.name}" listed`, panelOf('travel').includes(stay.name));
check('Transport destinations listed with timings pending',
  travel.transport.destinations.every((d) => panelOf('travel').includes(d)) && panelOf('travel').includes('Timings soon'));
const { rsvp, dress_code: dressCode } = eventData;
check('RSVP form and no-JS fallback point to the approved WhatsApp number',
  panelOf('rsvp').includes(`data-wa-url="https://wa.me/91${rsvp.whatsapp_number}"`) &&
  panelOf('rsvp').includes(`href="https://wa.me/91${rsvp.whatsapp_number}?text=`));
check('RSVP deadline shown', panelOf('rsvp').includes('Please RSVP by Sunday, 15 November'));
check('Aadhaar requirement shown in RSVP and Travel',
  panelOf('rsvp').includes(travel.check_in_note) && panelOf('travel').includes(travel.check_in_note));
check('RSVP is not collected or stored by the site (no form action, no fetch)',
  !/<form[^>]*\saction=/i.test(html) && !/fetch\(|XMLHttpRequest|localStorage|sendBeacon/.test(outputs['app.js']));
for (const item of dressCode.items) {
  check(`Dress code "${item.label}: ${item.guidance}" shown`, panelOf('dress-code').includes(item.guidance));
  for (const id of item.applies_to) {
    const card = html.split(`data-schedule-item="${id}"`)[1]?.split('</li>')[0] ?? '';
    check(`Dress code shown on the ${id} schedule card`, card.includes(item.guidance));
  }
}
check('Updates empty state shown', html.includes('No updates yet'));

// 5. Sections and prototype safety.
for (const id of ['top', 'schedule', 'venue', 'travel', 'rsvp', 'dress-code', 'updates', 'help']) {
  check(`Section #${id} present`, html.includes(`id="${id}"`));
}
check('Preview is marked noindex', html.includes('content="noindex, nofollow"'));
// Only map/RSVP links approved in event-data.json may appear; no WhatsApp links or APIs.
const rsvpChat = rsvp.whatsapp_number ? `https://wa.me/91${rsvp.whatsapp_number}` : null;
const approvedUrls = new Set(
  [venue.maps_url, venue.maps_embed_url, eventData.rsvp?.url,
    ...travel.stays.flatMap((st) => [st.maps_url, st.maps_embed_url])]
    .filter(Boolean).map((u) => u.replace(/&/g, '&amp;')),
);
const foundUrls = [...everything.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0])
  .filter((u) => u !== 'http://www.w3.org/2000/svg');
const unapproved = foundUrls.filter((u) => !approvedUrls.has(u) && !(rsvpChat && (u === rsvpChat || u.startsWith(`${rsvpChat}?text=`))));
check('Only approved map/RSVP URLs appear in output', unapproved.length === 0, unapproved.join(', '));
check('No WhatsApp API use; click-to-chat only to the approved RSVP number',
  !/api\.whatsapp|graph\.facebook|whatsapp:\/\//i.test(everything) &&
  [...everything.matchAll(/wa\.me\/(\d+)/g)].every((m) => m[1] === `91${rsvp.whatsapp_number}`));
check('Map embeds load only on request (no iframe in the page source)', !/<iframe/i.test(html));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
