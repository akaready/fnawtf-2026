/**
 * Batch rename Bunny CDN video titles to consistent format:
 *   "Client - Video Title"
 *
 * Uses manual_reconciliation.json as the source of truth for:
 *   - Which client each video belongs to
 *   - The stripped video title (no client prefix)
 *
 * Run with:
 *   npx tsx tools/bunny_rename.ts [--dry-run]
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

// Use BUNNY_STREAM_KEY for library 604035 (BUNNY_API_KEY is for library 600543)
const API_KEY = process.env.BUNNY_STREAM_KEY ?? '';
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID ?? '604035';

if (!API_KEY) {
  console.error('Missing BUNNY_STREAM_KEY in .env.local');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BunnyVideo {
  title: string;
  id: string;
  type: string;
}

interface ReconciliationProject {
  client: string;
  bunny_videos: BunnyVideo[];
  action: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Strip client prefix from video title
// ---------------------------------------------------------------------------
function stripClientPrefix(title: string): string {
  const separators = ['•', '·', ' - '];
  for (const sep of separators) {
    const idx = title.indexOf(sep);
    if (idx !== -1) {
      return title.slice(idx + sep.length).trim();
    }
  }
  return title;
}

// ---------------------------------------------------------------------------
// Build new title: "Client - Video Title"
// ---------------------------------------------------------------------------
function buildNewTitle(client: string, originalTitle: string): string {
  const stripped = stripClientPrefix(originalTitle);
  // If stripping didn't change anything (no separator found),
  // the title IS the video name — just prefix with client
  if (stripped === originalTitle) {
    return `${client} - ${originalTitle}`;
  }
  return `${client} - ${stripped}`;
}

// ---------------------------------------------------------------------------
// Bunny API: rename a video
// ---------------------------------------------------------------------------
async function renameVideo(videoId: string, newTitle: string): Promise<boolean> {
  const url = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'AccessKey': API_KEY,
    },
    body: JSON.stringify({ title: newTitle }),
  });

  if (!res.ok) {
    console.error(`  ✗ Rename ${videoId}: HTTP ${res.status}`);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Rate limiter: simple delay between API calls
// ---------------------------------------------------------------------------
function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n${DRY_RUN ? '🏜️  DRY RUN — ' : ''}Bunny Video Rename\n`);

  // Load reconciliation
  const recoPath = resolve(__dirname, 'manual_reconciliation.json');
  const reco = JSON.parse(readFileSync(recoPath, 'utf-8'));
  const projects: ReconciliationProject[] = reco.projects;

  // Build rename map: videoId → { oldTitle, newTitle, client }
  const renames: Array<{
    videoId: string;
    oldTitle: string;
    newTitle: string;
    client: string;
  }> = [];

  for (const proj of projects) {
    if (proj.action === 'SKIP') continue;
    for (const video of proj.bunny_videos) {
      const newTitle = buildNewTitle(proj.client, video.title);
      if (newTitle !== video.title) {
        renames.push({
          videoId: video.id,
          oldTitle: video.title,
          newTitle,
          client: proj.client,
        });
      }
    }
  }

  console.log(`  ${renames.length} videos to rename\n`);

  // Show preview of changes
  if (DRY_RUN) {
    // Group by client for readability
    const byClient = new Map<string, typeof renames>();
    for (const r of renames) {
      if (!byClient.has(r.client)) byClient.set(r.client, []);
      byClient.get(r.client)!.push(r);
    }

    for (const [client, clientRenames] of byClient) {
      console.log(`  ${client}:`);
      for (const r of clientRenames) {
        console.log(`    "${r.oldTitle}"`);
        console.log(`    → "${r.newTitle}"`);
      }
      console.log('');
    }

    console.log(`\n  (DRY RUN — ${renames.length} renames would be applied)`);
    return;
  }

  // Execute renames with rate limiting
  let success = 0;
  let failed = 0;

  for (let i = 0; i < renames.length; i++) {
    const r = renames[i];
    const ok = await renameVideo(r.videoId, r.newTitle);
    if (ok) {
      success++;
      if (success % 10 === 0) {
        console.log(`  ✓ ${success}/${renames.length} renamed...`);
      }
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    if (i < renames.length - 1) await delay(100);
  }

  console.log(`\n--- Summary ---\n`);
  console.log(`  Renamed: ${success}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${projects.reduce((n, p) => n + p.bunny_videos.length, 0) - renames.length} (already correct or SKIP)`);
  console.log('');
}

main().catch(console.error);
