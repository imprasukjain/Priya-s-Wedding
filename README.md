# Priya & Sagar — Wedding Guest Experience

Planning pack and website prototype for the wedding at **CP Palace and Resort, Morena**, on **20–21 November 2026**.

## Website prototype (Milestone 01)

A mobile-first static site with Welcome, Schedule, Venue, Updates and Help sections. It is built from `event-data.json`, and WhatsApp-only material is filtered out at build time.

```bash
npm install
npm run build      # validates the data and writes dist/
npm run preview    # serves dist/ at http://localhost:4173
npm run check      # unit tests + 35 acceptance checks (see VALIDATION.md)
```

You can also open `dist/index.html` directly in a browser.

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

To post a day-of update, add one approved entry to `content/updates.json`, run `npm run check`, and review the preview before publishing.
