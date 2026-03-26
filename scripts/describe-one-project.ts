import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'child_process';
import { readFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';

const CDN_HOSTNAME = 'vz-6b68e26c-531.b-cdn.net';
const TOTAL_FRAMES = 15;
const TMP_DIR = '/tmp/video-frames-extract';

const SYSTEM_PROMPT = `You are analyzing a video production project by examining frames sampled at evenly-spaced intervals across the full runtime, plus project metadata. This description is used internally for AI-powered relevance matching to client proposals — it is never shown to users.

IMPORTANT: The metadata tells you the video duration and frame sampling density. For short videos (under 30s), the frames represent nearly every second — each is a distinct moment. For longer videos (2+ minutes), frames are sampled sparsely — scene changes between frames imply significant pacing shifts. Factor this into your analysis.

Write a detailed 8-12 sentence description covering ALL of the following:

1. VISUAL STYLE: Camera movement (handheld, gimbal, locked-off, drone, slider), framing choices (close-ups, wides, medium shots, macro), lighting style (natural, studio, moody, high-key, mixed), and overall visual language.
2. COLOR & TONE: Color palette (warm, cool, desaturated, vibrant, filmic), grade style (cinematic, clean, stylized, vintage), and emotional tone (energetic, intimate, corporate, playful, dramatic, aspirational, documentary).
3. SHOT TYPES & SCENES: What types of shots appear throughout — interviews/talking heads, b-roll, product shots, lifestyle, action, testimonials, behind-the-scenes, motion graphics, text overlays, screen recordings, aerial, slow-motion. Describe the variety and pacing.
4. PRODUCTION APPROACH: Scale and style — run-and-gun vs. controlled set, single vs. multi-location, indoor/outdoor, talent-heavy vs. product-focused.
5. CONTENT TYPE & AUDIENCE: What kind of content and who it targets.
6. WHAT MAKES IT DISTINCTIVE: Unique creative choices, standout visual moments, editing style, pacing.

Analyze EVERY frame provided. Be specific — "warm handheld close-ups with shallow depth of field" not "nice cinematography."`;

function getTimestamps(duration: number): number[] {
  const count = Math.min(TOTAL_FRAMES, Math.max(1, duration));
  if (count <= 1) return [0];
  const interval = duration / count;
  return Array.from({ length: count }, (_, i) => Math.round(i * interval));
}

async function main() {
  const projectTitle = process.argv[2] || 'Atmos Sleep Lamp';
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const anthropic = new Anthropic();

  // Find project
  const { data: projects } = await supabase.from('projects')
    .select('id, title, subtitle, description, client_name, category, style_tags, premium_addons, camera_techniques, assets_delivered, production_days, crew_count, talent_count, location_count')
    .eq('published', true)
    .ilike('title', `%${projectTitle}%`)
    .limit(1);

  const project = projects?.[0];
  if (!project) { console.log(`Project "${projectTitle}" not found`); return; }
  console.log(`Project: ${project.title} (${project.id})`);

  // Find flagship video
  const { data: videos } = await supabase.from('project_videos')
    .select('id, bunny_video_id, duration_seconds')
    .eq('project_id', project.id)
    .eq('video_type', 'flagship')
    .not('duration_seconds', 'is', null)
    .limit(1);

  const flagship = videos?.[0] as { id: string; bunny_video_id: string; duration_seconds: number } | undefined;
  if (!flagship) { console.log('No flagship video with duration'); return; }
  console.log(`Video: ${flagship.bunny_video_id} (${flagship.duration_seconds}s)`);

  const timestamps = getTimestamps(flagship.duration_seconds);
  console.log(`Timestamps (${timestamps.length}): ${timestamps.join(', ')}`);

  // Step 1: Download MP4
  const mp4Url = `https://${CDN_HOSTNAME}/${flagship.bunny_video_id}/play_720p.mp4`;
  const mp4Path = join(TMP_DIR, `${flagship.bunny_video_id}.mp4`);
  const framesDir = join(TMP_DIR, flagship.id);

  mkdirSync(framesDir, { recursive: true });

  console.log('\nDownloading MP4...');
  execFileSync('curl', ['-sL', '-o', mp4Path, mp4Url], { timeout: 120000 });
  console.log('Downloaded');

  // Step 2: Extract frames with ffmpeg
  console.log('Extracting frames with ffmpeg...');
  for (const t of timestamps) {
    const outPath = join(framesDir, `${t}s.jpg`);
    execFileSync('ffmpeg', ['-y', '-ss', String(t), '-i', mp4Path, '-frames:v', '1', '-q:v', '2', outPath], {
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  const extractedFiles = readdirSync(framesDir).filter(f => f.endsWith('.jpg'));
  console.log(`Extracted ${extractedFiles.length} frames`);

  // Step 3: Delete old frames and upload new ones
  await (supabase.from as Function)('project_video_frames').delete().eq('video_id', flagship.id);
  console.log('Old DB frames cleared');

  const { data: oldFiles } = await supabase.storage.from('video-frames').list(flagship.id);
  if (oldFiles && oldFiles.length > 0) {
    await supabase.storage.from('video-frames').remove(oldFiles.map(f => `${flagship.id}/${f.name}`));
  }

  let stored = 0;
  for (const t of timestamps) {
    const filePath = join(framesDir, `${t}s.jpg`);
    const storagePath = `${flagship.id}/${t}s.jpg`;
    try {
      const buffer = readFileSync(filePath);
      console.log(`  ${t}s: ${Math.round(buffer.length / 1024)}KB`);
      await supabase.storage.from('video-frames').upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
      await (supabase.from as Function)('project_video_frames').upsert({
        video_id: flagship.id,
        timestamp_seconds: t,
        storage_path: storagePath,
      }, { onConflict: 'video_id,timestamp_seconds' });
      stored++;
    } catch (err) {
      console.log(`  ${t}s: error — ${(err as Error).message?.slice(0, 60)}`);
    }
  }
  console.log(`Stored: ${stored}/${timestamps.length} frames`);

  // Step 4: Send to Claude
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const frameUrls = timestamps.map(t => `${supabaseUrl}/storage/v1/object/public/video-frames/${flagship.id}/${t}s.jpg`);

  const metadata = [
    `Title: ${project.title}`,
    project.subtitle ? `Subtitle: ${project.subtitle}` : null,
    project.description ? `Description: ${project.description}` : null,
    project.client_name ? `Client: ${project.client_name}` : null,
    project.category ? `Category: ${project.category}` : null,
    project.style_tags?.length ? `Style: ${(project.style_tags as string[]).join(', ')}` : null,
    `Duration: ${flagship.duration_seconds}s`,
    `Frames: ${timestamps.length} (1 every ${Math.round(flagship.duration_seconds / timestamps.length)}s)`,
  ].filter(Boolean).join('\n');

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  for (const url of frameUrls) {
    content.push({ type: 'image', source: { type: 'url', url } } as Anthropic.Messages.ContentBlockParam);
  }
  content.push({ type: 'text', text: metadata });

  console.log('\nSending to Claude Sonnet...');
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const text = response.content.find(b => b.type === 'text');
    if (text && text.type === 'text') {
      await supabase.from('projects').update({ ai_description: text.text } as never).eq('id', project.id);
      console.log(`\n✓ Description saved (${text.text.length} chars):`);
      console.log('---');
      console.log(text.text);
      console.log('---');
      console.log(`Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);
    }
  } catch (err) {
    console.log(`\n✗ Claude failed: ${(err as Error).message?.slice(0, 100)}`);
  }

  // Cleanup MP4
  rmSync(mp4Path, { force: true });
  console.log('\nDone');
}

main().catch(console.error);
