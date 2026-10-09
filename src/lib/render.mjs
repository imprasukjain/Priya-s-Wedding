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

// Features the hosted site supports. The claude.ai preview frame blocks file
// downloads, printing, embedded maps and the share sheet, so the preview
// build turns those off (see renderPage's `embedded` option).
let features = { downloads: true, print: true, mapEmbeds: true, shareSheet: true };

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
            ${item.attire ? `<p class="event__meta">${icon('shirt')}<span>${esc(item.attire)}</span></p>` : ''}
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
      ${features.downloads || features.print ? `<div class="schedule-actions">
        ${features.downloads ? `<a class="btn btn--ghost" href="schedule.ics" download>${icon('download')}<span>Add to calendar</span></a>` : ''}
        ${features.print ? `<button class="btn btn--ghost" type="button" data-action="print" hidden>${icon('print')}<span>Print schedule</span></button>` : ''}
      </div>` : ''}
    </div>
  </section>`;
}

function mapBlock({ title, mapsUrl, embedUrl: rawEmbedUrl }) {
  const embedUrl = features.mapEmbeds ? rawEmbedUrl : null;
  if (!mapsUrl && !embedUrl) return '';
  return `
          <div class="map">
            ${embedUrl ? `<div class="map__frame" data-map-frame hidden></div>` : ''}
            <div class="map__actions">
              ${mapsUrl ? `<a class="btn btn--primary" href="${esc(mapsUrl)}" target="_blank" rel="noopener">${icon('pin')}<span>Open in Google Maps</span></a>` : ''}
              ${embedUrl ? `<button class="btn btn--ghost" type="button" data-map-src="${esc(embedUrl)}" data-map-title="${esc(`Map: ${title}`)}" hidden>${icon('map')}<span>Show map here</span></button>` : ''}
            </div>
          </div>`;
}

function renderVenue(pub) {
  const { venue } = pub;
  const knownAreas = pub.days.flatMap((d) => d.items).filter((i) => i.location);
  const pendingAreas = pub.days.flatMap((d) => d.items).filter((i) => !i.location);
  const uniquePendingTitles = [...new Set(pendingAreas.map((i) => i.title))];

  let address;
  if (venue.address) address = `<p class="detail__value">${esc(venue.address)}</p>`;
  else if (venue.landmark) {
    address = `<p class="detail__value detail__value--lead">${esc([venue.landmark, venue.locality].filter(Boolean).join(', '))}</p>
          <p class="detail__note">Full postal address to follow.</p>`;
  } else address = `<p class="detail__value detail__value--pending">Full address awaiting confirmation from the family and venue.</p>`;

  const directions = venue.maps_url || venue.maps_embed_url
    ? `${venue.maps_label ? `<p class="detail__value">${esc(venue.maps_label)}</p>` : ''}${mapBlock({ title: venue.landmark ? `${venue.name}, ${venue.landmark.toLowerCase()}` : venue.name, mapsUrl: venue.maps_url, embedUrl: venue.maps_embed_url })}`
    : `<p class="detail__value detail__value--pending">An approved map link will be added here.</p>`;

  return `
  <section class="section" id="venue" aria-labelledby="venue-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Venue</p>
        <h2 class="section__title" id="venue-title">${esc(venue.name)}</h2>
        ${venue.locality ? `<p class="section__lede">${esc(venue.locality)}</p>` : ''}
      </header>
      <div class="card venue-card">
        <div class="detail">
          <div class="detail__label"><span>Address</span>${venue.address || venue.landmark ? '' : pending()}</div>
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

function renderStay(stay, venueName) {
  const atVenue = stay.name === venueName;
  return `
        <li class="card stay">
          <div class="stay__head">
            <span class="stay__icon">${icon('bed')}</span>
            <div>
              <h4 class="stay__name">${esc(stay.name)}</h4>
              ${stay.note ? `<p class="stay__note">${esc(stay.note)}</p>` : ''}
            </div>
          </div>
          ${atVenue && !stay.maps_url
            ? `<div class="map__actions"><a class="btn btn--ghost" href="#venue">${icon('pin')}<span>See venue details</span></a></div>`
            : mapBlock({ title: stay.name, mapsUrl: stay.maps_url, embedUrl: stay.maps_embed_url })}
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

  return `
  <section class="section" id="travel" aria-labelledby="travel-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Travel &amp; stay</p>
        <h2 class="section__title" id="travel-title">Getting here &amp; staying over</h2>
      </header>
      <div class="card transport">
        <div class="detail__label"><span>Getting around</span>${transport.status === 'pending' ? pending('Timings soon') : ''}</div>
        <div class="transport__body">
          <span class="stay__icon">${icon('car')}</span>
          <div>
            ${transport.destinations.length ? `<p class="transport__lead">Vehicles from the venue to</p>
            <ul class="chips">${transport.destinations.map((d) => `<li class="chip">${esc(d)}</li>`).join('')}</ul>` : ''}
            ${transport.note ? `<p class="transport__note">${esc(transport.note)}</p>` : ''}
          </div>
        </div>
      </div>
      ${group('Where guests are staying', guests)}
      ${group('For the Barat', barat)}
      ${aadhaarNote(pub)}
    </div>
  </section>`;
}

function comingSoon({ iconName, title, text }) {
  return `<div class="card empty">
        <span class="empty__icon">${icon(iconName)}</span>
        <div>
          <div class="empty__row"><h3 class="empty__title">${esc(title)}</h3>${pending('To be announced')}</div>
          <p class="empty__text">${esc(text)}</p>
        </div>
      </div>`;
}

function rsvpForm(pub) {
  const { rsvp } = pub;
  const couple = `${pub.couple.partner_one} & ${pub.couple.partner_two}`;
  const days = pub.event_dates;
  const dayOptions = [
    ...(days.length > 1 ? [['All days', 'All days']] : []),
    ...days.map((d) => [`${dayMonth(d)} only`, `${shortDay(d).weekday}, ${shortDay(d).label} only`]),
  ];
  const radio = (name, value, label, checked) => `
              <label class="choice">
                <input type="radio" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}>
                <span>${esc(label)}</span>
              </label>`;
  const wa = `91${rsvp.whatsapp_number}`;
  const fallbackText = `Hi! RSVP for ${couple}’s wedding (${dateRange(days)}).\nName:\nNumber of guests:\nHotel room needed (Yes/No):`;

  return `
      <form class="card rsvp-form" data-rsvp-form data-wa-url="https://wa.me/${esc(wa)}" data-couple="${esc(couple)}" data-dates="${esc(dateRange(days))}" hidden>
        <div class="field">
          <label class="field__label" for="rsvp-name">Your name</label>
          <input class="input" id="rsvp-name" name="name" type="text" autocomplete="name" required maxlength="80" placeholder="Full name">
        </div>
        <div class="field">
          <label class="field__label" for="rsvp-guests">Number of guests <span class="field__hint">including you</span></label>
          <div class="stepper">
            <button type="button" class="stepper__btn" data-step="-1" aria-label="One fewer guest">−</button>
            <input class="input stepper__input" id="rsvp-guests" name="guests" type="number" inputmode="numeric" min="1" max="30" value="1" required>
            <button type="button" class="stepper__btn" data-step="1" aria-label="One more guest">+</button>
          </div>
        </div>
        <fieldset class="field">
          <legend class="field__label">Attending</legend>
          <div class="choices">${dayOptions.map(([value, label], i) => radio('days', value, label, i === 0)).join('')}
          </div>
        </fieldset>
        <fieldset class="field">
          <legend class="field__label">Do you need a hotel room?</legend>
          <div class="choices">${radio('room', 'Yes', 'Yes, please', true)}${radio('room', 'No', 'No, thanks', false)}
          </div>
        </fieldset>
        <div class="field" data-rooms>
          <label class="field__label" for="rsvp-rooms">Rooms needed</label>
          <div class="stepper">
            <button type="button" class="stepper__btn" data-step="-1" aria-label="One fewer room">−</button>
            <input class="input stepper__input" id="rsvp-rooms" name="rooms" type="number" inputmode="numeric" min="1" max="10" value="1">
            <button type="button" class="stepper__btn" data-step="1" aria-label="One more room">+</button>
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="rsvp-arrival">Arrival <span class="field__hint">optional</span></label>
          <input class="input" id="rsvp-arrival" name="arrival" type="text" maxlength="80" placeholder="e.g. 20 Nov morning, by train">
        </div>
        <div class="field">
          <label class="field__label" for="rsvp-note">Anything else? <span class="field__hint">optional</span></label>
          <textarea class="input" id="rsvp-note" name="note" rows="2" maxlength="300" placeholder="Names of guests, special requests…"></textarea>
        </div>
        <a class="btn btn--primary btn--block" data-rsvp-send href="https://wa.me/${esc(wa)}?text=${esc(encodeURIComponent(fallbackText))}" target="_blank" rel="noopener">${icon('send')}<span>Send RSVP on WhatsApp</span></a>
        <p class="rsvp__fine">This opens WhatsApp with your RSVP written for you — just press send. Nothing is stored on this website.</p>
      </form>
      <div class="card rsvp-fallback" data-rsvp-fallback>
        <p>Send your name, number of guests and whether you need a hotel room on WhatsApp.</p>
        <a class="btn btn--primary" href="https://wa.me/${esc(wa)}?text=${esc(encodeURIComponent(fallbackText))}" target="_blank" rel="noopener">${icon('send')}<span>RSVP on WhatsApp</span></a>
      </div>`;
}

const aadhaarNote = (pub) => pub.travel.check_in_note
  ? `<div class="callout">${icon('id')}<p><strong>Staying at a hotel?</strong> ${esc(pub.travel.check_in_note)}</p></div>`
  : '';

function renderRsvp(pub) {
  const { rsvp } = pub;
  const deadline = rsvp.deadline ? `Please RSVP by ${longDay(rsvp.deadline)}.` : '';
  let body;
  if (rsvp.status === 'confirmed' && rsvp.method === 'whatsapp' && rsvp.whatsapp_number) body = rsvpForm(pub);
  else if (rsvp.status === 'confirmed' && rsvp.url) {
    body = `<div class="card rsvp">
        <a class="btn btn--primary" href="${esc(rsvp.url)}" target="_blank" rel="noopener">${icon('check')}<span>RSVP now</span></a>
      </div>`;
  } else body = comingSoon({ iconName: 'check', title: 'RSVP opens soon', text: 'How to RSVP will be shared here and on WhatsApp. Please keep an eye on this page.' });

  return `
  <section class="section" id="rsvp" aria-labelledby="rsvp-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">RSVP</p>
        <h2 class="section__title" id="rsvp-title">Let us know you’re coming</h2>
        ${deadline || rsvp.note ? `<p class="section__lede">${deadline ? `<strong class="deadline">${esc(deadline)}</strong> ` : ''}${esc(rsvp.note ?? '')}</p>` : ''}
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
          <div><p class="dress__label">${esc(i.label)}</p><p class="dress__guidance">${esc(i.guidance)}</p></div>
        </li>`)
        .join('')}
      </ul>`
    : comingSoon({ iconName: 'shirt', title: 'Dress code to be announced', text: 'Outfit guidance for each function will be added here once the family finalises it.' });
  return `
  <section class="section" id="dress-code" aria-labelledby="dress-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Dress code</p>
        <h2 class="section__title" id="dress-title">What to wear</h2>
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
          ${features.shareSheet ? `<button class="btn btn--primary" type="button" data-action="share" hidden>${icon('share')}<span>Share</span></button>` : ''}
          <button class="btn btn--ghost" type="button" data-action="copy" hidden>${icon('copy')}<span>Copy message</span></button>
        </div>
        <p class="share__status" role="status" aria-live="polite"></p>
      </div>
    </div>
  </section>`;
}

const formatPhone = (p) => `${p.slice(0, 5)} ${p.slice(5)}`;

function renderHelp(pub) {
  const faqs = [
    ['When and where is the wedding?', `${dateRange(pub.event_dates)} at ${pub.venue.name}, ${pub.venue.address ?? [pub.venue.landmark, pub.venue.locality].filter(Boolean).join(', ')}.`],
    ['How do I get from the station to the venue?', pub.travel.transport.note || 'Transport details will be shared soon.'],
    ...(pub.rsvp.deadline ? [['When should I RSVP?', `By ${longDay(pub.rsvp.deadline)}, using the RSVP section above. It helps the family book and allot hotel rooms.`]] : []),
    ...(pub.travel.check_in_note ? [['Do I need ID for the hotel?', pub.travel.check_in_note]] : []),
    ['Where will changes be announced?', 'In the Updates section of this page and on WhatsApp. Please check before heading to each function.'],
    ...(features.downloads ? [['Can I add the functions to my calendar?', 'Yes — use “Add to calendar” under the schedule to download all the public functions at once.']] : []),
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
                .map((p) => `<a class="contact__call" href="tel:+91${esc(p)}" aria-label="Call ${esc(c.name)} on ${esc(formatPhone(p))}">${icon('phone')}<span>${esc(formatPhone(p))}</span></a>`)
                .join('')}</div>
            </div>
          </li>`,
        )
        .join('')}
        </ul>`
    : `<p class="contact__body">${icon('phone')}<span>The family will share an on-day contact here.</span></p>`;
  return `
  <section class="section" id="help" aria-labelledby="help-title">
    <div class="container">
      <header class="section__header">
        <p class="eyebrow">Help</p>
        <h2 class="section__title" id="help-title">Need a hand?</h2>
        <p class="section__lede">Call any of the family members below on the day — tap a number to call.</p>
      </header>
      <div class="help-grid">
        <div class="card contacts-card">
          <div class="detail__label"><span>On-day contacts</span>${pub.contacts.length ? '' : pending()}</div>
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

export function renderPage(pub, { generatedAt, preview, embedded = false, inlineCss = '', inlineJs = '' }) {
  features = embedded
    ? { downloads: false, print: false, mapEmbeds: false, shareSheet: false }
    : { downloads: true, print: true, mapEmbeds: true, shareSheet: true };
  const couple = `${pub.couple.partner_one} & ${pub.couple.partner_two}`;
  const range = dateRange(pub.event_dates);
  const venueLine = [pub.venue.name, pub.venue.locality].filter(Boolean).join(', ');
  const latest = pub.updates[0];
  const shareText = `${couple}’s wedding · ${range} · ${venueLine}. Schedule, venue details and day-of updates: {url}`;
  const monogram = `${pub.couple.partner_one[0]}&amp;${pub.couple.partner_two[0]}`;
  const content = `
${ICONS}
  <a class="skip-link" href="#main">Skip to content</a>
  ${preview ? `<div class="preview-bar" role="note">Preview · not yet approved for publishing</div>` : ''}
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="monogram" href="#top" aria-label="${esc(couple)} — back to top">${monogram}</a>
      <nav class="nav" aria-label="Sections">
        <a href="#schedule">Schedule</a>
        <a href="#venue">Venue</a>
        <a href="#travel">Travel</a>
        <a href="#rsvp">RSVP</a>
        <a href="#dress-code">Dress code</a>
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
        <a class="quick quick--primary" href="#rsvp">
          <span class="quick__icon">${icon('send')}</span>
          <span class="quick__text"><span class="quick__label">RSVP</span><span class="quick__hint">${pub.rsvp.deadline ? `Please reply by ${esc(dayMonth(pub.rsvp.deadline))}` : 'Opens soon'}</span></span>
          ${icon('arrow')}
        </a>
        <a class="quick" href="#venue">
          <span class="quick__icon">${icon('pin')}</span>
          <span class="quick__text"><span class="quick__label">Get directions</span><span class="quick__hint">${pub.venue.landmark ? esc(pub.venue.landmark) : pub.venue.maps_url ? esc(pub.venue.name) : 'Map link coming soon'}</span></span>
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
      ${preview ? `<p class="site-footer__meta">Local preview · built ${esc(generatedAt.toISOString().slice(0, 10))}</p>` : ''}
    </div>
  </footer>
  <template id="share-message">${esc(shareText)}</template>
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(couple)} · ${esc(range)}</title>
  <meta name="description" content="${esc(`Schedule, venue and updates for ${couple}’s wedding, ${range}, ${venueLine}.`)}">
  <meta name="robots" content="noindex, nofollow">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(`${couple}’s Wedding · ${range}`)}">
  <meta property="og:description" content="${esc(`Schedule, venue, RSVP and day-of updates · ${venueLine}`)}">
  <meta name="theme-color" content="#faf8f5">
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='#1d1b19'/><text x='32' y='41' font-family='Georgia,serif' font-size='26' fill='#fff' text-anchor='middle'>${pub.couple.partner_one[0]}&amp;${pub.couple.partner_two[0]}</text></svg>`)}">
  <link rel="stylesheet" href="styles.css">
  <script>document.documentElement.classList.add('js')</script>
  <script src="app.js" defer></script>
</head>
<body>
${content}</body>
</html>
`;
}
