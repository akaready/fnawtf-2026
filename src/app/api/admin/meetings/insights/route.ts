import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/** PATCH — update summary and/or action items */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { meetingId, summary, actionItems } = (await request.json()) as {
    meetingId: string;
    summary?: string;
    actionItems?: { text: string; assignee: string | null; done: boolean }[];
  };

  const updates: Record<string, unknown> = {};
  if (summary !== undefined) updates.summary = summary;
  if (actionItems !== undefined) updates.action_items = actionItems;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const serviceDb = createServiceClient();
  const { error } = await serviceDb
    .from('meeting_transcripts')
    .update(updates as never)
    .eq('meeting_id', meetingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { meetingId } = (await request.json()) as { meetingId: string };
  if (!meetingId) return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });

  const serviceDb = createServiceClient();

  // Fetch meeting with transcript and attendees
  const { data: meeting, error: meetingErr } = await serviceDb
    .from('meetings')
    .select(`
      id, title, start_time, end_time, description,
      meeting_attendees (display_name, email, is_organizer),
      meeting_transcripts (id, raw_transcript, formatted_text, word_count),
      meeting_relationships (
        clients (name),
        contacts (first_name, last_name)
      )
    `)
    .eq('id', meetingId)
    .single();

  if (meetingErr || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const transcript = (meeting as Record<string, unknown>).meeting_transcripts as {
    id: string;
    raw_transcript: unknown[];
    formatted_text: string | null;
    word_count: number | null;
  } | null;

  if (!transcript?.formatted_text && !transcript?.raw_transcript?.length) {
    return NextResponse.json({ error: 'No transcript available' }, { status: 400 });
  }

  // Mark as pending
  await serviceDb
    .from('meeting_transcripts')
    .update({ insights_status: 'pending' } as never)
    .eq('id', transcript.id);

  // Build transcript text for the prompt
  const attendees = ((meeting as Record<string, unknown>).meeting_attendees || []) as {
    display_name: string | null;
    email: string;
    is_organizer: boolean;
  }[];
  const relationships = ((meeting as Record<string, unknown>).meeting_relationships || []) as {
    clients: { name: string } | null;
    contacts: { first_name: string; last_name: string } | null;
  }[];

  // Figure out who the FNA account speaker is
  const readyPresent = attendees.some(
    (a) =>
      (a.display_name || '').toLowerCase().includes('ready') ||
      a.email.toLowerCase().includes('ready'),
  );
  const richiePresent = attendees.some(
    (a) =>
      (a.display_name || '').toLowerCase().includes('richie') ||
      (a.display_name || '').toLowerCase().includes('richard') ||
      a.email.toLowerCase().includes('richie'),
  );
  const fnaSpeakerName =
    readyPresent && !richiePresent ? 'Richie' : richiePresent && !readyPresent ? 'Ready' : 'Richie';

  const transcriptText =
    transcript.formatted_text ||
    (transcript.raw_transcript as { participant?: { name: string }; speaker?: string; words: { text: string }[] }[])
      .map((seg) => {
        const name = seg.participant?.name || seg.speaker || 'Speaker';
        const resolved = name === "Friends 'n Allies" ? fnaSpeakerName : name;
        return `${resolved}: ${seg.words.map((w) => w.text).join(' ')}`;
      })
      .join('\n\n');

  const meetingTitle = (meeting as Record<string, unknown>).title as string;
  const startTime = (meeting as Record<string, unknown>).start_time as string;
  const companies = relationships
    .filter((r) => r.clients)
    .map((r) => r.clients!.name);
  const contacts = relationships
    .filter((r) => r.contacts)
    .map((r) => `${r.contacts!.first_name} ${r.contacts!.last_name}`);
  const attendeeNames = attendees.map((a) => a.display_name || a.email);

  const systemPrompt = `You are a meeting analyst for Friends 'n Allies (FNA), a creative agency. Extract structured insights from meeting transcripts.

Meeting: "${meetingTitle}"
Date: ${new Date(startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
Attendees: ${attendeeNames.join(', ')}
${companies.length ? `Companies: ${companies.join(', ')}` : ''}
${contacts.length ? `Contacts: ${contacts.join(', ')}` : ''}

The shared Zoom account "Friends 'n Allies" is actually ${fnaSpeakerName} speaking. Always use "${fnaSpeakerName}" instead of "Friends 'n Allies" in your output.

Respond with valid JSON only, no markdown fences. Use this exact structure:
{
  "summary": "- Bullet point 1\n- Bullet point 2\n- Bullet point 3",
  "actionItems": [
    { "text": "Description of the action item" }
  ]
}

Guidelines:
- Summary should be 3-6 bullet points, each a concise sentence. No paragraphs.
- Action items should be specific and actionable, not vague
- Do NOT include assignees on action items
- If no clear action items exist, return an empty array
- Focus on business-relevant content, skip small talk`;

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the meeting transcript:\n\n${transcriptText}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed: { summary: string; actionItems: { text: string; assignee: string | null }[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown fences
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse Claude response as JSON');
      }
    }

    const actionItems = (parsed.actionItems || []).map((item) => ({
      text: item.text,
      assignee: item.assignee || null,
      done: false,
    }));

    // Store results
    await serviceDb
      .from('meeting_transcripts')
      .update({
        summary: parsed.summary,
        action_items: actionItems,
        insights_status: 'ready',
        insights_generated_at: new Date().toISOString(),
      } as never)
      .eq('id', transcript.id);

    return NextResponse.json({
      summary: parsed.summary,
      actionItems,
    });
  } catch (err) {
    console.error('Insights generation failed:', err);
    await serviceDb
      .from('meeting_transcripts')
      .update({ insights_status: 'failed' } as never)
      .eq('id', transcript.id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
