# Requirements — Priya & Sagar Wedding Guest Experience

## Objective

Give 500+ guests one mobile-friendly place to find accurate public event information, while using WhatsApp for time-sensitive updates and restricted messages. The experience should feel modern and minimal: generous whitespace, calm typography, high contrast, and no unnecessary effects.

## Audience and needs

| Audience | Need | Channel |
| --- | --- | --- |
| All guests | Date, venue, public schedule, basic day-of updates | Website; WhatsApp link-back |
| Lagun guests | Lunch reminder at 11:00 AM on 20 November | WhatsApp only |
| Recipients selected by family | 11:30 PM Phere/rituals reminder on 21 November | WhatsApp only |
| Family and venue coordinator | One controlled source for approved content and rapid corrections | Event data file; publishing checklist |

## Functional requirements

1. Present a public schedule by day, in chronological order, from the `schedule` collection only.
2. Display “Tea and coffee available throughout the day” for 20 November.
3. Clearly display the venue name; add address and directions only after approval.
4. Offer an “Updates” surface so a coordinator can add a concise, timestamped event notice.
5. Provide a shareable WhatsApp message that links guests to the website for public updates.
6. Keep the two notification-only items out of all public pages, search metadata, calendar downloads, and printed public QR destinations.
7. Be usable on a low-end phone and fast mobile connection. Target an informational static site with no account, RSVP database, payment flow, or guest-list upload in the first release.

## Practical architecture

```
Approved family / venue details
            |
            v
 event-data.json (single content source)
       |                         |
       v                         v
Public schedule + updates      Private WhatsApp drafts
       |                         |
       v                         v
Mobile website + QR           Manually approved sends
```

### Privacy boundary

Only website-eligible `schedule` entries may be rendered on the site. `notification_material` is a separate collection, with `display_on_website: false`, and is for family-approved WhatsApp copy only. Do not use a hidden page as a substitute for access control.

### Operating model

| Role | Responsibility |
| --- | --- |
| Family content approver | Confirms times, wording, recipients, and publication approval. |
| Venue coordinator | Confirms room/area labels and flags operational changes. |
| Website editor | Updates the canonical data, verifies the public/private boundary, and publishes only after approval. |
| WhatsApp sender | Uses only approved private drafts and recipient lists; records when messages were sent. |

## Non-functional requirements

- Responsive, accessible, and readable at large text sizes.
- No guest personal data is necessary in milestone 1.
- Website update must take no more than one editorial change to the data source and one review.
- Every displayed schedule item must show a timing status. Existing supplied timings are confirmed; any later unknown timing must be explicitly marked “Provisional”.
- Capture a pre-publish screenshot or link review from the family content approver.

## Content rules and known facts

| Date | Public website content |
| --- | --- |
| 19 Nov | 7:00 PM onwards Mehendi at Shree Gyan Seva Sadan, Morena (separate venue). |
| 20 Nov | 9:00 AM Lagun (Outer Hall); 11:00 AM Lunch; 1:30 PM Haldi near the swimming pool at CP Banquet; 5:30 PM Dinner Starts (Garden Area); 7:30 PM Sangeet and Fun DJ Night (Outer Hall); tea and coffee throughout the day. |
| 21 Nov | 4:00 PM Barat Aagman (Main Gate of Banquet Hall); 4:00 PM Dinner Starts, ends sharply at 10:00 PM (Garden Area); 7:00 PM Bhatai Milap (Outer Hall); 9:00 PM Reception (Main Hall); 11:00 PM Phere; tea and coffee throughout the day. |
| 22 Nov | 7:00 AM Vidayi. |

Update 10 Oct 2026: the venue is now called CP Banquet. The family moved the Lunch (20 Nov) and the Phere (21 Nov, now 11:00 PM) from WhatsApp-only to the public schedule, and replaced the Stage Program with the Reception.

## Decisions still needed

Supplied since milestone 1: the venue map link (pin on Hotel R B Tower, directly opposite the venue, then called CP Palace and Resort), on-day contacts, guest hotels (rooms at the venue, Hotel R B Tower), the Barat hotel (Hotel Upkar Palace), and confirmation that the site will have RSVP, travel/stay and dress code sections. Vehicles will run between the venue, the Mandir, the railway station and the Barat hotel.

Also supplied: the full venue address (In front of Hotel R B Tower, Ambah Bypass Road, Morena, Madhya Pradesh 476001); RSVP by 15 November via a WhatsApp message to the family, to help book and allot hotel rooms; the Aadhaar card requirement for hotel check-in; and dress codes for Lagun, Haldi, Sangeet and dinners.

Update 10 Oct 2026 (later): Mehendi added on 19 Nov at Shree Gyan Seva Sadan, Morena (dress code: sage green); Vidayi added on 22 Nov at 7:00 AM; Lagun dress code widened to suits / formals / Indo-western for men and Indo-western / saree for women; RSVP asks for one response per family.

Still unresolved: venue areas for the Lunch, Phere and Vidayi, a map link for Shree Gyan Seva Sadan, vehicle timings, and dress code for Barat Aagman, Bhatai Milap, Reception, Phere and Vidayi. Treat them as unresolved, not as blanks to fill with assumptions; the site shows each as "to be announced".

## Out of scope for milestone 1

- Public deployment, domain purchase, hosting purchase, or paid WhatsApp service.
- Automated WhatsApp sending or collection of guest contacts.
- Collecting RSVP responses on the site itself, invitation authentication, live location tracking, photography gallery, or payment features. (RSVPs are sent by the guest on WhatsApp; the site stores nothing.)
