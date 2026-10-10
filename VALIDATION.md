# Milestone 01 — Validation note

How the prototype guarantees that WhatsApp-only material can never reach the public site, and how each acceptance check is verified.

Run everything with:

```bash
npm install
npm run check      # unit tests + build + 66 acceptance checks
```

## Why private items cannot reach the public output

1. **Nothing is fetched in the browser.** The site is pre-rendered at build time into `dist/`. The browser never downloads `event-data.json`, so private records can't leak through a network request, page source or a "hidden" element.
2. **One allow-list boundary.** `src/lib/public-data.mjs` (`toPublicData`) builds the only object the renderer and the calendar generator receive. It copies named fields from `schedule` items where `display_on_website === true` **and** `channels` includes `"website"`. It never reads `notification_material` or `open_questions`, and unknown fields are dropped.
3. **Schema first.** The build stops if `event-data.json` or `content/updates.json` fails schema validation. The schema already forbids `display_on_website: false` inside `schedule`; the code filter is a second, independent guard.
4. **The output is scanned.** `scripts/verify.mjs` reads every file in `dist/` (HTML, CSS, JS and `schedule.ics`) and fails if it finds any private item's id, title, raw time, 12-hour time or calendar timestamp, or the words "phere", "ritual" or "lunch".

The unit tests (`test/public-data.test.mjs`) also check that the filter still drops a private item that has been placed inside `schedule` on purpose, and that unknown fields and the update approver's name never reach the public data. As a negative control, adding the word "Phere" to a built file made `verify` fail as expected.

## Acceptance checks

| Check | Result | How |
| --- | --- | --- |
| Public entries per day: 1 (19 Nov), 5 (20 Nov), 5 (21 Nov), 1 (22 Nov) | Pass | `verify` counts rendered items per day (expected counts come from `event-data.json`); `.ics` has exactly 12 events |
| Mehendi at a separate venue | Pass | Card shows "Separate venue" and "7:00 PM onwards"; the FAQ and the calendar entry name Shree Gyan Seva Sadan, Morena |
| WhatsApp-only material absent everywhere | Pass | `notification_material` is empty since the family made Lunch and Phere public on 10 Oct 2026. Any item added there later is scanned for by id, title, time and calendar stamp |
| 21 Nov dinner shows 10:00 PM sharp end | Pass | Renders "4:00 PM onwards · ends 10:00 PM sharp" |
| Every function shows its time and venue area | Pass | One check per schedule item. Lunch and Phere areas are still marked "to be confirmed" |
| RSVP: one per family, days ticked, ETA and mode of travel | Pass | Asks for one RSVP per family; a tick-box for each day (at least one required); arrival day and approximate time, plus a required mode of travel (train, bus, car / taxi, other) with optional train or bus details |
| Tea/coffee note on 20 and 21 Nov | Pass | Shown in those days' panels only, not as a timed event |
| Every schedule item shows a timing status | Pass | 8 "Confirmed" pills |
| Venue address and map | Pass | "In front of Hotel R B Tower, Ambah Bypass Road, Morena, Madhya Pradesh 476001" and the approved Google Maps link |
| On-day contacts | Pass | Every number in `contacts` is a tap-to-call link, and there are no others |
| Travel & stay | Pass | CP Banquet, Hotel R B Tower (guests) and Hotel Upkar Palace (Barat) are listed. Vehicle destinations are listed with timings pending |
| RSVP | Pass | The deadline (Sunday, 15 November) is shown. The form opens WhatsApp addressed only to the approved RSVP number, and a plain WhatsApp link is shown when JavaScript is off. The site has no form action, network call or storage, so it collects nothing |
| Aadhaar requirement | Pass | Shown in both the RSVP and Travel & stay sections |
| Dress code | Pass | Lagun, Haldi, Sangeet and Dinner guidance is shown in the Dress code section and on each matching schedule card |
| Missing details visibly pending | Pass | Amber badges with dashed boxes for areas within the venue and vehicle timings. Nothing is made up |
| Legible at 360px | Pass | Headless Chromium at 360×800: no horizontal scroll (`scrollWidth` = 360), see `docs/screenshots/mobile-360.png` |
| Keyboard navigable | Pass | Tab order: skip link → monogram → nav → quick actions → day tab → day panel → calendar/print. Arrow keys, Home and End switch day tabs. All interactive targets are ≥ 44px tall |
| Works without JavaScript | Pass | Both days are shown one after the other; tabs, share and print are progressive enhancements |
| No domain, hosting, live link, WhatsApp API, paid tool or message send | Pass | The only external URLs in the output are the map links and the RSVP WhatsApp chat link approved in `event-data.json`. RSVP uses a WhatsApp click-to-chat link that the guest sends themselves, not the WhatsApp API. Google Maps is contacted only when a guest presses "Show map here" (no iframe in the page source). Sharing uses the device's own share sheet or copy-to-clipboard only, and only when a guest presses the button. The preview is marked `noindex` |

## Pre-publish review aids

- `docs/screenshots/` contains phone (360px) and desktop screenshots for the family content approver.
- Add `?now=2026-11-21T17:30` to the preview URL to see the day-of view (the right day is opened automatically and the next function is marked "Up next").
