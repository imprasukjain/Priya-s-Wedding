// Public calendar download, built from the filtered public data only.
// One file per language: titles and places use that language's translations.
import { icsUtcStamp } from './format.mjs';

const escapeText = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function renderIcs(pub, generatedAt, lang) {
  const tc = (text) => lang.tc(text);
  const venue = [tc(pub.venue.name), tc(pub.venue.locality)].filter(Boolean).join(', ');
  const couple = `${tc(pub.couple.partner_one)} & ${tc(pub.couple.partner_two)}`;
  const stamp = generatedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const events = pub.days.flatMap((day) =>
    day.items.map((item) => {
      const lines = [
        'BEGIN:VEVENT',
        `UID:${item.id}@priya-sagar-wedding.invalid`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsUtcStamp(item.date, item.start_time)}`,
      ];
      if (item.end_time) lines.push(`DTEND:${icsUtcStamp(item.date, item.end_time)}`);
      lines.push(
        `SUMMARY:${escapeText(`${tc(item.title)} · ${couple}`)}`,
        `LOCATION:${escapeText(item.offsite ? [tc(item.location), tc(item.address)].filter(Boolean).join(', ') : item.location ? `${tc(item.location)}, ${venue}` : venue)}`,
        `STATUS:${item.timing_status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT',
      );
      return lines.join('\r\n');
    }),
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Priya & Sagar Wedding//Public schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(`${couple} — Wedding`)}`,
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
