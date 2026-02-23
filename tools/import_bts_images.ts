/**
 * import_bts_images.ts — Import scraped BTS photos into Supabase
 *
 * Reads .firecrawl/bts/*_with_imgs.json (produced by tools/scrape_bts.sh),
 * matches each file's slug to a Supabase project ID, then upserts records
 * into the project_bts_images table.
 *
 * Usage:
 *   npx tsx tools/import_bts_images.ts           # live import
 *   npx tsx tools/import_bts_images.ts --dry-run # preview only, no DB writes
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for bypassing RLS).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BTS_DIR = resolve(ROOT, '.firecrawl/bts');

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
try {
  const envFile = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // already set in environment
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Extract image URLs from scraped markdown
// ---------------------------------------------------------------------------
function extractImageUrls(markdown: string): string[] {
  // Matches ![alt](url) — the format firecrawl uses for inline images
  const matches = [...markdown.matchAll(/!\[.*?\]\((https?:\/\/[^)]+)\)/g)];
  const urls = matches.map((m) => m[1]);

  // Deduplicate (same image may appear in srcset variants)
  const seen = new Set<string>();
  return urls.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (DRY_RUN) {
    console.log('🔍  DRY RUN — no database writes will be made\n');
  }

  // 1. Fetch all project slugs → IDs from Supabase
  const { data: projects, error: fetchErr } = await supabase
    .from('projects')
    .select('id, slug, title');

  if (fetchErr || !projects) {
    console.error('❌  Failed to fetch projects:', fetchErr?.message);
    process.exit(1);
  }

  const slugToId = Object.fromEntries(projects.map((p) => [p.slug, p.id]));
  const slugToTitle = Object.fromEntries(projects.map((p) => [p.slug, p.title]));
  console.log(`📋  Found ${projects.length} projects in Supabase\n`);

  // 2. Find all scraped _with_imgs.json files
  const files = readdirSync(BTS_DIR)
    .filter((f) => f.endsWith('_with_imgs.json'))
    .sort();

  if (files.length === 0) {
    console.error(`❌  No *_with_imgs.json files found in ${BTS_DIR}`);
    console.error('    Run: bash tools/scrape_bts.sh first');
    process.exit(1);
  }

  // 3. Process each file
  let totalInserted = 0;
  let matchedProjects = 0;
  let skippedProjects = 0;

  for (const filename of files) {
    const slug = filename.replace('_with_imgs.json', '');
    const projectId = slugToId[slug];
    const title = slugToTitle[slug] ?? slug;

    if (!projectId) {
      console.log(`  ⚠️  ${slug}: no matching project in Supabase — skipping`);
      skippedProjects++;
      continue;
    }

    const filepath = resolve(BTS_DIR, filename);
    const raw = JSON.parse(readFileSync(filepath, 'utf-8'));
    const markdown: string = raw.markdown ?? '';
    const imageUrls = extractImageUrls(markdown);

    if (imageUrls.length === 0) {
      console.log(`  ⏭️  ${slug} (${title}): no images found`);
      skippedProjects++;
      continue;
    }

    console.log(`  ✓  ${slug} (${title}): ${imageUrls.length} images`);
    if (DRY_RUN) {
      imageUrls.forEach((url, i) => console.log(`       [${i}] ${url}`));
      matchedProjects++;
      totalInserted += imageUrls.length;
      continue;
    }

    // Delete existing BTS images for this project, then insert fresh
    const { error: deleteErr } = await supabase
      .from('project_bts_images')
      .delete()
      .eq('project_id', projectId);

    if (deleteErr) {
      console.error(`      ❌  Delete failed for ${slug}: ${deleteErr.message}`);
      continue;
    }

    const rows = imageUrls.map((url, i) => ({
      project_id: projectId,
      image_url: url,
      caption: null,
      sort_order: i,
    }));

    const { error: insertErr } = await supabase
      .from('project_bts_images')
      .insert(rows);

    if (insertErr) {
      console.error(`      ❌  Insert failed for ${slug}: ${insertErr.message}`);
      continue;
    }

    matchedProjects++;
    totalInserted += imageUrls.length;
  }

  // 4. Summary
  console.log(`\n${'─'.repeat(50)}`);
  if (DRY_RUN) {
    console.log(`🔍  DRY RUN complete — would insert:`);
  } else {
    console.log(`🎉  Import complete:`);
  }
  console.log(`    ${totalInserted} images across ${matchedProjects} projects`);
  if (skippedProjects > 0) {
    console.log(`    ${skippedProjects} projects skipped (no match or no images)`);
  }
  console.log('');
  console.log('→  Open /admin/projects, click any project, and check the BTS tab.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
