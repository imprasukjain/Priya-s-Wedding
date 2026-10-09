// The public/private boundary.
//
// toPublicData() builds the *only* object the renderer receives. It copies an
// explicit allow-list of fields and never reads `notification_material` or
// `open_questions`, so WhatsApp-only content cannot reach any public output,
// whatever the templates do.

const isPublicScheduleItem = (item) =>
  item.display_on_website === true &&
  Array.isArray(item.channels) &&
  item.channels.includes('website');

const byStartTime = (a, b) => a.start_time.localeCompare(b.start_time);

export function toPublicData(eventData, updatesFile = { updates: [] }) {
  const { couple, event_dates, venue } = eventData;

  const schedule = eventData.schedule
    .filter(isPublicScheduleItem)
    .map((item) => ({
      id: item.id,
      date: item.date,
      start_time: item.start_time,
      end_time: item.end_time ?? null,
      title: item.title,
      location: item.location ?? null,
      timing_status: item.timing_status,
    }));

  const days = [...event_dates].sort().map((date) => ({
    date,
    // Array.prototype.sort is stable, so items sharing a start time keep
    // their order from event-data.json.
    items: schedule.filter((item) => item.date === date).sort(byStartTime),
  }));

  const guestServices = eventData.guest_services
    .filter((service) => service.display_on_website === true)
    .map((service) => ({ name: service.name, availability: service.availability }));

  const updates = [...updatesFile.updates]
    .map((u) => ({ id: u.id, posted_at: u.posted_at, title: u.title, message: u.message }))
    .sort((a, b) => Date.parse(b.posted_at) - Date.parse(a.posted_at));

  return deepFreeze({
    couple: { partner_one: couple.partner_one, partner_two: couple.partner_two },
    event_dates: [...event_dates].sort(),
    venue: {
      name: venue.name,
      locality: venue.locality ?? null,
      address: venue.address ?? null,
      landmark: venue.landmark ?? null,
      maps_url: venue.maps_url ?? null,
      maps_label: venue.maps_label ?? null,
      maps_embed_url: venue.maps_embed_url ?? null,
    },
    days,
    guestServices,
    updates,
    contacts: (eventData.contacts ?? []).map((c) => ({ name: c.name, phones: [...c.phones] })),
    travel: {
      stays: (eventData.travel?.stays ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        audience: s.audience,
        note: s.note ?? null,
        maps_url: s.maps_url ?? null,
        maps_embed_url: s.maps_embed_url ?? null,
      })),
      transport: {
        status: eventData.travel?.transport?.status ?? 'pending',
        destinations: [...(eventData.travel?.transport?.destinations ?? [])],
        note: eventData.travel?.transport?.note ?? null,
      },
    },
    rsvp: {
      status: eventData.rsvp?.status ?? 'pending',
      url: eventData.rsvp?.url ?? null,
      note: eventData.rsvp?.note ?? null,
    },
    dressCode: {
      status: eventData.dress_code?.status ?? 'pending',
      items: (eventData.dress_code?.items ?? []).map((i) => ({ label: i.label, guidance: i.guidance })),
    },
  });
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
