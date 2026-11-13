// WhatsApp announcements for the coordinator, built from the same filtered
// public data as the guest site, so every time and place always matches it.
//
// Nothing here sends a message. The page prepares each message, shows when it
// is due, and opens WhatsApp with it typed in; the coordinator picks the group
// and presses Send. (WhatsApp offers no way for a website to post to a group.)
import { icsUtcStamp } from './format.mjs';

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** IST date/time moved by a number of minutes: { date: "2026-11-20", time: "13:00" } */
export function shiftIst(date, time, minutes) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const iso = new Date(Date.UTC(y, m - 1, d, h, min) + minutes * 60_000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

const MEALS = {
  lunch: { en: 'Lunch', hi: 'दोपहर का भोजन' },
  dinner: { en: 'Dinner', hi: 'रात्रि भोज' },
};

/**
 * One announcement per public schedule item (unless skipped in
 * content/announcements.json). `en` and `hi` are languages from i18n.mjs.
 */
export function buildAnnouncements(pub, config, en, hi) {
  const venue = pub.venue.name;
  // The English line carries the full address of an off-site function; the
  // Hindi line just names the place, so the message stays short.
  const place = (item, tc, withAddress = true) => {
    if (item.offsite) return [tc(item.location), withAddress && tc(item.address)].filter(Boolean).join(' — ');
    if (item.location) {
      const where = tc(item.location);
      return where.includes(tc(venue)) ? where : `${where}, ${tc(venue)}`;
    }
    return item.location_needed ? tc(venue) : null;
  };

  return pub.days.flatMap((day) => day.items).flatMap((item) => {
    const settings = config.items[item.id] ?? {};
    if (settings.skip) return [];
    const kind = settings.kind ?? 'function';
    const lead = settings.lead_minutes ?? (kind === 'food' ? 0 : config.default_lead_minutes);
    const due = shiftIst(item.date, item.start_time, -lead);
    const placeEn = place(item, (s) => s);
    const placeHi = place(item, hi.tc, false);
    const timeEn = en.fmt.formatTime(item.start_time);
    const timeHi = hi.fmt.formatTime(item.start_time);
    const endEn = item.end_time && en.fmt.formatTime(item.end_time);
    const endHi = item.end_time && hi.fmt.formatTime(item.end_time);

    let lines;
    if (kind === 'food') {
      const meal = MEALS[settings.meal ?? 'lunch'];
      lines = [
        `🍽️ ${meal.en} is ready!`,
        placeEn && `📍 Please come to the ${placeEn}.`,
        endEn && `⏰ Served until ${endEn} sharp.`,
        '',
        `🙏 ${meal.hi} तैयार है${placeHi ? ` — ${placeHi}` : ''}${endHi ? ` (${endHi} बजे तक)` : ''}`,
      ];
    } else {
      lines = [
        `✨ ${item.title} ${item.onwards ? `from ${timeEn} onwards` : `starts at ${timeEn}`}`,
        placeEn && `📍 ${placeEn}`,
        item.attire && `👗 Dress code: ${item.attire}`,
        endEn && `⏰ Until ${endEn} sharp`,
        '',
        `🙏 ${hi.tc(item.title)} — ${timeHi} बजे से${placeHi ? `, ${placeHi}` : ''}`,
        '',
        `Schedule & updates: ${config.site_url}`,
      ];
    }

    return [{
      id: item.id,
      kind,
      title: kind === 'food' ? `${MEALS[settings.meal ?? 'lunch'].en} is ready` : item.title,
      scheduleTitle: item.title,
      date: item.date,
      start: item.start_time,
      due,
      lead,
      message: lines.filter((line) => line !== null && line !== undefined && line !== false).join('\n'),
    }];
  });
}

const waLink = (message) => `https://wa.me/?text=${encodeURIComponent(message)}`;

function renderCard(a, en) {
  const when = `${en.fmt.shortDay(a.date).weekday} ${en.fmt.shortDay(a.date).label} · ${en.fmt.formatTime(a.start)}`;
  const remind = a.lead === 0
    ? `Due at ${en.fmt.formatTime(a.due.time)}`
    : `Remind at ${en.fmt.formatTime(a.due.time)} · ${a.lead} min before`;
  const rows = Math.min(16, a.message.split('\n').length + 4);
  return `
      <article class="ann" id="a-${esc(a.id)}" data-id="${esc(a.id)}" data-due="${esc(`${a.due.date}T${a.due.time}`)}" data-start="${esc(`${a.date}T${a.start}`)}" data-food="${a.kind === 'food'}">
        <header class="ann__head">
          <div>
            <p class="ann__when">${esc(when)}</p>
            <h3 class="ann__title">${esc(a.title)}</h3>
          </div>
          <span class="ann__status" data-status>Upcoming</span>
        </header>
        <p class="ann__remind">${esc(remind)}${a.kind === 'food' ? ' · confirm the food is ready first' : ''}</p>
        <label class="visually-hidden" for="m-${esc(a.id)}">Message for ${esc(a.title)}</label>
        <textarea class="input ann__msg" id="m-${esc(a.id)}" rows="${rows}" data-msg>${esc(a.message)}</textarea>
        <template data-original>${esc(a.message)}</template>
        ${a.kind === 'food' ? `<div class="ann__food">
          <button class="btn btn--ghost" type="button" data-food-confirm>Confirm food is ready</button>
          <p class="ann__note" data-food-note hidden></p>
        </div>` : ''}
        <div class="ann__actions">
          <a class="btn btn--primary" data-wa href="${esc(waLink(a.message))}" target="_blank" rel="noopener">Open WhatsApp</a>
          <button class="btn btn--ghost" type="button" data-mark-sent>Mark sent</button>
          <button class="btn btn--ghost" type="button" data-reopen hidden>Reopen</button>
          <button class="btn btn--ghost" type="button" data-copy hidden>Copy text</button>
          <button class="btn btn--link" type="button" data-reset hidden>Undo my edits</button>
        </div>
        <p class="ann__note" data-note hidden></p>
      </article>`;
}

export function renderAnnouncePage(list, { en, generatedAt }) {
  const days = [...new Set(list.map((a) => a.date))];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Announcements · Priya &amp; Sagar</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#faf8f5">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="announce.css">
  <script>document.documentElement.classList.add('js')</script>
  <script src="announce.js" defer></script>
</head>
<body class="announce">
  <header class="ann-top">
    <div class="container">
      <p class="eyebrow">Coordinator only · not linked from the guest site</p>
      <h1 class="ann-top__title">WhatsApp announcements</h1>
      <p class="ann-top__clock" data-clock></p>
    </div>
  </header>
  <main class="container">
    <section class="ann-intro card">
      <h2 class="ann-intro__title">How it works</h2>
      <ol>
        <li>When an announcement is due it moves to <strong>Ready now</strong> below.</li>
        <li>Check the message (you can edit it), then tap <strong>Open WhatsApp</strong>, choose the family group and press <strong>Send</strong>. Nothing is ever sent automatically.</li>
        <li>Come back and tap <strong>Mark sent</strong>, so it isn’t sent twice. <strong>Reopen</strong> lets you send it again on purpose.</li>
        <li>For meals, tap <strong>Confirm food is ready</strong> first.</li>
      </ol>
      <p><a class="btn btn--ghost" href="announcements.ics" download>Add reminders to my calendar</a></p>
      <p class="ann-intro__fine">Your edits and ticks are saved on this phone only. Built ${esc(generatedAt.toISOString().slice(0, 10))} from the live schedule.</p>
    </section>

    <section class="ann-ready" data-ready hidden aria-live="polite">
      <h2 class="ann-section-title">Ready now</h2>
      <ul class="ann-ready__list" data-ready-list></ul>
    </section>

    ${days.map((date) => `
    <section class="ann-day" aria-labelledby="d-${date}">
      <h2 class="ann-section-title" id="d-${date}">${esc(en.fmt.longDay(date))}</h2>
      ${list.filter((a) => a.date === date).map((a) => renderCard(a, en)).join('')}
    </section>`).join('')}

    <section class="ann-log card">
      <h2 class="ann-section-title">Activity on this phone</h2>
      <ol class="ann-log__list" data-log><li>Nothing yet.</li></ol>
      <button class="btn btn--link" type="button" data-reset-all hidden>Clear all ticks and edits on this phone</button>
    </section>
  </main>
</body>
</html>
`;
}

/** Calendar of reminders: each event starts when its announcement is due, with an alert. */
export function renderAnnounceIcs(list, { siteUrl, generatedAt, en }) {
  const text = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const stamp = generatedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = list.map((a) => {
    const end = shiftIst(a.due.date, a.due.time, 10);
    const link = `${siteUrl}announce/#a-${a.id}`;
    const summary = a.kind === 'food'
      ? `📣 ${a.title}? Confirm food, then announce`
      : `📣 Announce ${a.scheduleTitle} (${en.fmt.formatTime(a.start)})`;
    return [
      'BEGIN:VEVENT',
      `UID:announce-${a.id}@priya-sagar-wedding.invalid`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsUtcStamp(a.due.date, a.due.time)}`,
      `DTEND:${icsUtcStamp(end.date, end.time)}`,
      `SUMMARY:${text(summary)}`,
      `DESCRIPTION:${text(`Open the announcement: ${link}`)}`,
      `URL:${link}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${text(summary)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Priya & Sagar Wedding//Announcements//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Wedding announcements',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
