import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const TOTAL_FRAMES = 15;

const SYSTEM_PROMPT = `You are analyzing a video production project by examining frames sampled at evenly-spaced intervals across the full runtime, plus project metadata. This data is used internally for AI-powered relevance matching to client proposals.

IMPORTANT: The metadata tells you the video duration and frame sampling density. For short videos (under 30s), the frames represent nearly every second. For longer videos (2+ minutes), frames are sampled sparsely — scene changes between frames imply significant pacing shifts.

Analyze EVERY frame. Return valid JSON only — no markdown fences, no explanation outside the JSON.

Return this exact structure:
{
  "visual_style": {
    "camera_movement": ["handheld", "gimbal", "locked-off", "drone", "slider", etc.],
    "framing": ["close-up", "wide", "medium", "macro", "over-the-shoulder", etc.],
    "lighting": "description of lighting approach",
    "visual_language": "overall visual style in one sentence"
  },
  "color_and_tone": {
    "palette": ["warm", "cool", "desaturated", "earth tones", etc.],
    "grade_style": "cinematic, clean, stylized, vintage, etc.",
    "emotional_tone": ["energetic", "intimate", "corporate", "playful", "dramatic", etc.]
  },
  "shot_types": ["interviews", "b-roll", "product shots", "lifestyle", "motion graphics", "text overlays", etc.],
  "production_approach": {
    "scale": "small/medium/large production",
    "style": "run-and-gun, controlled set, hybrid, etc.",
    "locations": "single studio, multi-location, indoor/outdoor, etc.",
    "talent_usage": "product-focused, talent-heavy, founder-led, etc."
  },
  "content_type": {
    "format": "brand film, product launch, kickstarter, testimonial, explainer, social, pitch, event, etc.",
    "audience": ["B2B", "consumer", "startup community", "investors", etc.]
  },
  "distinctive_elements": ["specific unique creative choices", "standout moments", "editing techniques"],
  "summary": "A 2-3 sentence natural language summary covering the most important visual and production characteristics."
}

Be specific in every field. Use concrete terms from the frames. Arrays should have 2-6 items each.`;

function getTimestamps(duration: number): number[] {
  const count = Math.min(TOTAL_FRAMES, Math.max(1, duration));
  if (count <= 1) return [0];
  const interval = duration / count;
  return Array.from({ length: count }, (_, i) => Math.round(i * interval));
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { projectId } = body as { projectId: string };
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

  const db = createServiceClient();

  // Get project
  const { data: project, error: projErr } = await db.from('projects')
    .select('id, title, subtitle, description, client_name, category, style_tags, premium_addons, camera_techniques, assets_delivered, production_days, crew_count, talent_count, location_count')
    .eq('id', projectId)
    .single();
  if (projErr || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Get flagship video
  const { data: videos } = await db.from('project_videos')
    .select('id, bunny_video_id, duration_seconds')
    .eq('project_id', projectId)
    .eq('video_type', 'flagship')
    .not('duration_seconds', 'is', null)
    .limit(1);

  const flagship = videos?.[0] as { id: string; bunny_video_id: string; duration_seconds: number } | undefined;
  if (!flagship) return NextResponse.json({ error: 'No flagship video with duration' }, { status: 404 });

  const timestamps = getTimestamps(flagship.duration_seconds);

  // Check if frames exist, if not we need them extracted first
  const { data: existingFrames } = await (db.from as Function)('project_video_frames')
    .select('id, storage_path, timestamp_seconds')
    .eq('video_id', flagship.id)
    .order('timestamp_seconds');

  if (!existingFrames || existingFrames.length < timestamps.length) {
    return NextResponse.json({ error: 'Frames not yet extracted. Run the extraction script first.' }, { status: 400 });
  }

  // Build frame URLs from Supabase storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const frameUrls = (existingFrames as { storage_path: string; timestamp_seconds: number }[])
    .map(f => `${supabaseUrl}/storage/v1/object/public/video-frames/${f.storage_path}`);

  // Build metadata
  const metadata = [
    `Title: ${project.title}`,
    project.subtitle ? `Subtitle: ${project.subtitle}` : null,
    project.description ? `Description: ${project.description}` : null,
    project.client_name ? `Client: ${project.client_name}` : null,
    project.category ? `Category: ${project.category}` : null,
    project.style_tags?.length ? `Style: ${(project.style_tags as string[]).join(', ')}` : null,
    project.premium_addons?.length ? `Add-ons: ${(project.premium_addons as string[]).join(', ')}` : null,
    project.camera_techniques?.length ? `Camera: ${(project.camera_techniques as string[]).join(', ')}` : null,
    project.assets_delivered?.length ? `Assets: ${(project.assets_delivered as string[]).join(', ')}` : null,
    project.production_days ? `Production days: ${project.production_days}` : null,
    project.crew_count ? `Crew: ${project.crew_count}` : null,
    project.talent_count ? `Talent: ${project.talent_count}` : null,
    project.location_count ? `Locations: ${project.location_count}` : null,
    `Duration: ${flagship.duration_seconds}s`,
    `Frames: ${frameUrls.length}`,
  ].filter(Boolean).join('\n');

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  for (const url of frameUrls) {
    content.push({ type: 'image', source: { type: 'url', url } } as Anthropic.Messages.ContentBlockParam);
  }
  content.push({ type: 'text', text: metadata });

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const text = response.content.find(b => b.type === 'text');
    if (!text || text.type !== 'text') {
      return NextResponse.json({ error: 'Empty response from Claude' }, { status: 500 });
    }

    const parsed = JSON.parse(text.text);
    const summary = parsed.summary ?? '';

    await db.from('projects').update({
      ai_description: summary,
      ai_description_json: parsed,
    } as never).eq('id', projectId);

    return NextResponse.json({ description: summary, json: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
