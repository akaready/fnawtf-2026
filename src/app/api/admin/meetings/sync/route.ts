import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchAndParseCalendar } from '@/lib/calendar';
import { createRecallBot } from '@/lib/recall';
import { matchAttendeesForMeeting } from '@/lib/meetings/matchAttendees';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get config
  const { data: config } = await supabase
    .from('meetings_config')
    .select('*')
    .limit(1)
    .single();

  const icalUrl = (config as { ical_url?: string; id?: string } | null)?.ical_url || process.env.GOOGLE_ICAL_URL;
  if (!icalUrl) {
    return NextResponse.json(
      { error: 'No iCal URL configured' },
      { status: 400 },
    );
  }

  try {
    const events = await fetchAndParseCalendar(icalUrl);
    const now = new Date();
    const tenMinFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    let synced = 0;
    let botsScheduled = 0;

    for (const event of events) {
      // Skip events more than 30 days in the past
      if (event.endTime < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
        continue;

      const status = event.meetingUrl
        ? event.startTime < now
          ? 'completed'
          : 'upcoming'
        : 'no_video_link';

      // Upsert meeting
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .upsert(
          {
            ical_uid: event.uid,
            title: event.title,
            description: event.description,
            start_time: event.startTime.toISOString(),
            end_time: event.endTime.toISOString(),
            meeting_url: event.meetingUrl,
            location: event.location,
            organizer_email: event.organizerEmail,
            status,
            raw_event: event.raw,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: 'ical_uid' },
        )
        .select('id, recall_bot_id, status')
        .single();

      const m = meeting as { id: string; recall_bot_id: string | null; status: string } | null;
      if (meetingError || !m) continue;
      synced++;

      // Upsert attendees
      if (event.attendees.length > 0) {
        await supabase
          .from('meeting_attendees')
          .upsert(
            event.attendees.map((att) => ({
              meeting_id: m.id,
              email: att.email,
              display_name: att.name,
              response_status: att.status,
              is_organizer: att.email === event.organizerEmail,
            })) as never,
            { onConflict: 'meeting_id,email' },
          );
      }

      // Schedule Recall bot for upcoming meetings with video links
      if (
        event.meetingUrl &&
        event.startTime > tenMinFromNow &&
        !m.recall_bot_id
      ) {
        try {
          const bot = await createRecallBot({
            meeting_url: event.meetingUrl,
            join_at: event.startTime.toISOString(),
          });

          await supabase
            .from('meetings')
            .update({
              recall_bot_id: bot.id,
              status: 'bot_scheduled',
              updated_at: new Date().toISOString(),
            } as never)
            .eq('id', m.id);

          botsScheduled++;
        } catch (err) {
          console.error(
            `Failed to schedule bot for meeting ${event.uid}:`,
            err,
          );
        }
      }

      // Run attendee matching
      await matchAttendeesForMeeting(supabase, m.id);
    }

    // Update last synced
    const configId = (config as { id?: string } | null)?.id;
    if (configId) {
      await supabase
        .from('meetings_config')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', configId);
    }

    return NextResponse.json({ synced, botsScheduled });
  } catch (err) {
    console.error('Calendar sync error:', err);
    return NextResponse.json(
      { error: 'Sync failed', detail: (err as Error).message },
      { status: 500 },
    );
  }
}
