import ical from 'node-ical';

export interface ParsedEvent {
  uid: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  location: string | null;
  organizerEmail: string | null;
  meetingUrl: string | null;
  attendees: { email: string; name: string | null; status: string | null }[];
  raw: Record<string, unknown>;
}

/** Coerce node-ical ParameterValue to string */
function str(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && 'val' in val) return String((val as { val: unknown }).val);
  return String(val ?? '');
}

/** Fetch and parse an iCal feed URL, returning normalized events */
export async function fetchAndParseCalendar(
  icalUrl: string,
): Promise<ParsedEvent[]> {
  const events = await ical.async.fromURL(icalUrl);
  const parsed: ParsedEvent[] = [];

  for (const [, component] of Object.entries(events)) {
    if (!component || component.type !== 'VEVENT') continue;

    const event = component as ical.VEvent;
    if (!event.start || !event.end) continue;

    const attendees = parseAttendees(event);
    const meetingUrl = extractMeetingUrl(event);

    parsed.push({
      uid: event.uid,
      title: str(event.summary) || 'Untitled Meeting',
      description: str(event.description) || null,
      startTime: new Date(event.start as unknown as string),
      endTime: new Date(event.end as unknown as string),
      location: str(event.location) || null,
      organizerEmail: extractOrganizerEmail(event),
      meetingUrl,
      attendees,
      raw: JSON.parse(JSON.stringify(event)),
    });
  }

  return parsed.sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
}

/** Extract meeting URL from event — checks conference data, location, description */
export function extractMeetingUrl(
  event: ical.VEvent,
): string | null {
  const googleMeetRegex = /https:\/\/meet\.google\.com\/[\w-]+/i;
  const zoomRegex = /https:\/\/[\w.-]*zoom\.us\/j\/\d+[^\s)"']*/i;
  const teamsRegex = /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s)"']*/i;
  const webexRegex = /https:\/\/[\w.-]*webex\.com\/[\w.-]*\/j\.php[^\s)"']*/i;

  const regexes = [googleMeetRegex, zoomRegex, teamsRegex, webexRegex];

  // Check location first
  const location = str(event.location);
  if (location) {
    for (const regex of regexes) {
      const match = location.match(regex);
      if (match) return match[0];
    }
  }

  // Check description
  const description = str(event.description);
  if (description) {
    for (const regex of regexes) {
      const match = description.match(regex);
      if (match) return match[0];
    }
  }

  return null;
}

function parseAttendees(
  event: ical.VEvent,
): { email: string; name: string | null; status: string | null }[] {
  const attendees: {
    email: string;
    name: string | null;
    status: string | null;
  }[] = [];

  if (!event.attendee) return attendees;

  const attendeeList = Array.isArray(event.attendee)
    ? event.attendee
    : [event.attendee];

  for (const att of attendeeList) {
    if (typeof att === 'string') {
      const email = att.replace(/^mailto:/i, '');
      if (email.includes('@')) {
        attendees.push({ email, name: null, status: null });
      }
    } else if (att && typeof att === 'object') {
      const params = att.params || {};
      const val =
        typeof att.val === 'string'
          ? att.val.replace(/^mailto:/i, '')
          : null;
      if (val && val.includes('@')) {
        attendees.push({
          email: val,
          name: (params as Record<string, string>).CN || null,
          status:
            (params as Record<string, string>).PARTSTAT?.toLowerCase() || null,
        });
      }
    }
  }

  return attendees;
}

function extractOrganizerEmail(event: ical.VEvent): string | null {
  if (!event.organizer) return null;

  if (typeof event.organizer === 'string') {
    return event.organizer.replace(/^mailto:/i, '') || null;
  }

  if (typeof event.organizer === 'object' && event.organizer.val) {
    return (event.organizer.val as string).replace(/^mailto:/i, '') || null;
  }

  return null;
}
