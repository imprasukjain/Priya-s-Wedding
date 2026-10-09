# Priya & Sagar — Wedding Guest Experience

Planning pack for the wedding at **CP Palace and Resort, Morena**, on **20–21 November 2026**.

## What is ready

| File | Purpose |
| --- | --- |
| [event-data-schema.json](event-data-schema.json) | Validation contract for event information, publishing channels, and privacy. |
| [event-data.json](event-data.json) | Canonical content supplied so far. |
| [requirements.md](requirements.md) | Product requirements, practical architecture, responsibilities, and open decisions. |
| [website-information-architecture.md](website-information-architecture.md) | Sitemap, page content, and publishing rules. |
| [milestone-01.md](milestone-01.md) | First implementation task for an agentic harness or web developer. |

## Publishing rule

The website is the public source of truth for guest-facing schedules and updates. WhatsApp is used for updates and selected private notifications. The 20 November Lagun Guest lunch and the 21 November Phere/other rituals are recorded as **WhatsApp-only** material and must never be rendered in the public schedule.

## Content status

All event times below were provided by the family and are marked `confirmed` in the data file. Missing information is represented as `null` or listed as an open decision; it has not been guessed.

## Safe working convention

Make all schedule changes in `event-data.json` first, validate against `event-data-schema.json`, then publish approved website and WhatsApp variants. Do not publish a URL or send messages without family approval.
