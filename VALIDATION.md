# Milestone 01 — Validation note

How the prototype guarantees that WhatsApp-only material can never reach the public site, and how each acceptance check is verified.

Run everything with:

```bash
npm install
npm run check      # unit tests + build + 46 acceptance checks
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
| Exactly 4 public entries on 20 Nov and 4 on 21 Nov | Pass | `verify` counts rendered items per day panel; `.ics` has exactly 8 events |
| 20 Nov 11:00 AM lunch absent everywhere | Pass | Output scan (id, title, `11:00`, `11:00 AM`, ICS stamp, "lunch") |
| 21 Nov 11:30 PM Phere/rituals absent everywhere | Pass | Output scan (id, title, `23:30`, `11:30 PM`, ICS stamp, "phere", "ritual") |
| 21 Nov dinner shows 10:00 PM sharp end | Pass | Renders "4:00 PM onwards · ends 10:00 PM sharp" |
| Haldi location "Near the swimming pool at CP Palace" | Pass | Shown on the Haldi card and in the Venue section |
| Tea/coffee note under 20 November | Pass | Shown in the 20 Nov panel only, not as a timed event |
| Every schedule item shows a timing status | Pass | 8 "Confirmed" pills |
| Venue location and map | Pass | Landmark "In front of Hotel R B Tower" and the approved Google Maps link. The full postal address is still marked "to follow" |
| On-day contacts | Pass | Every number in `contacts` is a tap-to-call link, and there are no others |
| Travel & stay | Pass | CP Palace and Resort, Hotel R B Tower (guests) and Hotel Upkar Palace (Barat) are listed. Vehicle destinations are listed with timings pending |
| RSVP and dress code | Pass | Both show a visible "To be announced" state until the family supplies details |
| Missing details visibly pending | Pass | Amber badges with dashed boxes for the postal address, areas within the venue, vehicle timings, RSVP and dress code. Nothing is made up |
| Legible at 360px | Pass | Headless Chromium at 360×800: no horizontal scroll (`scrollWidth` = 360), see `docs/screenshots/mobile-360.png` |
| Keyboard navigable | Pass | Tab order: skip link → monogram → nav → quick actions → day tab → day panel → calendar/print. Arrow keys, Home and End switch day tabs. All interactive targets are ≥ 44px tall |
| Works without JavaScript | Pass | Both days are shown one after the other; tabs, share and print are progressive enhancements |
| No domain, hosting, live link, WhatsApp API, paid tool or message send | Pass | The only external URLs in the output are the map links approved in `event-data.json`. Google Maps is contacted only when a guest presses "Show map here" (no iframe in the page source). Sharing uses the device's own share sheet or copy-to-clipboard only, and only when a guest presses the button. The preview is marked `noindex` |

## Pre-publish review aids

- `docs/screenshots/` contains phone (360px) and desktop screenshots for the family content approver.
- Add `?now=2026-11-21T17:30` to the preview URL to see the day-of view (the right day is opened automatically and the next function is marked "Up next").
