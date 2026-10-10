# Website Information Architecture

## Navigation model

Use a single mobile-first wedding information site. Keep navigation short and preserve a simple scrolling experience.

| Area | Purpose | Required content | Status / rule |
| --- | --- | --- | --- |
| Welcome | Orient guests | Priya & Sagar; 20–21 November 2026; CP Banquet, Morena | Ready from supplied data |
| Schedule | Main guest utility | Day tabs/sections, times, public functions, dinner end time, tea/coffee note | Render only `schedule` + public `guest_services` |
| Venue | Help guests arrive | Venue name; approved address, map, internal-location notes when received | Address/link pending — do not fabricate |
| Updates | Day-of clarity | Dated, timestamped notices; latest notice visually prominent | Empty state until an approved update exists |
| Help | Reduce coordination calls | Approved on-day contact and simple FAQ | Contact/FAQ pending |

## Page structure

```
Home
 ├─ Hero: couple, dates, venue
 ├─ Quick actions: View schedule / Get directions / Latest update
 ├─ Schedule
 │   ├─ 20 November
 │   └─ 21 November
 ├─ Venue & directions
 ├─ Updates
 └─ Help / contact
```

## Schedule presentation rules

1. Sort items by local start time within each date.
2. Show only items where `display_on_website` is `true`.
3. Use supplied titles verbatim unless the family approves revised display copy.
4. Display the 21 November dinner as “4:00 PM onwards · ends 10:00 PM sharp.”
5. Display “Tea and coffee available throughout the day” under 20 November, not as a timed event.
6. If an item becomes provisional, label it **Provisional** at the point of display; never imply it is confirmed.
7. Do not display, link to, index, or include in QR/print exports: Lagun Guest lunch or Phere/other rituals.

## Modern-minimal design direction

- One restrained neutral palette with a single accent color selected by the family.
- Clear sans-serif text, large time labels, and no decorative clutter competing with event details.
- Schedule cards with time, title, location when approved, and an optional status pill.
- 44px-or-larger touch targets and strong text contrast.
- A print-friendly schedule view for optional QR signage later.

## Content lifecycle

1. Family or venue reports a change.
2. Website editor updates `event-data.json` or an approved update entry.
3. Family content approver reviews the public preview.
4. Editor publishes the website change.
5. WhatsApp sender uses a separately approved message to link guests to the updated public page, or sends a restricted reminder only to an approved private audience.
