// Date/time helpers. Event times are local to the venue (IST, UTC+05:30).
//
// makeFormat(locale) returns formatters for one language. `locale` carries
// month/weekday names, the words for parts of the day (Hindi/Bangla say
// "सुबह 9:00" rather than "9:00 AM") and how to order clock and period.
// The plain named exports below are the English formatters.

export const IST_OFFSET_MINUTES = 330;

export const EN_FORMAT = {
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  dayPeriods: [['00:00', 'AM'], ['12:00', 'PM']],
  timePattern: '{clock} {period}',
};

function parts(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, weekday };
}

export function makeFormat(locale = EN_FORMAT) {
  const L = { ...EN_FORMAT, ...locale };

  /** { clock: "9:00", meridiem: "AM" | "सुबह" } from "09:00" */
  function splitTime(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const hour = h % 12 === 0 ? 12 : h % 12;
    const meridiem = L.dayPeriods.filter(([from]) => from <= hhmm).at(-1)[1];
    return { clock: `${hour}:${String(m).padStart(2, '0')}`, meridiem };
  }

  /** "9:00 AM" / "सुबह 9:00" */
  function formatTime(hhmm) {
    const { clock, meridiem } = splitTime(hhmm);
    return L.timePattern.replace('{clock}', clock).replace('{period}', meridiem);
  }

  /** "20 November" */
  function dayMonth(isoDate) {
    const { m, d } = parts(isoDate);
    return `${d} ${L.months[m - 1]}`;
  }

  /** "Friday, 20 November" */
  function longDay(isoDate) {
    return `${L.weekdays[parts(isoDate).weekday]}, ${dayMonth(isoDate)}`;
  }

  /** { weekday: "Fri", label: "20 Nov" } */
  function shortDay(isoDate) {
    const { m, d, weekday } = parts(isoDate);
    return { weekday: L.weekdaysShort[weekday], label: `${d} ${L.monthsShort[m - 1]}` };
  }

  /** "20–21 November 2026", or a full range across months/years. */
  function dateRange(isoDates) {
    const first = parts(isoDates[0]);
    const last = parts(isoDates[isoDates.length - 1]);
    const M = L.months;
    if (isoDates.length === 1) return `${first.d} ${M[first.m - 1]} ${first.y}`;
    if (first.y === last.y && first.m === last.m) return `${first.d}–${last.d} ${M[first.m - 1]} ${first.y}`;
    if (first.y === last.y) return `${first.d} ${M[first.m - 1]} – ${last.d} ${M[last.m - 1]} ${last.y}`;
    return `${first.d} ${M[first.m - 1]} ${first.y} – ${last.d} ${M[last.m - 1]} ${last.y}`;
  }

  /** "20 Nov, 2:15 PM" for an ISO date-time, shown in IST. */
  function formatPostedAt(isoDateTime) {
    const shifted = new Date(Date.parse(isoDateTime) + IST_OFFSET_MINUTES * 60_000).toISOString();
    return `${shortDay(shifted.slice(0, 10)).label}, ${formatTime(shifted.slice(11, 16))}`;
  }

  return { splitTime, formatTime, dayMonth, longDay, shortDay, dateRange, formatPostedAt };
}

export const { splitTime, formatTime, dayMonth, longDay, shortDay, dateRange, formatPostedAt } = makeFormat();

/** UTC iCalendar stamp, e.g. 20261120T033000Z, for a local IST date + time. */
export function icsUtcStamp(isoDate, hhmm) {
  const { y, m, d } = parts(isoDate);
  const [h, min] = hhmm.split(':').map(Number);
  const ms = Date.UTC(y, m - 1, d, h, min) - IST_OFFSET_MINUTES * 60_000;
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
