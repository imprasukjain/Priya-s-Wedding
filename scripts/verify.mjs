// Milestone 01 acceptance checks against the built dist/ output.
// Run with: npm run verify   (builds first)
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadValidatedData } from '../src/lib/load-data.mjs';
import { formatTime, icsUtcStamp } from '../src/lib/format.mjs';

const dist = new URL('../dist/', import.meta.url);
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });

const { eventData } = await loadValidatedData();
check('event-data.json and content/updates.json are schema-valid', true);

const files = (await readdir(dist, { recursive: true, withFileTypes: true }))
  .filter((e) => e.isFile())
  .map((e) => relative(fileURLToPath(dist), join(e.parentPath ?? e.path, e.name)).split(sep).join('/'));
const outputs = Object.fromEntries(
  await Promise.all(files.map(async (f) => [f, await readFile(new URL(f, dist), 'utf8')])),
);
check('Preview variant built and free of downloads, print, map embeds and share sheet',
  outputs['embedded/index.html'] && !/<html[\s>]|<head[\s>]|download>|data-action="print"|data-map-src|data-action="share"/.test(outputs['embedded/index.html'].replace(/<script>[\s\S]*?<\/script>/g, '')));
const html = outputs['index.html'];
const ics = outputs['schedule.ics'];
const everything = Object.values(outputs).join('\n');
const lower = everything.toLowerCase();

// 1. Exact public counts per day, read from the rendered HTML.
const panel = (date) => html.split(`id="day-${date}"`)[1]?.split('</section>')[0] ?? '';
const panelOf = (id) => html.split(`id="${id}"`)[1]?.split('</section>')[0] ?? '';
const count = (date) => (panel(date).match(/data-schedule-item=/g) || []).length;
for (const date of eventData.event_dates) {
  const expected = eventData.schedule.filter((i) => i.date === date && i.display_on_website).length;
  check(`${date} shows exactly ${expected} public entries`, count(date) === expected, `found ${count(date)}`);
}
const expectedEvents = eventData.schedule.filter((i) => i.display_on_website).length;
check(`Calendar download has exactly ${expectedEvents} events`, (ics.match(/BEGIN:VEVENT/g) || []).length === expectedEvents);
for (const item of eventData.schedule) {
  const card = html.split(`data-schedule-item="${item.id}"`)[1]?.split('</li>')[0] ?? '';
  check(`"${item.title}" (${item.date}) shows ${formatTime(item.start_time)}${item.location ? ` at ${item.location}` : ''}`,
    html.includes(`data-schedule-item="${item.id}" data-start="${item.date}T${item.start_time}"`) &&
      card.includes(item.title) && (!item.location || card.includes(item.location)));
}

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
// Any future WhatsApp-only item added to notification_material is scanned for above.
for (const word of ['notification_material', 'open_questions']) {
  check(`No "${word}" anywhere in the output`, !lower.includes(word));
}

// 3. Required public content.
check('21 Nov dinner shows the 10:00 PM sharp end time',
  panel('2026-11-21').includes('4:00 PM onwards · ends 10:00 PM sharp'));
const serviceDays = eventData.event_dates.filter((d) =>
  eventData.guest_services.some((s) => s.availability.endsWith(` ${Number(d.slice(8))} November`)));
check(`Tea/coffee note shown on ${serviceDays.join(', ')} only`,
  eventData.event_dates.every((d) => panel(d).includes('Tea and coffee available throughout the day') === serviceDays.includes(d)));
for (const item of eventData.schedule.filter((i) => i.offsite)) {
  const card = html.split(`data-schedule-item="${item.id}"`)[1]?.split('</li>')[0] ?? '';
  check(`${item.title} is marked as a separate venue (card, FAQ, calendar)`,
    card.includes('Separate venue') && panelOf('help').includes(`is at ${item.location}`) &&
    ics.includes(`LOCATION:${item.location.replace(/,/g, '\\,')}\r\n`));
}
check('Mehendi shows "7:00 PM onwards"', panel('2026-11-19').includes('7:00 PM onwards'));
check('Every schedule item shows a timing status',
  (html.match(/class="pill pill--(confirmed|provisional)"/g) || []).length === expectedEvents);
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
check('RSVP send control is a real link to the approved number',
  panelOf('rsvp').includes(`data-rsvp-send href="https://wa.me/91${rsvp.whatsapp_number}?text=`));
check('RSVP form and no-JS fallback point to the approved WhatsApp number',
  panelOf('rsvp').includes(`data-wa-url="https://wa.me/91${rsvp.whatsapp_number}"`) &&
  panelOf('rsvp').includes(`href="https://wa.me/91${rsvp.whatsapp_number}?text=`));
check('RSVP asks for ETA and mode of travel',
  panelOf('rsvp').includes('name="eta_day"') && panelOf('rsvp').includes('name="eta_time"') &&
  panelOf('rsvp').includes('name="travel"') && /name="travel" value="[^"]+" required/.test(panelOf('rsvp')));
check('RSVP asks for one RSVP per family', panelOf('rsvp').includes('One RSVP per family'));
check('RSVP lets guests tick each day they will attend',
  eventData.event_dates.every((d) => new RegExp(`type="checkbox" name="days" value="[^"]*${Number(d.slice(8))} Nov"`).test(panelOf('rsvp'))));
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
check('Page is kept out of search engines (noindex)', html.includes('content="noindex, nofollow"'));
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
