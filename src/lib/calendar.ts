/**
 * Lightweight iCal (.ics) feed parser — no external dependencies.
 * Handles VEVENT parsing, line unfolding, and property extraction.
 */

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
  raw: Record<string, string>;
}

/** Fetch and parse an iCal feed URL, returning normalized events */
export async function fetchAndParseCalendar(
  icalUrl: string,
): Promise<ParsedEvent[]> {
  const res = await fetch(icalUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FNA-CalSync/1.0)' },
  });
  if (!res.ok) throw new Error(`Failed to fetch iCal feed: ${res.status}`);
  const text = await res.text();
  return parseIcalText(text);
}

/** Parse raw .ics text into events */
export function parseIcalText(icsText: string): ParsedEvent[] {
  // Unfold lines (RFC 5545: lines starting with space/tab are continuations)
  const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = unfolded.split('\n');

  const events: ParsedEvent[] = [];
  let inEvent = false;
  let eventLines: string[] = [];

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      eventLines = [];
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      const event = parseVEvent(eventLines);
      if (event) events.push(event);
    } else if (inEvent) {
      eventLines.push(line);
    }
  }

  return events.sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
}

function parseVEvent(lines: string[]): ParsedEvent | null {
  const props: Record<string, string> = {};
  const attendees: { email: string; name: string | null; status: string | null }[] = [];

  for (const line of lines) {
    // Handle ATTENDEE lines specially (can have multiple)
    if (line.startsWith('ATTENDEE')) {
      const att = parseAttendee(line);
      if (att) attendees.push(att);
      continue;
    }

    // Parse property: NAME;PARAMS:VALUE or NAME:VALUE
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const keyPart = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    // Strip parameters from key (e.g. DTSTART;TZID=America/New_York -> DTSTART)
    const key = keyPart.split(';')[0];

    // Store the first occurrence (don't overwrite)
    if (!props[key]) {
      props[key] = value;
    }
  }

  const uid = props['UID'];
  const dtstart = props['DTSTART'];
  if (!uid || !dtstart) return null;

  const startTime = parseIcalDate(dtstart);
  const endTime = props['DTEND'] ? parseIcalDate(props['DTEND']) : new Date(startTime.getTime() + 3600_000);

  if (isNaN(startTime.getTime())) return null;

  const description = unescapeIcal(props['DESCRIPTION'] || '') || null;
  const location = unescapeIcal(props['LOCATION'] || '') || null;
  const title = unescapeIcal(props['SUMMARY'] || '') || 'Untitled Meeting';

  // Skip placeholder / busy-block events
  if (title.toLowerCase() === 'busy') return null;

  const organizerEmail = parseOrganizerEmail(
    lines.find((l) => l.startsWith('ORGANIZER')) || '',
  );

  const meetingUrl = extractMeetingUrl(location, description);

  return {
    uid,
    title,
    description,
    startTime,
    endTime,
    location,
    organizerEmail,
    meetingUrl,
    attendees,
    raw: props,
  };
}

function parseIcalDate(value: string): Date {
  // Formats: 20260301T100000Z, 20260301T100000, 20260301
  const clean = value.replace(/[^0-9TZ]/g, '');

  if (clean.length >= 15) {
    // Full datetime: YYYYMMDDTHHMMSS[Z]
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    const h = clean.slice(9, 11);
    const mi = clean.slice(11, 13);
    const s = clean.slice(13, 15);
    const isUtc = clean.endsWith('Z');
    const iso = `${y}-${m}-${d}T${h}:${mi}:${s}${isUtc ? 'Z' : ''}`;
    return new Date(iso);
  }

  if (clean.length >= 8) {
    // Date only: YYYYMMDD
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }

  return new Date(value);
}

function parseAttendee(line: string): { email: string; name: string | null; status: string | null } | null {
  // ATTENDEE;CN=John Doe;PARTSTAT=ACCEPTED:mailto:john@example.com
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return null;

  const paramsPart = line.slice(0, colonIdx);
  const valuePart = line.slice(colonIdx + 1);

  const email = valuePart.replace(/^mailto:/i, '').trim();
  if (!email || !email.includes('@')) return null;

  // Parse params
  let name: string | null = null;
  let status: string | null = null;

  const params = paramsPart.split(';');
  for (const param of params) {
    if (param.startsWith('CN=')) {
      name = param.slice(3).replace(/^"(.*)"$/, '$1');
    } else if (param.startsWith('PARTSTAT=')) {
      status = param.slice(9).toLowerCase();
    }
  }

  return { email, name, status };
}

function parseOrganizerEmail(line: string): string | null {
  if (!line) return null;
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return null;
  const value = line.slice(colonIdx + 1).replace(/^mailto:/i, '').trim();
  return value.includes('@') ? value : null;
}

function unescapeIcal(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Extract meeting URL from location and description text */
export function extractMeetingUrl(
  location: string | null,
  description: string | null,
): string | null {
  const googleMeetRegex = /https:\/\/meet\.google\.com\/[\w-]+/i;
  const zoomRegex = /https:\/\/[\w.-]*zoom\.us\/j\/\d+[^\s)"']*/i;
  const teamsRegex = /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s)"']*/i;
  const webexRegex = /https:\/\/[\w.-]*webex\.com\/[\w.-]*\/j\.php[^\s)"']*/i;

  const regexes = [googleMeetRegex, zoomRegex, teamsRegex, webexRegex];

  for (const text of [location, description]) {
    if (!text) continue;
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match) return match[0];
    }
  }

  return null;
}
