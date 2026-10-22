// Renders the public site from the filtered public data object only.
// Never pass raw event data to this module — see public-data.mjs.
import { dateRange as enDateRange, dayMonth as enDayMonth, shortDay as enShortDay } from './format.mjs';
import { LANGUAGES, langDir, languageNames } from './i18n.mjs';

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Features the hosted site supports. The claude.ai preview frame blocks file
// downloads, printing, embedded maps and the share sheet, so the preview
// build turns those off (see renderPage's `embedded` option).
let features = { downloads: true, print: true, mapEmbeds: true, shareSheet: true };

// The language being rendered (see i18n.mjs), set at the start of renderPage.
// t() returns interface text, tc() translates event content, F formats dates.
let L;
let F;
const t = (key, vars) => L.t(key, vars);
const tc = (text) => L.tc(text);

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
  <symbol id="i-map" viewBox="0 0 24 24"><path d="m9 4.5-5 2v13l5-2 6 2 5-2v-13l-5 2-6-2Zm0 0v13m6-11v13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
  <symbol id="i-bed" viewBox="0 0 24 24"><path d="M3.5 18.5V6m0 7.5h17v5m-17-2h17M7.5 10.5h3.5V13.5h-5v-1.5a1.5 1.5 0 0 1 1.5-1.5ZM13 10.5h5a2.5 2.5 0 0 1 2.5 2.5v.5H13v-3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-car" viewBox="0 0 24 24"><path d="M5 16.5v2M19 16.5v2M4 16.5h16v-4l-2-5.5H6L4 12.5v4ZM4 12.5h16M7.5 14.5h.01M16.5 14.5h.01" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m8.5 12.2 2.4 2.3 4.6-4.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-shirt" viewBox="0 0 24 24"><path d="M9 4.5 4 7l1.8 4 2.2-1v9.5h8V10l2.2 1L20 7l-5-2.5a3 3 0 0 1-6 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
  <symbol id="i-send" viewBox="0 0 24 24"><path d="M20.5 3.5 10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4 17-6.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></symbol>
  <symbol id="i-id" viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="11" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.8 15.5c.5-1.3 1.5-2 2.7-2s2.2.7 2.7 2M13.5 10h4.5M13.5 13.5h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
</svg>`;

const pending = (label = t('pending')) =>
  `<span class="pill pill--pending"><span class="pill__dot" aria-hidden="true"></span>${esc(label)}</span>`;

const statusPill = (status) =>
  status === 'provisional'
    ? `<span class="pill pill--provisional">${esc(t('provisional'))}</span>`
    : `<span class="pill pill--confirmed">${esc(t('confirmed'))}</span>`;

/** Attach "Available throughout 20 November"-style services to that day. */
function servicesByDay(pub) {
  const perDay = new Map(pub.event_dates.map((d) => [d, []]));
  const general = [];
  for (const service of pub.guestServices) {
    const day = pub.event_dates.find((d) => service.availability === `Available throughout ${enDayMonth(d)}`);
    if (day) perDay.get(day).push(t('serviceAllDay', { name: tc(service.name) }));
    else general.push(`${tc(service.name)}: ${tc(service.availability)}`);
  }
  return { perDay, general };
}

function renderItem(item) {
  const { clock, meridiem } = F.splitTime(item.start_time);
  const start = F.formatTime(item.start_time);
  const timing = item.end_time
    ? t('timeOnwardsEnds', { start, end: F.formatTime(item.end_time) })
    : item.onwards ? t('timeOnwards', { start }) : start;
  let location = '';
  if (item.location) {
    location = `<p class="event__meta">${icon('pin')}<span>${esc(tc(item.location))}${item.address ? `<span class="event__address">${esc(tc(item.address))}</span>` : ''}</span></p>`;
  } else if (item.location_needed) {
    location = `<p class="event__meta event__meta--pending">${icon('pin')}<span>${esc(t('areaTbc'))}</span></p>`;
  }
  const map = item.maps_url || item.maps_embed_url
    ? `${item.maps_label ? `<p class="event__maplabel">${esc(tc(item.maps_label))}</p>` : ''}${mapBlock({ title: tc(item.location ?? item.title), mapsUrl: item.maps_url, embedUrl: item.maps_embed_url, compact: true })}`
    : '';

  return `
        <li class="event" data-schedule-item="${esc(item.id)}" data-start="${esc(`${item.date}T${item.start_time}`)}">
          <div class="event__time" aria-hidden="true">
            <span class="event__clock">${esc(clock)}</span>
            <span class="event__meridiem">${esc(meridiem)}</span>
          </div>
          <div class="event__marker" aria-hidden="true"></div>
          <div class="event__body">
            <div class="event__head">
              <h4 class="event__title">${esc(tc(item.title))}</h4>
              ${statusPill(item.timing_status)}
            </div>
            ${item.offsite ? `<p class="event__offsite">${esc(t('separateVenue'))}</p>` : ''}
            <p class="event__timing${item.end_time ? ' event__timing--strong' : item.onwards ? '' : ' visually-hidden'}">${esc(timing)}</p>
            ${location}
            ${map}
            ${item.attire ? `<p class="event__meta">${icon('shirt')}<span>${esc(tc(item.attire))}</span></p>` : ''}
            <span class="event__next" hidden>${esc(t('upNext'))}</span>
          </div>
        </li>`;
}

const scheduleTitle = (n) =>
  n === 1 ? t('scheduleTitleOne') : t('scheduleTitle', { count: L.ui.numberWords[n] ?? n });

function renderSchedule(pub) {
  const { perDay, general } = servicesByDay(pub);
  const tabs = pub.days
    .map((day, i) => {
      const s = F.shortDay(day.date);
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
          <p class="day__index">${esc(t('dayIndex', { n: i + 1 }))}</p>
          <h3 class="day__title" id="day-title-${day.date}">${esc(F.longDay(day.date))}</h3>
        </header>
        ${services}
        <ol class="timeline" aria-label="${esc(t('eventsOn', { day: F.longDay(day.date) }))}">${day.items.map(renderItem).join('')}
        </ol>
      </section>`;
    })
    .join('');

  const generalServices = general.length
    ? `<div class="services-general">${general.map((x) => `<p class="service">${icon('cup')}<span>${esc(x)}</span></p>`).join('')}</div>`
    : '';

  const MARK = '\u0000provisional\u0000';
  const lede = esc(t('scheduleLede', { provisional: MARK })).replace(MARK, `<em>${esc(t('provisional'))}</em>`);

  return `
  <section class="section" id="schedule" aria-labelledby="schedule-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">${esc(t('scheduleEyebrow'))}</p>
        <h2 class="section__title" id="schedule-title">${esc(scheduleTitle(pub.days.length))}</h2>
        <p class="section__lede">${lede}</p>
      </header>
      <div class="tabs" role="tablist" aria-label="${esc(t('chooseDay'))}" hidden>${tabs}
      </div>
      <div class="days">${panels}
      </div>
      ${generalServices}
      ${features.downloads || features.print ? `<div class="schedule-actions">
        ${features.downloads ? `<a class="btn btn--ghost" href="schedule.ics" download>${icon('download')}<span>${esc(t('addToCalendar'))}</span></a>` : ''}
        ${features.print ? `<button class="btn btn--ghost" type="button" data-action="print" hidden>${icon('print')}<span>${esc(t('printSchedule'))}</span></button>` : ''}
      </div>` : ''}
    </div>
  </section>`;
}

function mapBlock({ title, mapsUrl, embedUrl: rawEmbedUrl, compact = false }) {
  const embedUrl = features.mapEmbeds ? rawEmbedUrl : null;
  if (!mapsUrl && !embedUrl) return '';
  const showLabel = t(compact ? 'showMap' : 'showMapHere');
  return `
          <div class="map">
            ${embedUrl ? `<div class="map__frame" data-map-frame hidden></div>` : ''}
            <div class="map__actions">
              ${mapsUrl ? `<a class="btn btn--primary" href="${esc(mapsUrl)}" target="_blank" rel="noopener">${icon('pin')}<span>${esc(t(compact ? 'openInMaps' : 'openInGoogleMaps'))}</span></a>` : ''}
              ${embedUrl ? `<button class="btn btn--ghost" type="button" data-map-src="${esc(embedUrl)}" data-map-title="${esc(t('mapTitle', { place: title }))}" data-label="${esc(showLabel)}" hidden>${icon('map')}<span>${esc(showLabel)}</span></button>` : ''}
            </div>
          </div>`;
}

function renderVenue(pub) {
  const { venue } = pub;
  const knownAreas = pub.days.flatMap((d) => d.items).filter((i) => i.location);
  const pendingAreas = pub.days.flatMap((d) => d.items).filter((i) => !i.location && i.location_needed);
  const uniquePendingTitles = [...new Set(pendingAreas.map((i) => tc(i.title)))];

  let address;
  if (venue.address) address = `<p class="detail__value">${esc(tc(venue.address))}</p>`;
  else if (venue.landmark) {
    address = `<p class="detail__value detail__value--lead">${esc([tc(venue.landmark), tc(venue.locality)].filter(Boolean).join(', '))}</p>
          <p class="detail__note">${esc(t('postalToFollow'))}</p>`;
  } else address = `<p class="detail__value detail__value--pending">${esc(t('addressAwaiting'))}</p>`;

  const directions = venue.maps_url || venue.maps_embed_url
    ? `${venue.maps_label ? `<p class="detail__value">${esc(tc(venue.maps_label))}</p>` : ''}${mapBlock({ title: [venue.name, tc(venue.landmark)].filter(Boolean).join(', '), mapsUrl: venue.maps_url, embedUrl: venue.maps_embed_url })}`
    : `<p class="detail__value detail__value--pending">${esc(t('mapPending'))}</p>`;

  return `
  <section class="section" id="venue" aria-labelledby="venue-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">${esc(t('venueEyebrow'))}</p>
        <h2 class="section__title" id="venue-title">${esc(tc(venue.name))}</h2>
        ${venue.locality ? `<p class="section__lede">${esc(tc(venue.locality))}</p>` : ''}
      </header>
      <div class="card venue-card">
        <div class="detail">
          <div class="detail__label"><span>${esc(t('address'))}</span>${venue.address || venue.landmark ? '' : pending()}</div>
          ${address}
        </div>
        <div class="detail">
          <div class="detail__label"><span>${esc(t('mapAndDirections'))}</span>${venue.maps_url ? '' : pending()}</div>
          ${directions}
        </div>
        <div class="detail">
          <div class="detail__label"><span>${esc(t('whereThingsHappen'))}</span>${uniquePendingTitles.length ? pending(t('partlyPending')) : ''}</div>
          <ul class="areas">
            ${knownAreas.map((i) => `<li><span class="areas__event">${esc(tc(i.title))}</span><span class="areas__place">${esc([tc(i.location), tc(i.address)].filter(Boolean).join(' · '))}</span></li>`).join('')}
            ${uniquePendingTitles.length ? `<li class="areas__pending"><span class="areas__event">${esc(uniquePendingTitles.join(', '))}</span><span class="areas__place">${esc(t('areasTbc'))}</span></li>` : ''}
          </ul>
        </div>
      </div>
    </div>
  </section>`;
}

function renderStay(stay, venueName) {
  const atVenue = stay.name === venueName;
  return `
        <li class="card stay">
          <div class="stay__head">
            <span class="stay__icon">${icon('bed')}</span>
            <div>
              <h4 class="stay__name">${esc(tc(stay.name))}</h4>
              ${stay.note ? `<p class="stay__note">${esc(tc(stay.note))}</p>` : ''}
            </div>
          </div>
          ${atVenue && !stay.maps_url
            ? `<div class="map__actions"><a class="btn btn--ghost" href="#venue">${icon('pin')}<span>${esc(t('seeVenueDetails'))}</span></a></div>`
            : mapBlock({ title: tc(stay.name), mapsUrl: stay.maps_url, embedUrl: stay.maps_embed_url })}
        </li>`;
}

function renderTravel(pub) {
  const { stays, transport } = pub.travel;
  const guests = stays.filter((s) => s.audience === 'guests');
  const barat = stays.filter((s) => s.audience === 'barat');
  const group = (title, list) => list.length
    ? `<h3 class="subhead">${esc(title)}</h3>
      <ul class="stays">${list.map((s) => renderStay(s, pub.venue.name)).join('')}
      </ul>`
    : '';
  const statusPillHtml = transport.status === 'pending' ? pending(t('timingsSoon'))
    : transport.status === 'tentative' ? pending(t('tentative')) : '';

  return `
  <section class="section" id="travel" aria-labelledby="travel-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">${esc(t('travelEyebrow'))}</p>
        <h2 class="section__title" id="travel-title">${esc(t('travelTitle'))}</h2>
      </header>
      <div class="card transport">
        <div class="detail__label"><span>${esc(t('gettingAround'))}</span>${statusPillHtml}</div>
        <div class="transport__body">
          <span class="stay__icon">${icon('car')}</span>
          <div>
            ${transport.destinations.length ? `<p class="transport__lead">${esc(t('vehiclesTo'))}</p>
            <ul class="chips">${transport.destinations.map((d) => `<li class="chip">${esc(tc(d))}</li>`).join('')}</ul>` : ''}
            ${transport.timings.length ? `<ul class="timings">${transport.timings
              .map((x) => `<li><span class="timings__label">${esc(tc(x.label))}</span><span class="timings__time">${esc(F.formatTime(x.from))} – ${esc(F.formatTime(x.to))}${x.tentative ? ` <em>${esc(t('tentativeParen'))}</em>` : ''}</span></li>`)
              .join('')}</ul>` : ''}
            ${transport.note ? `<p class="transport__note">${esc(tc(transport.note))}</p>` : ''}
          </div>
        </div>
      </div>
      ${group(t('whereGuestsStay'), guests)}
      ${group(t('forBarat'), barat)}
      ${aadhaarNote(pub)}
    </div>
  </section>`;
}

function comingSoon({ iconName, title, text }) {
  return `<div class="card empty">
        <span class="empty__icon">${icon(iconName)}</span>
        <div>
          <div class="empty__row"><h3 class="empty__title">${esc(title)}</h3>${pending(t('toBeAnnounced'))}</div>
          <p class="empty__text">${esc(text)}</p>
        </div>
      </div>`;
}

// The RSVP form is shown in the guest's language, but the values it sends
// (and the WhatsApp message app.js composes) stay in English, so every RSVP
// reaching the family reads the same way.
function rsvpForm(pub) {
  const { rsvp } = pub;
  const coupleEn = `${pub.couple.partner_one} & ${pub.couple.partner_two}`;
  const days = pub.event_dates;
  const rangeEn = enDateRange(days);
  const checkbox = (name, value, label) => `
              <label class="choice">
                <input type="checkbox" name="${name}" value="${esc(value)}" checked>
                <span>${esc(label)}</span>
              </label>`;
  const arrivalDays = [
    [`Before ${enDayMonth(days[0])}`, t('beforeDay', { day: F.shortDay(days[0]).label })],
    ...days.slice(0, -1).map((d) => [`${enShortDay(d).weekday}, ${enDayMonth(d)}`, `${F.shortDay(d).weekday}, ${F.shortDay(d).label}`]),
  ];
  const travelModes = [['Train', 'travelTrain'], ['Bus', 'travelBus'], ['Car / taxi', 'travelCar'], ['Other', 'travelOther']];
  const radio = (name, value, label, checked, required = false) => `
              <label class="choice">
                <input type="radio" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}${required ? ' required' : ''}>
                <span>${esc(label)}</span>
              </label>`;
  const wa = `91${rsvp.whatsapp_number}`;
  const fallbackText = `Hi! RSVP for ${coupleEn}’s wedding (${rangeEn}).\nName:\nNumber of guests:\nHotel room needed (Yes/No):\nETA (day and time):\nMode of travel:`;

  return `
      <form class="card rsvp-form" data-rsvp-form data-wa-url="https://wa.me/${esc(wa)}" data-couple="${esc(coupleEn)}" data-dates="${esc(rangeEn)}" hidden>
        <div class="field">
          <label class="field__label" for="rsvp-name">${esc(t('yourName'))}</label>
          <input class="input" id="rsvp-name" name="name" type="text" autocomplete="name" required maxlength="80" placeholder="${esc(t('fullNamePlaceholder'))}">
        </div>
        <div class="field">
          <label class="field__label" for="rsvp-guests">${esc(t('guestsLabel'))} <span class="field__hint">${esc(t('guestsHint'))}</span></label>
          <div class="stepper">
            <button type="button" class="stepper__btn" data-step="-1" aria-label="${esc(t('oneFewerGuest'))}">−</button>
            <input class="input stepper__input" id="rsvp-guests" name="guests" type="number" inputmode="numeric" min="1" max="30" value="1" required>
            <button type="button" class="stepper__btn" data-step="1" aria-label="${esc(t('oneMoreGuest'))}">+</button>
          </div>
        </div>
        <fieldset class="field">
          <legend class="field__label">${esc(t('daysLabel'))} <span class="field__hint">${esc(t('daysHint'))}</span></legend>
          <div class="choices" data-days>${days.map((d) => checkbox('days', `${enShortDay(d).weekday} ${enShortDay(d).label}`, `${F.shortDay(d).weekday}, ${F.shortDay(d).label}`)).join('')}
          </div>
        </fieldset>
        <fieldset class="field">
          <legend class="field__label">${esc(t('roomQuestion'))}</legend>
          <div class="choices">${radio('room', 'Yes', t('yesPlease'), true)}${radio('room', 'No', t('noThanks'), false)}
          </div>
        </fieldset>
        <div class="field" data-rooms>
          <label class="field__label" for="rsvp-rooms">${esc(t('roomsNeeded'))}</label>
          <div class="stepper">
            <button type="button" class="stepper__btn" data-step="-1" aria-label="${esc(t('oneFewerRoom'))}">−</button>
            <input class="input stepper__input" id="rsvp-rooms" name="rooms" type="number" inputmode="numeric" min="1" max="10" value="1">
            <button type="button" class="stepper__btn" data-step="1" aria-label="${esc(t('oneMoreRoom'))}">+</button>
          </div>
        </div>
        <fieldset class="field">
          <legend class="field__label">${esc(t('etaLabel'))} <span class="field__hint">${esc(t('etaHint'))}</span></legend>
          <div class="choices">${arrivalDays.map(([value, label], i) => radio('eta_day', value, label, i === 1)).join('')}
          </div>
          <label class="visually-hidden" for="rsvp-eta-time">${esc(t('arrivalTime'))}</label>
          <div class="eta-time">
            <input class="input" id="rsvp-eta-time" name="eta_time" type="time" step="900">
            <span class="field__hint">${esc(t('etaTimeHint'))}</span>
          </div>
        </fieldset>
        <fieldset class="field">
          <legend class="field__label">${esc(t('travelLabel'))}</legend>
          <div class="choices">${travelModes.map(([value, key], i) => radio('travel', value, t(key), false, i === 0)).join('')}
          </div>
          <label class="visually-hidden" for="rsvp-travel-details">${esc(t('travelDetails'))}</label>
          <input class="input" id="rsvp-travel-details" name="travel_details" type="text" maxlength="100" placeholder="${esc(t('travelDetailsPlaceholder'))}">
        </fieldset>
        <div class="field">
          <label class="field__label" for="rsvp-note">${esc(t('anythingElse'))} <span class="field__hint">${esc(t('optional'))}</span></label>
          <textarea class="input" id="rsvp-note" name="note" rows="2" maxlength="300" placeholder="${esc(t('notePlaceholder'))}"></textarea>
        </div>
        <a class="btn btn--primary btn--block" data-rsvp-send href="https://wa.me/${esc(wa)}?text=${esc(encodeURIComponent(fallbackText))}" target="_blank" rel="noopener">${icon('send')}<span>${esc(t('sendRsvp'))}</span></a>
        <p class="rsvp__fine">${esc(t('rsvpFine'))}</p>
      </form>
      <div class="card rsvp-fallback" data-rsvp-fallback>
        <p>${esc(t('rsvpFallback'))}</p>
        <a class="btn btn--primary" href="https://wa.me/${esc(wa)}?text=${esc(encodeURIComponent(fallbackText))}" target="_blank" rel="noopener">${icon('send')}<span>${esc(t('rsvpOnWhatsapp'))}</span></a>
      </div>`;
}

const aadhaarNote = (pub) => pub.travel.check_in_note
  ? `<div class="callout">${icon('id')}<p><strong>${esc(t('stayingAtHotel'))}</strong> ${esc(tc(pub.travel.check_in_note))}</p></div>`
  : '';

function renderRsvp(pub) {
  const { rsvp } = pub;
  const deadline = rsvp.deadline ? t('rsvpDeadline', { date: F.longDay(rsvp.deadline) }) : '';
  let body;
  if (rsvp.status === 'confirmed' && rsvp.method === 'whatsapp' && rsvp.whatsapp_number) body = rsvpForm(pub);
  else if (rsvp.status === 'confirmed' && rsvp.url) {
    body = `<div class="card rsvp">
        <a class="btn btn--primary" href="${esc(rsvp.url)}" target="_blank" rel="noopener">${icon('check')}<span>${esc(t('rsvpNow'))}</span></a>
      </div>`;
  } else body = comingSoon({ iconName: 'check', title: t('rsvpOpensSoon'), text: t('rsvpOpensSoonText') });

  return `
  <section class="section" id="rsvp" aria-labelledby="rsvp-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">${esc(t('rsvpEyebrow'))}</p>
        <h2 class="section__title" id="rsvp-title">${esc(t('rsvpTitle'))}</h2>
        ${deadline || rsvp.note ? `<p class="section__lede">${deadline ? `<strong class="deadline">${esc(deadline)}</strong> ` : ''}${esc(tc(rsvp.note) ?? '')}</p>` : ''}
      </header>
      ${body}
      ${aadhaarNote(pub)}
    </div>
  </section>`;
}

function renderDressCode(pub) {
  const { dressCode } = pub;
  const body = dressCode.items.length
    ? `<ul class="dress">${dressCode.items
        .map((i) => `
        <li class="dress__item">
          <span class="stay__icon">${icon('shirt')}</span>
          <div><p class="dress__label">${esc(tc(i.label))}</p><p class="dress__guidance">${esc(tc(i.guidance))}</p></div>
        </li>`)
        .join('')}
      </ul>`
    : comingSoon({ iconName: 'shirt', title: t('dressTba'), text: t('dressTbaText') });
  return `
  <section class="section" id="dress-code" aria-labelledby="dress-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">${esc(t('dressEyebrow'))}</p>
        <h2 class="section__title" id="dress-title">${esc(t('dressTitle'))}</h2>
      </header>
      ${body}
    </div>
  </section>`;
}

function renderUpdates(pub) {
  const list = pub.updates.length
    ? `<ol class="updates">${pub.updates
        .map(
          (u, i) => `
        <li class="update${i === 0 ? ' update--latest' : ''}">
          <div class="update__meta">${i === 0 ? `<span class="pill pill--accent">${esc(t('latest'))}</span>` : ''}<time datetime="${esc(u.posted_at)}">${esc(F.formatPostedAt(u.posted_at))}</time></div>
          <h3 class="update__title">${esc(tc(u.title))}</h3>
          <p class="update__message">${esc(tc(u.message))}</p>
        </li>`,
        )
        .join('')}
      </ol>`
    : `<div class="card empty">
        <span class="empty__icon">${icon('bell')}</span>
        <div>
          <h3 class="empty__title">${esc(t('noUpdates'))}</h3>
          <p class="empty__text">${esc(t('noUpdatesText'))}</p>
        </div>
      </div>`;

  return `
  <section class="section" id="updates" aria-labelledby="updates-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">${esc(t('updatesEyebrow'))}</p>
        <h2 class="section__title" id="updates-title">${esc(t('updatesTitle'))}</h2>
      </header>
      ${list}
      <div class="card share" id="share">
        <div class="share__copy">
          <h3 class="share__title">${esc(t('shareTitle'))}</h3>
          <p class="share__text">${esc(t('shareText'))}</p>
        </div>
        <div class="share__actions">
          ${features.shareSheet ? `<button class="btn btn--primary" type="button" data-action="share" hidden>${icon('share')}<span>${esc(t('share'))}</span></button>` : ''}
          <button class="btn btn--ghost" type="button" data-action="copy" hidden>${icon('copy')}<span>${esc(t('copyMessage'))}</span></button>
        </div>
        <p class="share__status" role="status" aria-live="polite"></p>
      </div>
    </div>
  </section>`;
}

const offsiteNote = (pub) => pub.days
  .flatMap((d) => d.items.filter((i) => i.offsite).map((i) => ` ${t('faqOffsite', {
    title: tc(i.title),
    day: F.shortDay(i.date).label,
    place: [tc(i.location), tc(i.address)].filter(Boolean).join(', '),
  })}`))
  .join('');

const formatPhone = (p) => `${p.slice(0, 5)} ${p.slice(5)}`;

function renderHelp(pub) {
  const venueAddress = tc(pub.venue.address) ?? [tc(pub.venue.landmark), tc(pub.venue.locality)].filter(Boolean).join(', ');
  const faqs = [
    [t('faqWhenWhereQ'), `${t('faqWhenWhereA', { range: F.dateRange(pub.event_dates), venue: tc(pub.venue.name), address: venueAddress })}${offsiteNote(pub)}`],
    [t('faqStationQ'), tc(pub.travel.transport.note) || t('transportSoon')],
    ...(pub.rsvp.deadline ? [[t('faqRsvpQ'), t('faqRsvpA', { date: F.longDay(pub.rsvp.deadline) })]] : []),
    ...(pub.travel.check_in_note ? [[t('faqIdQ'), tc(pub.travel.check_in_note)]] : []),
    [t('faqChangesQ'), t('faqChangesA')],
    ...(features.downloads ? [[t('faqCalendarQ'), t('faqCalendarA')]] : []),
  ];
  const contacts = pub.contacts.length
    ? `<ul class="contacts">${pub.contacts
        .map(
          (c) => `
          <li class="contact">
            <span class="contact__avatar" aria-hidden="true">${esc(c.name[0])}</span>
            <div class="contact__info">
              <p class="contact__name">${esc(c.name)}</p>
              <div class="contact__phones">${c.phones
                .map((p) => `<a class="contact__call" href="tel:+91${esc(p)}" aria-label="${esc(t('callAria', { name: c.name, phone: formatPhone(p) }))}">${icon('phone')}<span>${esc(formatPhone(p))}</span></a>`)
                .join('')}</div>
            </div>
          </li>`,
        )
        .join('')}
        </ul>`
    : `<p class="contact__body">${icon('phone')}<span>${esc(t('contactPending'))}</span></p>`;
  return `
  <section class="section" id="help" aria-labelledby="help-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">${esc(t('helpEyebrow'))}</p>
        <h2 class="section__title" id="help-title">${esc(t('helpTitle'))}</h2>
        <p class="section__lede">${esc(t('helpLede'))}</p>
      </header>
      <div class="help-grid">
        <div class="card contacts-card">
          <div class="detail__label"><span>${esc(t('onDayContacts'))}</span>${pub.contacts.length ? '' : pending()}</div>
          ${contacts}
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

/** Link to the same page in another language, relative to the current page. */
const hrefFor = (code) => `${L.code === 'en' ? '' : '../'}${langDir(code)}` || './';

function languageSwitcher(extraClass, names) {
  return `<nav class="lang ${extraClass}" aria-label="${esc(t('languageNav'))}">${LANGUAGES
    .map((code) => (code === L.code
      ? `<span class="lang__item" aria-current="true" lang="${code}">${esc(names[code])}</span>`
      : `<a class="lang__item" href="${hrefFor(code)}" hreflang="${code}" lang="${code}" data-lang="${code}">${esc(names[code])}</a>`))
    .join('')}</nav>`;
}

// Strings app.js needs at runtime, in the page's language.
const SCRIPT_STRINGS = ['daysToGo', 'tomorrow', 'happeningToday', 'hideMap', 'copied', 'copyFailed', 'tickOneDay'];

export function renderPage(pub, { lang, generatedAt, preview, embedded = false, inlineCss = '', inlineJs = '' }) {
  L = lang;
  F = lang.fmt;
  features = embedded
    ? { downloads: false, print: false, mapEmbeds: false, shareSheet: false }
    : { downloads: true, print: true, mapEmbeds: true, shareSheet: true };
  const names = languageNames();
  const base = L.code === 'en' ? '' : '../';
  const p1 = tc(pub.couple.partner_one);
  const p2 = tc(pub.couple.partner_two);
  const couple = `${p1} & ${p2}`;
  const range = F.dateRange(pub.event_dates);
  const venueLine = [tc(pub.venue.name), tc(pub.venue.locality)].filter(Boolean).join(', ');
  const latest = pub.updates[0];
  const functionCount = pub.days.reduce((n, d) => n + d.items.length, 0);
  const monogram = `${pub.couple.partner_one[0]}&amp;${pub.couple.partner_two[0]}`;
  const scriptStrings = Object.fromEntries(SCRIPT_STRINGS.map((k) => [k, t(k)]));
  const content = `
${ICONS}
  <a class="skip-link" href="#main">${esc(t('skipToContent'))}</a>
  ${preview ? `<div class="preview-bar" role="note">${esc(t('previewBar'))}</div>` : ''}
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="monogram" href="#top" aria-label="${esc(t('backToTop', { couple }))}">${monogram}</a>
      <nav class="nav" aria-label="${esc(t('sectionsNav'))}">
        <a href="#schedule">${esc(t('navSchedule'))}</a>
        <a href="#venue">${esc(t('navVenue'))}</a>
        <a href="#travel">${esc(t('navTravel'))}</a>
        <a href="#rsvp">${esc(t('navRsvp'))}</a>
        <a href="#dress-code">${esc(t('navDress'))}</a>
        <a href="#updates">${esc(t('navUpdates'))}</a>
        <a href="#help">${esc(t('navHelp'))}</a>
      </nav>
    </div>
  </header>

  <main id="main">
  <section class="hero" id="top" aria-labelledby="hero-title">
    <div class="container hero__inner">
      ${embedded ? '' : languageSwitcher('lang--hero', names)}
      <p class="eyebrow hero__eyebrow">${esc(t('heroEyebrow'))}</p>
      <h1 class="hero__names" id="hero-title">
        <span>${esc(p1)}</span>
        <span class="hero__amp" aria-hidden="true">&amp;</span><span class="visually-hidden"> ${esc(t('and'))} </span>
        <span>${esc(p2)}</span>
      </h1>
      <div class="hero__facts">
        <p class="hero__fact">${icon('calendar')}<span>${esc(range)}</span></p>
        <p class="hero__fact">${icon('pin')}<span>${esc(venueLine)}</span></p>
      </div>
      <p class="hero__countdown" data-countdown data-start="${esc(pub.event_dates[0])}" data-end="${esc(pub.event_dates[pub.event_dates.length - 1])}" hidden></p>
      <nav class="quick-actions" aria-label="${esc(t('quickActions'))}">
        <a class="quick" href="#schedule">
          <span class="quick__icon">${icon('calendar')}</span>
          <span class="quick__text"><span class="quick__label">${esc(t('viewSchedule'))}</span><span class="quick__hint">${esc(t('functionsOverDays', { functions: functionCount, days: pub.days.length }))}</span></span>
          ${icon('arrow')}
        </a>
        <a class="quick quick--primary" href="#rsvp">
          <span class="quick__icon">${icon('send')}</span>
          <span class="quick__text"><span class="quick__label">${esc(t('rsvp'))}</span><span class="quick__hint">${pub.rsvp.deadline ? esc(t('replyBy', { date: F.dayMonth(pub.rsvp.deadline) })) : esc(t('opensSoon'))}</span></span>
          ${icon('arrow')}
        </a>
        <a class="quick" href="#venue">
          <span class="quick__icon">${icon('pin')}</span>
          <span class="quick__text"><span class="quick__label">${esc(t('getDirections'))}</span><span class="quick__hint">${pub.venue.landmark ? esc(tc(pub.venue.landmark)) : pub.venue.maps_url ? esc(tc(pub.venue.name)) : esc(t('mapComingSoon'))}</span></span>
          ${icon('arrow')}
        </a>
        <a class="quick" href="#updates">
          <span class="quick__icon">${icon('bell')}</span>
          <span class="quick__text"><span class="quick__label">${esc(t('latestUpdate'))}</span><span class="quick__hint">${latest ? esc(tc(latest.title)) : esc(t('noUpdatesYet'))}</span></span>
          ${icon('arrow')}
        </a>
      </nav>
    </div>
  </section>
${renderSchedule(pub)}
${renderVenue(pub)}
${renderTravel(pub)}
${renderRsvp(pub)}
${renderDressCode(pub)}
${renderUpdates(pub)}
${renderHelp(pub)}
  </main>

  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p class="site-footer__names">${esc(couple)}</p>
      <p>${esc(range)} · ${esc(venueLine)}</p>
      ${embedded ? '' : languageSwitcher('lang--footer', names)}
      ${preview ? `<p class="site-footer__meta">${esc(t('previewBuilt', { date: generatedAt.toISOString().slice(0, 10) }))}</p>` : ''}
    </div>
  </footer>
  <template id="share-message">${esc(t('shareMessage', { couple, range, venue: venueLine, url: '{url}' }))}</template>
  <script type="application/json" id="i18n-strings">${JSON.stringify(scriptStrings).replace(/</g, '\\u003c')}</script>
`;

  if (embedded) {
    // Fragment for the claude.ai preview: the host supplies the document
    // skeleton, so CSS and JS are inlined and no <html>/<head> is emitted.
    return `<title>${esc(couple)}’s Wedding</title>
<style>
${inlineCss}
</style>
<script>document.documentElement.classList.add('js')</script>
${content}
<script>
${inlineJs}
</script>
`;
  }

  // On the English page, send guests who chose another language before
  // straight to it. Each language page records the choice in app.js.
  const redirect = L.code === 'en'
    ? `<script>try{var l=localStorage.getItem('lang');if(l==='hi'||l==='bn')location.replace(l+'/'+location.hash)}catch(e){}</script>`
    : '';

  return `<!doctype html>
<html lang="${esc(L.htmlLang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  ${redirect}
  <title>${esc(t('metaTitle', { couple, range }))}</title>
  <meta name="description" content="${esc(t('metaDescription', { couple, range, venue: venueLine }))}">
  <meta name="robots" content="noindex, nofollow">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(t('ogTitle', { couple, range }))}">
  <meta property="og:description" content="${esc(t('ogDescription', { venue: venueLine }))}">
  ${LANGUAGES.map((code) => `<link rel="alternate" hreflang="${code}" href="${hrefFor(code)}">`).join('\n  ')}
  <meta name="theme-color" content="#faf8f5">
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='#1d1b19'/><text x='32' y='41' font-family='Georgia,serif' font-size='26' fill='#fff' text-anchor='middle'>${pub.couple.partner_one[0]}&amp;${pub.couple.partner_two[0]}</text></svg>`)}">
  <link rel="stylesheet" href="${base}styles.css">
  <script>document.documentElement.classList.add('js')</script>
  <script src="${base}app.js" defer></script>
</head>
<body>
${content}</body>
</html>
`;
}
