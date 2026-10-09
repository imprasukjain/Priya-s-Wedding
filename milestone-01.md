# Milestone 01 — Content-safe Website Foundation

## Goal

Create a local, reviewable, mobile-first static prototype for Priya and Sagar’s guest-information website. It must use the supplied canonical event data and safely separate public schedule content from WhatsApp-only material.

## First implementation task

**Build a static website scaffold with a schedule renderer driven by `event-data.json`.**

### Inputs

- `event-data.json`
- `event-data-schema.json`
- `requirements.md`
- `website-information-architecture.md`

### Deliverables

1. A local static website prototype with Welcome, Schedule, Venue, Updates, and Help sections.
2. A reusable schedule renderer that consumes only `schedule` records where `display_on_website` is `true`.
3. Public display of the supplied tea/coffee service note for 20 November.
4. A conspicuous pending state for missing address/map/contact details, without inventing any of them.
5. A minimal, responsive visual treatment suitable for a modern-minimal wedding site.
6. A short validation note showing that no `notification_material` text can reach the public rendered output.

### Acceptance checks

- The public schedule includes exactly 4 entries for 20 November and 4 entries for 21 November.
- The 20 November 11:00 AM lunch does not appear anywhere in the public prototype.
- The 21 November 11:30 PM Phere/rituals do not appear anywhere in the public prototype.
- The 21 November dinner shows a 10:00 PM sharp end time.
- The Haldi location appears as “Near the swimming pool at CP Palace.”
- The prototype is legible at a 360px-wide viewport and keyboard navigable.
- No domain, hosting, live link, WhatsApp API, paid tool, or message send is created or used.

### Implementation constraints

- Treat this as a local prototype until an explicit approval to publish is given.
- Do not add RSVP, guest data collection, or authentication in this milestone.
- Keep all missing details visibly pending rather than guessed.
- Preserve the public/private data split in code as a hard filter, not a visual hide/show convention.

## Definition of done

The family can open a local preview, verify all known public details, confirm that private items are absent, and provide the unresolved venue/contact decisions for milestone 2.

## Handoff prompt for an agentic harness

> Build the Milestone 01 local static prototype described in `milestone-01.md`. Treat `event-data.json` as the source of truth and validate it against `event-data-schema.json`. Render only `schedule` items with `display_on_website: true`; never import, render, search-index, or expose `notification_material`. Build the Welcome, Schedule, Venue, Updates, and Help sections using a modern-minimal responsive design. Keep unavailable address, map, and contact information visibly pending. Verify the acceptance checks, especially the precise public schedule counts and absence of WhatsApp-only items. Do not deploy, purchase, send WhatsApp messages, or collect guest data.
