import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  createAsyncTranscript,
  getTranscript,
  downloadTranscript,
} from '@/lib/recall';
import { matchAttendeesForMeeting } from '@/lib/meetings/matchAttendees';

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-recall-webhook-secret');
  if (
    process.env.RECALL_WEBHOOK_SECRET &&
    secret !== process.env.RECALL_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();
  const { event, data } = body;
  console.log('Recall webhook:', event, JSON.stringify(data, null, 2));

  if (!event || !data) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const botId = data.bot?.id;

  // ── Bot status change events ────────────────────────────────────────────
  // These fire as the bot joins, records, and leaves the meeting
  if (event === 'bot.status_change') {
    if (!botId) return NextResponse.json({ ok: true });

    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('recall_bot_id', botId)
      .single();

    if (!meeting) {
      console.warn(`Bot status webhook for unknown bot: ${botId}`);
      return NextResponse.json({ ok: true });
    }

    const statusCode = data.data?.code;

    if (statusCode === 'in_call_recording') {
      await supabase
        .from('meetings')
        .update({
          status: 'in_progress',
          recall_bot_status: statusCode,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);
    } else if (statusCode === 'fatal') {
      await supabase
        .from('meetings')
        .update({
          status: 'failed',
          recall_bot_status: statusCode,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);
    } else if (statusCode === 'done') {
      await supabase
        .from('meetings')
        .update({
          status: 'completed',
          recall_bot_status: statusCode,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);
    } else if (statusCode) {
      await supabase
        .from('meetings')
        .update({
          recall_bot_status: statusCode,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);
    }

    return NextResponse.json({ ok: true });
  }

  // ── Recording done → kick off async transcription ──────────────────────
  if (event === 'recording.done') {
    const recordingId = data.recording?.id;
    if (!recordingId || !botId) return NextResponse.json({ ok: true });

    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('recall_bot_id', botId)
      .single();

    if (meeting) {
      await supabase
        .from('meetings')
        .update({
          status: 'completed',
          transcript_status: 'pending',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);
    }

    // Step 4: Create async transcript job
    try {
      await createAsyncTranscript(recordingId);
      console.log(`Async transcription started for recording ${recordingId}`);
    } catch (err) {
      console.error(`Failed to start transcription for recording ${recordingId}:`, err);
      if (meeting) {
        await supabase
          .from('meetings')
          .update({
            transcript_status: 'failed',
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', meeting.id);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // ── Transcript done → fetch and store ──────────────────────────────────
  if (event === 'transcript.done') {
    const transcriptId = data.transcript?.id;
    if (!transcriptId || !botId) return NextResponse.json({ ok: true });

    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('recall_bot_id', botId)
      .single();

    if (!meeting) {
      console.warn(`Transcript webhook for unknown bot: ${botId}`);
      return NextResponse.json({ ok: true });
    }

    try {
      // Step 6: Fetch transcript metadata (includes download_url)
      const transcriptMeta = await getTranscript(transcriptId);
      const downloadUrl = transcriptMeta.data?.download_url;

      if (!downloadUrl) {
        throw new Error('No download_url in transcript response');
      }

      // Download the actual transcript data
      const segments = await downloadTranscript(downloadUrl);

      const segmentArray = Array.isArray(segments) ? segments : [];
      const allWords = segmentArray.flatMap(
        (s: { words?: { text: string }[] }) => s.words || [],
      );
      const speakers = new Set(
        segmentArray.map((s: { speaker: string }) => s.speaker),
      );
      const formatted = segmentArray
        .map(
          (s: { speaker: string; words?: { text: string }[] }) =>
            `${s.speaker}: ${(s.words || []).map((w) => w.text).join(' ')}`,
        )
        .join('\n\n');

      await supabase.from('meeting_transcripts').upsert(
        {
          meeting_id: meeting.id,
          raw_transcript: segmentArray,
          formatted_text: formatted,
          word_count: allWords.length,
          speaker_count: speakers.size,
        } as never,
        { onConflict: 'meeting_id' },
      );

      await supabase
        .from('meetings')
        .update({
          transcript_status: 'ready',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);

      console.log(`Transcript stored for meeting ${meeting.id}`);
    } catch (err) {
      console.error(`Failed to fetch transcript ${transcriptId}:`, err);
      await supabase
        .from('meetings')
        .update({
          transcript_status: 'failed',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);
    }

    // Run attendee matching after transcript
    await matchAttendeesForMeeting(supabase, meeting.id);

    return NextResponse.json({ ok: true });
  }

  // ── Transcript failed ──────────────────────────────────────────────────
  if (event === 'transcript.failed') {
    if (!botId) return NextResponse.json({ ok: true });

    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('recall_bot_id', botId)
      .single();

    if (meeting) {
      await supabase
        .from('meetings')
        .update({
          transcript_status: 'failed',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', meeting.id);
    }

    return NextResponse.json({ ok: true });
  }

  // Unknown event — log and acknowledge
  console.log(`Unhandled Recall webhook event: ${event}`);
  return NextResponse.json({ ok: true });
}
