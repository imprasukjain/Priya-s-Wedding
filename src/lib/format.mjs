// Date/time helpers. Event times are local to the venue (IST, UTC+05:30).

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const IST_OFFSET_MINUTES = 330;

function parts(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, weekday };
}

/** "9:00 AM" from "09:00" */
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** { clock: "9:00", meridiem: "AM" } */
export function splitTime(hhmm) {
  const [clock, meridiem] = formatTime(hhmm).split(' ');
  return { clock, meridiem };
}

/** "20 November" */
export function dayMonth(isoDate) {
  const { m, d } = parts(isoDate);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "Friday, 20 November" */
export function longDay(isoDate) {
  const { weekday } = parts(isoDate);
  return `${WEEKDAYS[weekday]}, ${dayMonth(isoDate)}`;
}

/** { weekday: "Fri", label: "20 Nov" } */
export function shortDay(isoDate) {
  const { m, d, weekday } = parts(isoDate);
  return { weekday: WEEKDAYS[weekday].slice(0, 3), label: `${d} ${MONTHS[m - 1].slice(0, 3)}` };
}

/** "20–21 November 2026", or a full range across months/years. */
export function dateRange(isoDates) {
  const first = parts(isoDates[0]);
  const last = parts(isoDates[isoDates.length - 1]);
  if (isoDates.length === 1) return `${first.d} ${MONTHS[first.m - 1]} ${first.y}`;
  if (first.y === last.y && first.m === last.m) {
    return `${first.d}–${last.d} ${MONTHS[first.m - 1]} ${first.y}`;
  }
  if (first.y === last.y) {
    return `${first.d} ${MONTHS[first.m - 1]} – ${last.d} ${MONTHS[last.m - 1]} ${last.y}`;
  }
  return `${first.d} ${MONTHS[first.m - 1]} ${first.y} – ${last.d} ${MONTHS[last.m - 1]} ${last.y}`;
}

/** UTC iCalendar stamp, e.g. 20261120T033000Z, for a local IST date + time. */
export function icsUtcStamp(isoDate, hhmm) {
  const { y, m, d } = parts(isoDate);
  const [h, min] = hhmm.split(':').map(Number);
  const ms = Date.UTC(y, m - 1, d, h, min) - IST_OFFSET_MINUTES * 60_000;
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** "20 Nov, 2:15 PM" for an ISO date-time, shown in IST. */
export function formatPostedAt(isoDateTime) {
  const shifted = new Date(Date.parse(isoDateTime) + IST_OFFSET_MINUTES * 60_000);
  const date = shifted.toISOString().slice(0, 10);
  const time = shifted.toISOString().slice(11, 16);
  return `${shortDay(date).label}, ${formatTime(time)}`;
}
