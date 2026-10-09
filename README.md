# Priya & Sagar — Wedding Guest Experience

Planning pack and website prototype for the wedding at **CP Palace and Resort, Morena**, on **20–21 November 2026**.

## Website prototype (Milestone 01)

A mobile-first static site with Welcome, Schedule, Venue, Travel & stay, RSVP, Dress code, Updates and Help sections. It is built from `event-data.json`, and WhatsApp-only material is filtered out at build time.

```bash
npm install
npm run build      # validates the data and writes dist/
npm run preview    # serves dist/ at http://localhost:4173
npm run check      # unit tests + 59 acceptance checks (see VALIDATION.md)
```

You can also open `dist/index.html` directly in a browser.

The build also writes `dist/embedded/index.html`, a single-file copy used for the private claude.ai preview link. It has inlined CSS and JS, and leaves out the calendar download, print button, embedded maps and share sheet, which the preview frame blocks.

| Path | Purpose |
| --- | --- |
| `src/lib/public-data.mjs` | **The public/private boundary.** The only data the site ever sees. |
| `src/lib/render.mjs`, `src/lib/ics.mjs` | Page and calendar download renderers. |
| `src/themes/minimal.css` | Design tokens for the current theme. Add new themes here, e.g. `THEME=traditional npm run build`. |
| `src/assets/base.css`, `src/assets/app.js` | Layout/components and small progressive enhancements (day tabs, countdown, "Up next", share, print). |
| `content/updates.json` | Approved day-of notices (empty for now). See its schema for the fields. |
| `scripts/verify.mjs` | Acceptance checks against the built output. |
| `docs/screenshots/` | Screenshots for the pre-publish review. |

The accent colour (`--accent` in `src/themes/minimal.css`) is a placeholder until the family chooses one.

## Live site

**https://imprasukjain.github.io/Priya-s-Wedding/**

`.github/workflows/deploy-pages.yml` rebuilds and republishes the site on every push to `main`, and only if the tests and acceptance checks pass. To change anything guests see, edit `event-data.json` (or `content/updates.json` for a day-of notice) and merge to `main`; the site updates within a couple of minutes. The page is marked `noindex`, so it stays out of search results and guests reach it through the shared link.

One-time setup (repository owner): **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Planning documents

| File | Purpose |
| --- | --- |
| [event-data-schema.json](event-data-schema.json) | Validation contract for event information, publishing channels, and privacy. |
| [event-data.json](event-data.json) | Canonical content supplied so far. |
| [requirements.md](requirements.md) | Product requirements, practical architecture, responsibilities, and open decisions. |
| [website-information-architecture.md](website-information-architecture.md) | Sitemap, page content, and publishing rules. |
| [milestone-01.md](milestone-01.md) | First implementation task for an agentic harness or web developer. |
| [VALIDATION.md](VALIDATION.md) | Milestone 01 validation note and acceptance check results. |

## Publishing rule

The website is the public source of truth for guest-facing schedules and updates. WhatsApp is used for updates and selected private notifications. The 20 November Lagun Guest lunch and the 21 November Phere/other rituals are recorded as **WhatsApp-only** material and must never be rendered in the public schedule.

## Content status

All event times below were provided by the family and are marked `confirmed` in the data file. Missing information is represented as `null` or listed as an open decision; it has not been guessed.

## Safe working convention

Make all schedule changes in `event-data.json` first, validate against `event-data-schema.json`, then publish approved website and WhatsApp variants. Do not publish a URL or send messages without family approval.

To fill in a section that is still "to be announced", edit `event-data.json`:

- **RSVP:** guests fill a short form (name, number of guests, days attending, hotel room and rooms needed, arrival). Pressing "Send RSVP on WhatsApp" opens WhatsApp with the RSVP already written, addressed to `rsvp.whatsapp_number`, and the guest presses send. The site itself stores nothing. To send RSVPs to someone else, change that number. To use a Google Form instead, set `rsvp.method` to `"link"` and put the form address in `rsvp.url`.
- **Dress code:** edit `dress_code.items`. Each item's `applies_to` lists the schedule ids whose cards show that guidance.
- **Vehicles:** update `travel.transport.note` with timings and set `travel.transport.status` to `"confirmed"`.

To post a day-of update, add one approved entry to `content/updates.json`, run `npm run check`, and review the preview before publishing.
