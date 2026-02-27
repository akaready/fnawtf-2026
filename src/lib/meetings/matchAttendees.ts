import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Match meeting attendees' emails against contacts and clients tables.
 * Creates auto-match relationships in meeting_relationships.
 */
export async function matchAttendeesForMeeting(
  supabase: SupabaseClient,
  meetingId: string,
) {
  // Get attendees for this meeting
  const { data: attendees } = await supabase
    .from('meeting_attendees')
    .select('email')
    .eq('meeting_id', meetingId);

  if (!attendees || attendees.length === 0) return;

  const emails = attendees.map((a) => a.email.toLowerCase());

  // Match against contacts
  const { data: matchedContacts } = await supabase
    .from('contacts')
    .select('id, email')
    .in('email', emails);

  // Match against clients (companies)
  const { data: matchedClients } = await supabase
    .from('clients')
    .select('id, email')
    .in('email', emails);

  const relationships: {
    meeting_id: string;
    client_id: string | null;
    contact_id: string | null;
    matched_email: string;
    match_type: string;
  }[] = [];

  if (matchedContacts) {
    for (const contact of matchedContacts) {
      if (!contact.email) continue;
      relationships.push({
        meeting_id: meetingId,
        client_id: null,
        contact_id: contact.id,
        matched_email: contact.email,
        match_type: 'auto',
      });
    }
  }

  if (matchedClients) {
    for (const client of matchedClients) {
      if (!client.email) continue;
      relationships.push({
        meeting_id: meetingId,
        client_id: client.id,
        contact_id: null,
        matched_email: client.email,
        match_type: 'auto',
      });
    }
  }

  if (relationships.length === 0) return;

  // Upsert — avoid duplicates
  for (const rel of relationships) {
    const matchFilter: Record<string, unknown> = {
      meeting_id: rel.meeting_id,
      match_type: 'auto',
    };
    if (rel.client_id) matchFilter.client_id = rel.client_id;
    if (rel.contact_id) matchFilter.contact_id = rel.contact_id;

    // Check if relationship already exists
    let query = supabase
      .from('meeting_relationships')
      .select('id')
      .eq('meeting_id', rel.meeting_id)
      .eq('match_type', 'auto');

    if (rel.client_id) {
      query = query.eq('client_id', rel.client_id);
    } else {
      query = query.is('client_id', null);
    }
    if (rel.contact_id) {
      query = query.eq('contact_id', rel.contact_id);
    } else {
      query = query.is('contact_id', null);
    }

    const { data: existing } = await query.limit(1).single();
    if (!existing) {
      await supabase.from('meeting_relationships').insert(rel);
    }
  }
}
