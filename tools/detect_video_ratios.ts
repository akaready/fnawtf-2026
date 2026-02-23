/**
 * Batch-detect aspect ratios for all project_videos by querying Bunny Stream API.
 * Updates the aspect_ratio column in Supabase for each video.
 *
 * Run with:
 *   npx tsx tools/detect_video_ratios.ts [--dry-run]
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf-8');
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!(key in process.env)) process.env[key] = val;
}

const BUNNY_STREAM_KEY = process.env.BUNNY_STREAM_KEY ?? '';
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID ?? '604035';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!BUNNY_STREAM_KEY) { console.error('Missing BUNNY_STREAM_KEY'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

function detectRatio(width: number, height: number): AspectRatio {
  const r = width / height;
  if (r > 2.3) return '21:9';
  if (r > 1.7) return '16:9';
  if (r > 1.3) return '4:3';
  if (r > 0.9) return '1:1';
  return '9:16';
}

async function getBunnyDimensions(videoId: string): Promise<{ width: number; height: number } | null> {
  const url = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', AccessKey: BUNNY_STREAM_KEY },
  });
  if (!res.ok) return null;
  const data = await res.json() as { width?: number; height?: number };
  if (!data.width || !data.height) return null;
  return { width: data.width, height: data.height };
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Detect Video Aspect Ratios\n`);

  const { data: videos, error } = await supabase
    .from('project_videos')
    .select('id, bunny_video_id, title, aspect_ratio')
    .order('id');

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  if (!videos?.length) { console.log('No videos found.'); return; }

  console.log(`  ${videos.length} videos to process\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of videos) {
    const dims = await getBunnyDimensions(video.bunny_video_id);

    if (!dims) {
      console.log(`  ⚠  ${video.title} (${video.bunny_video_id}) — could not fetch dimensions`);
      failed++;
      await delay(100);
      continue;
    }

    const ratio = detectRatio(dims.width, dims.height);
    const changed = ratio !== video.aspect_ratio;

    if (!changed) {
      skipped++;
    } else if (DRY_RUN) {
      console.log(`  [dry-run] ${video.title}: ${video.aspect_ratio} → ${ratio} (${dims.width}×${dims.height})`);
      updated++;
    } else {
      const { error: updateError } = await supabase
        .from('project_videos')
        .update({ aspect_ratio: ratio })
        .eq('id', video.id);

      if (updateError) {
        console.log(`  ✗ Failed ${video.title}: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✓ ${video.title}: ${video.aspect_ratio} → ${ratio} (${dims.width}×${dims.height})`);
        updated++;
      }
    }

    await delay(80);
  }

  console.log(`\n--- Summary ---`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Already correct: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  if (DRY_RUN) console.log(`\n  (DRY RUN — no changes written)`);
  console.log('');
}

main().catch(console.error);
