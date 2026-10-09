// Renders the public site from the filtered public data object only.
// Never pass raw event data to this module — see public-data.mjs.
import {
  dateRange, dayMonth, formatPostedAt, formatTime, longDay, shortDay, splitTime,
} from './format.mjs';

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const icon = (name) => `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;

const ICONS = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5ZM10 20.5a2.2 2.2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></symbol>
  <symbol id="i-cup" viewBox="0 0 24 24"><path d="M4.5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9ZM16.5 10.5h1.2a2.3 2.3 0 0 1 0 4.6h-1.5M8 3.5c-.6.9.6 1.6 0 2.5M12 3.5c-.6.9.6 1.6 0 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-print" viewBox="0 0 24 24"><path d="M7 9V4h10v5M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 19 17h-2M7 14h10v6H7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
  <symbol id="i-share" viewBox="0 0 24 24"><path d="M12 15V4m0 0L8 8m4-4 4 4M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M8.2 3.8 6 4.2A2 2 0 0 0 4.4 6.4c.7 7 6.2 12.5 13.2 13.2a2 2 0 0 0 2.2-1.6l.4-2.2a1.5 1.5 0 0 0-1-1.7l-2.6-.9a1.5 1.5 0 0 0-1.6.4l-.9 1a11 11 0 0 1-5.2-5.2l1-.9a1.5 1.5 0 0 0 .4-1.6l-.9-2.6a1.5 1.5 0 0 0-1.7-1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</svg>`;

const pending = (label = 'Pending') =>
  `<span class="pill pill--pending"><span class="pill__dot" aria-hidden="true"></span>${esc(label)}</span>`;

const statusPill = (status) =>
  status === 'provisional'
    ? '<span class="pill pill--provisional">Provisional</span>'
    : '<span class="pill pill--confirmed">Confirmed</span>';

/** Attach "Available throughout 20 November"-style services to that day. */
function servicesByDay(pub) {
  const perDay = new Map(pub.event_dates.map((d) => [d, []]));
  const general = [];
  for (const service of pub.guestServices) {
    const day = pub.event_dates.find((d) => service.availability === `Available throughout ${dayMonth(d)}`);
    if (day) perDay.get(day).push(`${service.name} available throughout the day`);
    else general.push(`${service.name}: ${service.availability}`);
  }
  return { perDay, general };
}

function renderItem(item) {
  const { clock, meridiem } = splitTime(item.start_time);
  const timing = item.end_time
    ? `${formatTime(item.start_time)} onwards · ends ${formatTime(item.end_time)} sharp`
    : formatTime(item.start_time);
  const location = item.location
    ? `<p class="event__meta">${icon('pin')}<span>${esc(item.location)}</span></p>`
    : `<p class="event__meta event__meta--pending">${icon('pin')}<span>Area at venue to be confirmed</span></p>`;

  return `
        <li class="event" data-schedule-item="${esc(item.id)}" data-start="${esc(`${item.date}T${item.start_time}`)}">
          <div class="event__time" aria-hidden="true">
            <span class="event__clock">${esc(clock)}</span>
            <span class="event__meridiem">${esc(meridiem)}</span>
          </div>
          <div class="event__marker" aria-hidden="true"></div>
          <div class="event__body">
            <div class="event__head">
              <h4 class="event__title">${esc(item.title)}</h4>
              ${statusPill(item.timing_status)}
            </div>
            <p class="event__timing${item.end_time ? ' event__timing--strong' : ' visually-hidden'}">${esc(timing)}</p>
            ${location}
            <span class="event__next" hidden>Up next</span>
          </div>
        </li>`;
}

function renderSchedule(pub) {
  const { perDay, general } = servicesByDay(pub);
  const tabs = pub.days
    .map((day, i) => {
      const s = shortDay(day.date);
      return `
        <button class="tab" role="tab" id="tab-${day.date}" aria-controls="day-${day.date}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
          <span class="tab__weekday">${esc(s.weekday)}</span>
          <span class="tab__date">${esc(s.label)}</span>
        </button>`;
    })
    .join('');

  const panels = pub.days
    .map((day, i) => {
      const services = perDay.get(day.date)
        .map((text) => `<p class="service">${icon('cup')}<span>${esc(text)}</span></p>`)
        .join('');
      return `
      <section class="day" id="day-${day.date}" role="tabpanel" aria-labelledby="tab-${day.date} day-title-${day.date}" data-day="${esc(day.date)}" tabindex="0">
        <header class="day__header">
          <p class="day__index">Day ${i + 1}</p>
          <h3 class="day__title" id="day-title-${day.date}">${esc(longDay(day.date))}</h3>
        </header>
        ${services}
        <ol class="timeline" aria-label="Events on ${esc(longDay(day.date))}">${day.items.map(renderItem).join('')}
        </ol>
      </section>`;
    })
    .join('');

  const generalServices = general.length
    ? `<div class="services-general">${general.map((t) => `<p class="service">${icon('cup')}<span>${esc(t)}</span></p>`).join('')}</div>`
    : '';

  return `
  <section class="section" id="schedule" aria-labelledby="schedule-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Schedule</p>
        <h2 class="section__title" id="schedule-title">Two days of celebration</h2>
        <p class="section__lede">All times are local (IST). Every time shown has been confirmed by the family unless it is marked <em>Provisional</em>.</p>
      </header>
      <div class="tabs" role="tablist" aria-label="Choose a day" hidden>${tabs}
      </div>
      <div class="days">${panels}
      </div>
      ${generalServices}
      <div class="schedule-actions">
        <a class="btn btn--ghost" href="schedule.ics" download>${icon('download')}<span>Add to calendar</span></a>
        <button class="btn btn--ghost" type="button" data-action="print" hidden>${icon('print')}<span>Print schedule</span></button>
      </div>
    </div>
  </section>`;
}

function renderVenue(pub) {
  const { venue } = pub;
  const knownAreas = pub.days.flatMap((d) => d.items).filter((i) => i.location);
  const pendingAreas = pub.days.flatMap((d) => d.items).filter((i) => !i.location);
  const uniquePendingTitles = [...new Set(pendingAreas.map((i) => i.title))];

  const address = venue.address
    ? `<p class="detail__value">${esc(venue.address)}</p>`
    : `<p class="detail__value detail__value--pending">Full address awaiting confirmation from the family and venue.</p>`;
  const directions = venue.maps_url
    ? `<a class="btn btn--primary" href="${esc(venue.maps_url)}" rel="noopener" target="_blank">${icon('pin')}<span>Open in Maps</span></a>`
    : `<p class="detail__value detail__value--pending">An approved map link will be added here.</p>`;

  return `
  <section class="section section--tint" id="venue" aria-labelledby="venue-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Venue</p>
        <h2 class="section__title" id="venue-title">${esc(venue.name)}</h2>
        ${venue.locality ? `<p class="section__lede">${esc(venue.locality)}</p>` : ''}
      </header>
      <div class="card venue-card">
        <div class="detail">
          <div class="detail__label"><span>Address</span>${venue.address ? '' : pending()}</div>
          ${address}
        </div>
        <div class="detail">
          <div class="detail__label"><span>Map &amp; directions</span>${venue.maps_url ? '' : pending()}</div>
          ${directions}
        </div>
        <div class="detail">
          <div class="detail__label"><span>Where things happen</span>${uniquePendingTitles.length ? pending('Partly pending') : ''}</div>
          <ul class="areas">
            ${knownAreas.map((i) => `<li><span class="areas__event">${esc(i.title)}</span><span class="areas__place">${esc(i.location)}</span></li>`).join('')}
            ${uniquePendingTitles.length ? `<li class="areas__pending"><span class="areas__event">${esc(uniquePendingTitles.join(', '))}</span><span class="areas__place">Areas within the venue to be confirmed</span></li>` : ''}
          </ul>
        </div>
      </div>
    </div>
  </section>`;
}

function renderUpdates(pub) {
  const list = pub.updates.length
    ? `<ol class="updates">${pub.updates
        .map(
          (u, i) => `
        <li class="update${i === 0 ? ' update--latest' : ''}">
          <div class="update__meta">${i === 0 ? '<span class="pill pill--accent">Latest</span>' : ''}<time datetime="${esc(u.posted_at)}">${esc(formatPostedAt(u.posted_at))}</time></div>
          <h3 class="update__title">${esc(u.title)}</h3>
          <p class="update__message">${esc(u.message)}</p>
        </li>`,
        )
        .join('')}
      </ol>`
    : `<div class="card empty">
        <span class="empty__icon">${icon('bell')}</span>
        <div>
          <h3 class="empty__title">No updates yet</h3>
          <p class="empty__text">Any change on the day — timings, areas, reminders — will be posted here first, newest on top.</p>
        </div>
      </div>`;

  return `
  <section class="section" id="updates" aria-labelledby="updates-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Updates</p>
        <h2 class="section__title" id="updates-title">Latest from the family</h2>
      </header>
      ${list}
      <div class="card share" id="share">
        <div class="share__copy">
          <h3 class="share__title">Share this page</h3>
          <p class="share__text">Send guests here for the schedule and any day-of changes.</p>
        </div>
        <div class="share__actions">
          <button class="btn btn--primary" type="button" data-action="share" hidden>${icon('share')}<span>Share</span></button>
          <button class="btn btn--ghost" type="button" data-action="copy" hidden>${icon('copy')}<span>Copy message</span></button>
        </div>
        <p class="share__status" role="status" aria-live="polite"></p>
      </div>
    </div>
  </section>`;
}

function renderHelp(pub) {
  const couple = `${pub.couple.partner_one} & ${pub.couple.partner_two}`;
  const faqs = [
    ['When and where is the wedding?', `${dateRange(pub.event_dates)} at ${pub.venue.name}${pub.venue.locality ? `, ${pub.venue.locality}` : ''}.`],
    ['Where will changes be announced?', 'In the Updates section of this page. Please check it before heading to each function.'],
    ['Can I add the functions to my calendar?', 'Yes — use “Add to calendar” under the schedule to download all the public functions at once.'],
  ];
  return `
  <section class="section section--tint" id="help" aria-labelledby="help-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Help</p>
        <h2 class="section__title" id="help-title">Need a hand?</h2>
      </header>
      <div class="help-grid">
        <div class="card contact">
          <div class="detail__label"><span>On-day contact</span>${pending()}</div>
          <p class="contact__body">${icon('phone')}<span>The family will share an on-day contact for ${esc(couple)}’s guests here.</span></p>
        </div>
        <div class="faq">
          ${faqs
            .map(
              ([q, a]) => `
          <details class="faq__item">
            <summary>${esc(q)}</summary>
            <p>${esc(a)}</p>
          </details>`,
            )
            .join('')}
        </div>
      </div>
    </div>
  </section>`;
}

export function renderPage(pub, { theme, generatedAt, preview }) {
  const couple = `${pub.couple.partner_one} & ${pub.couple.partner_two}`;
  const range = dateRange(pub.event_dates);
  const venueLine = [pub.venue.name, pub.venue.locality].filter(Boolean).join(', ');
  const latest = pub.updates[0];
  const shareText = `${couple}’s wedding · ${range} · ${venueLine}. Schedule, venue details and day-of updates: {url}`;
  const monogram = `${pub.couple.partner_one[0]}&amp;${pub.couple.partner_two[0]}`;

  return `<!doctype html>
<html lang="en" data-theme="${esc(theme)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(couple)} · ${esc(range)}</title>
  <meta name="description" content="${esc(`Schedule, venue and updates for ${couple}’s wedding, ${range}, ${venueLine}.`)}">
  ${preview ? '<meta name="robots" content="noindex, nofollow">' : ''}
  <meta name="theme-color" content="#faf8f5">
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='#1d1b19'/><text x='32' y='41' font-family='Georgia,serif' font-size='26' fill='#fff' text-anchor='middle'>${pub.couple.partner_one[0]}&amp;${pub.couple.partner_two[0]}</text></svg>`)}">
  <link rel="stylesheet" href="styles.css">
  <script>document.documentElement.classList.add('js')</script>
  <script src="app.js" defer></script>
</head>
<body>
${ICONS}
  <a class="skip-link" href="#main">Skip to content</a>
  ${preview ? `<div class="preview-bar" role="note">Preview · not yet approved for publishing</div>` : ''}
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="monogram" href="#top" aria-label="${esc(couple)} — back to top">${monogram}</a>
      <nav class="nav" aria-label="Sections">
        <a href="#schedule">Schedule</a>
        <a href="#venue">Venue</a>
        <a href="#updates">Updates</a>
        <a href="#help">Help</a>
      </nav>
    </div>
  </header>

  <main id="main">
  <section class="hero" id="top" aria-labelledby="hero-title">
    <div class="container hero__inner">
      <p class="eyebrow hero__eyebrow">Together with their families</p>
      <h1 class="hero__names" id="hero-title">
        <span>${esc(pub.couple.partner_one)}</span>
        <span class="hero__amp" aria-hidden="true">&amp;</span><span class="visually-hidden"> and </span>
        <span>${esc(pub.couple.partner_two)}</span>
      </h1>
      <div class="hero__facts">
        <p class="hero__fact">${icon('calendar')}<span>${esc(range)}</span></p>
        <p class="hero__fact">${icon('pin')}<span>${esc(venueLine)}</span></p>
      </div>
      <p class="hero__countdown" data-countdown data-start="${esc(pub.event_dates[0])}" data-end="${esc(pub.event_dates[pub.event_dates.length - 1])}" hidden></p>
      <nav class="quick-actions" aria-label="Quick actions">
        <a class="quick" href="#schedule">
          <span class="quick__icon">${icon('calendar')}</span>
          <span class="quick__text"><span class="quick__label">View schedule</span><span class="quick__hint">${pub.days.reduce((n, d) => n + d.items.length, 0)} functions over ${pub.days.length} days</span></span>
          ${icon('arrow')}
        </a>
        <a class="quick" href="#venue">
          <span class="quick__icon">${icon('pin')}</span>
          <span class="quick__text"><span class="quick__label">Get directions</span><span class="quick__hint">${pub.venue.maps_url ? esc(pub.venue.name) : 'Map link coming soon'}</span></span>
          ${icon('arrow')}
        </a>
        <a class="quick" href="#updates">
          <span class="quick__icon">${icon('bell')}</span>
          <span class="quick__text"><span class="quick__label">Latest update</span><span class="quick__hint">${latest ? esc(latest.title) : 'No updates yet'}</span></span>
          ${icon('arrow')}
        </a>
      </nav>
    </div>
  </section>
${renderSchedule(pub)}
${renderVenue(pub)}
${renderUpdates(pub)}
${renderHelp(pub)}
  </main>

  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p class="site-footer__names">${esc(couple)}</p>
      <p>${esc(range)} · ${esc(venueLine)}</p>
      ${preview ? `<p class="site-footer__meta">Local preview · built ${esc(generatedAt.toISOString().slice(0, 10))}</p>` : ''}
    </div>
  </footer>
  <template id="share-message">${esc(shareText)}</template>
</body>
</html>
`;
}
