/**
 * migrate_bts_to_supabase.ts
 *
 * Downloads BTS images from the old carbonmade CDN and re-uploads them to
 * Supabase Storage, then updates project_bts_images with the new public URLs.
 *
 * Usage:
 *   npx tsx tools/migrate_bts_to_supabase.ts           # live
 *   npx tsx tools/migrate_bts_to_supabase.ts --dry-run # preview only
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  ← needed for storage uploads + bypassing RLS
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUCKET = 'bts-images';
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
const envFile = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
for (const line of envFile.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  const val = t.slice(eq + 1).trim();
  if (!(key in process.env)) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Use service role client — bypasses RLS and has storage admin access
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((b) => b.name === BUCKET);

  if (exists) {
    console.log(`  ℹ️   Bucket "${BUCKET}" already exists`);
    return;
  }

  console.log(`  📦  Creating public bucket "${BUCKET}"...`);
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20 MB per image
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });

  if (error) {
    console.error(`  ❌  Failed to create bucket: ${error.message}`);
    process.exit(1);
  }
  console.log(`  ✓   Bucket "${BUCKET}" created`);
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FNAMigration/1.0)' },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType: contentType.split(';')[0] };
}

function extFromContentType(ct: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[ct] ?? 'jpg';
}

async function uploadToStorage(
  slug: string,
  index: number,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const ext = extFromContentType(contentType);
  const path = `${slug}/${String(index).padStart(3, '0')}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) throw new Error(`Storage upload failed for ${path}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(DRY_RUN ? '🔍  DRY RUN — no uploads or DB writes\n' : '🚀  Starting BTS image migration\n');

  // 1. Ensure bucket exists
  if (!DRY_RUN) {
    await ensureBucket();
    console.log('');
  }

  // 2. Fetch all existing BTS image records (with project slug via join)
  const { data: rows, error: fetchErr } = await supabase
    .from('project_bts_images')
    .select('id, project_id, image_url, sort_order, projects(slug)');

  if (fetchErr || !rows) {
    console.error('❌  Failed to fetch BTS images:', fetchErr?.message);
    process.exit(1);
  }

  // Filter to only rows that still point to the old CDN
  const oldCdnRows = rows.filter((r) => r.image_url.includes('carbon-media.accelerator.net'));
  const alreadyMigrated = rows.length - oldCdnRows.length;

  console.log(`📋  ${rows.length} total BTS image records`);
  if (alreadyMigrated > 0) console.log(`    ${alreadyMigrated} already migrated (skipping)`);
  console.log(`    ${oldCdnRows.length} to migrate from old CDN\n`);

  if (oldCdnRows.length === 0) {
    console.log('✅  Nothing to do — all images already migrated!');
    return;
  }

  // 3. Group by project slug for logging
  type Row = typeof oldCdnRows[number];
  const bySlug = new Map<string, Row[]>();
  for (const row of oldCdnRows) {
    const slug = (row.projects as { slug: string } | null)?.slug ?? row.project_id;
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push(row);
  }

  // 4. Process each image
  let migrated = 0;
  let failed = 0;
  const CONCURRENCY = 5;

  for (const [slug, slugRows] of bySlug) {
    console.log(`📁  ${slug} (${slugRows.length} images)`);

    // Sort by sort_order so indexes are stable
    slugRows.sort((a, b) => a.sort_order - b.sort_order);

    // Process in parallel batches of CONCURRENCY
    for (let i = 0; i < slugRows.length; i += CONCURRENCY) {
      const batch = slugRows.slice(i, i + CONCURRENCY);

      await Promise.all(
        batch.map(async (row, batchIdx) => {
          const idx = i + batchIdx;
          const oldUrl = row.image_url;

          if (DRY_RUN) {
            console.log(`    [${idx}] ${oldUrl.split('/').pop()?.split(';')[0] ?? '?'} → would upload`);
            migrated++;
            return;
          }

          try {
            // Download from old CDN
            const { buffer, contentType } = await downloadImage(oldUrl);

            // Upload to Supabase Storage
            const newUrl = await uploadToStorage(slug, idx, buffer, contentType);

            // Update DB record
            const { error: updateErr } = await supabase
              .from('project_bts_images')
              .update({ image_url: newUrl })
              .eq('id', row.id);

            if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

            console.log(`    ✓ [${idx}] → ${newUrl.split('/').pop()}`);
            migrated++;
          } catch (err) {
            console.error(`    ✗ [${idx}] ${oldUrl}: ${(err as Error).message}`);
            failed++;
          }
        })
      );
    }

    console.log('');
  }

  // 5. Summary
  console.log('─'.repeat(50));
  if (DRY_RUN) {
    console.log(`🔍  DRY RUN — would migrate ${migrated} images`);
  } else {
    console.log(`🎉  Migration complete!`);
    console.log(`    ✓  ${migrated} images migrated to Supabase Storage`);
    if (failed > 0) console.log(`    ✗  ${failed} failed (re-run to retry)`);
    console.log(`\n    Bucket URL pattern:`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl('example/000.jpg');
    console.log(`    ${data.publicUrl.replace('example/000.jpg', '[slug]/[index].jpg')}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
