/**
 * Batch set Bunny video thumbnails to the midpoint of each video.
 *
 * For each video:
 * 1. GET video metadata to find duration (length)
 * 2. POST update with thumbnailTime = length / 2 (midpoint)
 *
 * Run with:
 *   npx tsx tools/bunny_set_thumbnails.ts [--dry-run]
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const API_KEY = process.env.BUNNY_STREAM_KEY ?? '';
const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID ?? '604035';

if (!API_KEY) {
  console.error('Missing BUNNY_STREAM_KEY');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Collect all unique video IDs from reconciliation
// ---------------------------------------------------------------------------
interface BunnyVideo { id: string; title: string; }
interface RecoProject { bunny_videos: BunnyVideo[]; action: string; }

function getAllVideoIds(): BunnyVideo[] {
  const recoPath = resolve(__dirname, 'manual_reconciliation.json');
  const reco = JSON.parse(readFileSync(recoPath, 'utf-8'));
  const videos: BunnyVideo[] = [];
  const seen = new Set<string>();
  for (const proj of reco.projects as RecoProject[]) {
    if (proj.action === 'SKIP') continue;
    for (const v of proj.bunny_videos) {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        videos.push(v);
      }
    }
  }
  return videos;
}

// ---------------------------------------------------------------------------
// Bunny API helpers
// ---------------------------------------------------------------------------
async function getVideoInfo(videoId: string): Promise<{ length: number } | null> {
  const url = `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'AccessKey': API_KEY },
  });
  if (!res.ok) return null;
  const data = await res.json() as { length: number };
  return data;
}

async function setThumbnailTime(videoId: string, timeMs: number): Promise<boolean> {
  const url = `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'AccessKey': API_KEY,
    },
    body: JSON.stringify({ thumbnailTime: Math.round(timeMs) }),
  });
  return res.ok;
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n${DRY_RUN ? '🏜️  DRY RUN — ' : ''}Set Midpoint Thumbnails\n`);

  const videos = getAllVideoIds();
  console.log(`  ${videos.length} videos to process\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const info = await getVideoInfo(v.id);

    if (!info || !info.length || info.length <= 0) {
      console.log(`  ⚠ ${v.id} — no duration, skipping`);
      skipped++;
      await delay(50);
      continue;
    }

    // Bunny `length` is in seconds, thumbnailTime is in milliseconds
    const durationMs = info.length * 1000;
    const midpointMs = durationMs / 2;

    if (DRY_RUN) {
      console.log(`  [dry-run] ${v.id} — ${info.length}s → thumbnail at ${(midpointMs / 1000).toFixed(1)}s`);
    } else {
      const ok = await setThumbnailTime(v.id, midpointMs);
      if (ok) {
        success++;
        if (success % 20 === 0) {
          console.log(`  ✓ ${success}/${videos.length} thumbnails set...`);
        }
      } else {
        console.log(`  ✗ Failed: ${v.id}`);
        failed++;
      }
    }

    // Rate limit
    await delay(100);
  }

  console.log(`\n--- Summary ---\n`);
  console.log(`  Set:     ${success}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped} (no duration)`);
  if (DRY_RUN) console.log(`\n  (DRY RUN — no changes made)`);
  console.log('');
}

main().catch(console.error);
