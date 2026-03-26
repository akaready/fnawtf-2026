import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'child_process';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const CDN_HOSTNAME = 'vz-6b68e26c-531.b-cdn.net';
const TOTAL_FRAMES = 15;
const DELAY_MS = 65_000;
const TMP_DIR = '/tmp/video-frames-extract';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

Be specific in every field. Use concrete terms from the frames — "warm golden-hour handheld" not "nice look". Arrays should have 2-6 items each.`;

function getTimestamps(duration: number): number[] {
  const count = Math.min(TOTAL_FRAMES, Math.max(1, duration));
  if (count <= 1) return [0];
  const interval = duration / count;
  return Array.from({ length: count }, (_, i) => Math.round(i * interval));
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const anthropic = new Anthropic();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  mkdirSync(TMP_DIR, { recursive: true });

  // Get all published projects with flagship videos
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, subtitle, description, client_name, category, style_tags, premium_addons, camera_techniques, assets_delivered, production_days, crew_count, talent_count, location_count')
    .eq('published', true)
    .order('title');

  if (error) { console.error(error); return; }
  console.log(`Total: ${projects!.length}\n`);

  let described = 0;
  let totalFramesStored = 0;
  let skipped = 0;

  for (let i = 0; i < projects!.length; i++) {
    const project = projects![i];

    const { data: videos } = await supabase
      .from('project_videos')
      .select('id, bunny_video_id, duration_seconds')
      .eq('project_id', project.id)
      .eq('video_type', 'flagship')
      .not('duration_seconds', 'is', null)
      .limit(1);

    const flagship = videos?.[0] as { id: string; bunny_video_id: string; duration_seconds: number } | undefined;
    if (!flagship) {
      console.log(`${i + 1}/${projects!.length} ${project.title} — skip (no flagship)`);
      skipped++;
      continue;
    }

    // Check if already has frames + description
    const { data: existingFrames } = await (supabase.from as Function)('project_video_frames')
      .select('id')
      .eq('video_id', flagship.id);
    const { data: existingDesc } = await supabase
      .from('projects')
      .select('ai_description')
      .eq('id', project.id)
      .single();

    const hasFrames = existingFrames && existingFrames.length >= TOTAL_FRAMES;
    const hasDesc = !!(existingDesc as { ai_description: string | null } | null)?.ai_description;

    if (hasFrames && hasDesc) {
      console.log(`${i + 1}/${projects!.length} ${project.title} — already done`);
      continue;
    }

    const timestamps = getTimestamps(flagship.duration_seconds);
    console.log(`${i + 1}/${projects!.length} ${project.title} (${flagship.duration_seconds}s, ${timestamps.length}f)`);

    // Step 1: Extract frames with ffmpeg (if needed)
    if (!hasFrames) {
      const mp4Url = `https://${CDN_HOSTNAME}/${flagship.bunny_video_id}/play_720p.mp4`;
      const mp4Path = join(TMP_DIR, `${flagship.bunny_video_id}.mp4`);
      const framesDir = join(TMP_DIR, flagship.id);
      mkdirSync(framesDir, { recursive: true });

      try {
        // Download MP4
        process.stdout.write('  dl... ');
        execFileSync('curl', ['-sL', '-o', mp4Path, mp4Url], { timeout: 120000 });

        // Extract frames
        process.stdout.write('ffmpeg... ');
        for (const t of timestamps) {
          const outPath = join(framesDir, `${t}s.jpg`);
          execFileSync('ffmpeg', ['-y', '-ss', String(t), '-i', mp4Path, '-frames:v', '1', '-q:v', '2', outPath], {
            timeout: 10000,
            stdio: ['pipe', 'pipe', 'pipe'],
          });
        }

        // Clear old frames
        await (supabase.from as Function)('project_video_frames').delete().eq('video_id', flagship.id);
        const { data: oldFiles } = await supabase.storage.from('video-frames').list(flagship.id);
        if (oldFiles && oldFiles.length > 0) {
          await supabase.storage.from('video-frames').remove(oldFiles.map(f => `${flagship.id}/${f.name}`));
        }

        // Upload frames
        let stored = 0;
        for (const t of timestamps) {
          const filePath = join(framesDir, `${t}s.jpg`);
          const storagePath = `${flagship.id}/${t}s.jpg`;
          if (!existsSync(filePath)) continue;
          const buffer = readFileSync(filePath);
          await supabase.storage.from('video-frames').upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
          await (supabase.from as Function)('project_video_frames').upsert({
            video_id: flagship.id,
            timestamp_seconds: t,
            storage_path: storagePath,
          }, { onConflict: 'video_id,timestamp_seconds' });
          stored++;
        }
        totalFramesStored += stored;
        process.stdout.write(`${stored}f stored... `);

        // Cleanup
        rmSync(mp4Path, { force: true });
        rmSync(framesDir, { recursive: true, force: true });
      } catch (err) {
        console.log(`\n  extract FAIL: ${(err as Error).message?.slice(0, 60)}`);
        rmSync(join(TMP_DIR, `${flagship.bunny_video_id}.mp4`), { force: true });
        continue;
      }
    } else {
      process.stdout.write('  frames exist... ');
    }

    // Step 2: Send to Claude for description (if needed)
    if (!hasDesc) {
      const frameUrls = timestamps.map(t =>
        `${supabaseUrl}/storage/v1/object/public/video-frames/${flagship.id}/${t}s.jpg`
      );

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
        `Frames: ${timestamps.length} (1 every ${Math.round(flagship.duration_seconds / timestamps.length)}s)`,
      ].filter(Boolean).join('\n');

      const content: Anthropic.Messages.ContentBlockParam[] = [];
      for (const url of frameUrls) {
        content.push({ type: 'image', source: { type: 'url', url } } as Anthropic.Messages.ContentBlockParam);
      }
      content.push({ type: 'text', text: metadata });

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content }],
        });

        const text = response.content.find(b => b.type === 'text');
        if (text && text.type === 'text') {
          const parsed = JSON.parse(text.text);
          const summary = parsed.summary ?? '';
          await supabase.from('projects').update({
            ai_description: summary,
            ai_description_json: parsed,
          } as never).eq('id', project.id);
          described++;
          console.log(`ok (${text.text.length}c)`);
        } else {
          console.log('empty response');
        }
      } catch (err) {
        console.log(`FAIL: ${(err as Error).message?.slice(0, 60)}`);
      }

      // Rate limit delay
      if (i + 1 < projects!.length) await sleep(DELAY_MS);
    } else {
      console.log('desc exists');
    }
  }

  console.log(`\nDone: ${described} described, ${totalFramesStored} frames stored, ${skipped} skipped`);
}

main().catch(console.error);
