import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getRecallTranscript } from '@/lib/recall';
import { matchAttendeesForMeeting } from '@/lib/meetings/matchAttendees';

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-recall-webhook-secret');
  if (process.env.RECALL_WEBHOOK_SECRET && secret !== process.env.RECALL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();
  const { event, data } = body;

  if (!event || !data?.bot_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const botId = data.bot_id;

  // Find meeting by recall_bot_id
  const { data: meeting } = await supabase
    .from('meetings')
    .select('id')
    .eq('recall_bot_id', botId)
    .single();

  if (!meeting) {
    console.warn(`Webhook received for unknown bot: ${botId}`);
    return NextResponse.json({ ok: true });
  }

  const statusCode = data.status?.code;

  if (statusCode === 'in_call_recording') {
    await supabase
      .from('meetings')
      .update({
        status: 'in_progress',
        recall_bot_status: statusCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting.id);
  } else if (statusCode === 'done') {
    await supabase
      .from('meetings')
      .update({
        status: 'completed',
        recall_bot_status: statusCode,
        transcript_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting.id);

    // Fetch and store transcript
    try {
      const transcript = await getRecallTranscript(botId);

      const segments = Array.isArray(transcript) ? transcript : [];
      const allWords = segments.flatMap(
        (s: { words?: { text: string }[] }) => s.words || [],
      );
      const speakers = new Set(
        segments.map((s: { speaker: string }) => s.speaker),
      );
      const formatted = segments
        .map(
          (s: { speaker: string; words?: { text: string }[] }) =>
            `${s.speaker}: ${(s.words || []).map((w) => w.text).join(' ')}`,
        )
        .join('\n\n');

      await supabase.from('meeting_transcripts').upsert(
        {
          meeting_id: meeting.id,
          raw_transcript: segments,
          formatted_text: formatted,
          word_count: allWords.length,
          speaker_count: speakers.size,
        },
        { onConflict: 'meeting_id' },
      );

      await supabase
        .from('meetings')
        .update({
          transcript_status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', meeting.id);
    } catch (err) {
      console.error(`Failed to fetch transcript for bot ${botId}:`, err);
      await supabase
        .from('meetings')
        .update({
          transcript_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', meeting.id);
    }

    // Run attendee matching
    await matchAttendeesForMeeting(supabase, meeting.id);
  } else if (statusCode === 'fatal') {
    await supabase
      .from('meetings')
      .update({
        status: 'failed',
        recall_bot_status: statusCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting.id);
  } else {
    // Update any other status
    await supabase
      .from('meetings')
      .update({
        recall_bot_status: statusCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting.id);
  }

  return NextResponse.json({ ok: true });
}
