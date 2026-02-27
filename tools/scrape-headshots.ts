/**
 * Scrape headshot photos for cast members using Firecrawl image search,
 * process with sharp (resize to max 1000px, convert to WebP),
 * and upload to Supabase storage + headshots table.
 *
 * Usage: npx tsx tools/scrape-headshots.ts
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { execFileSync } from 'child_process';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ipzfnpjkslormhbkkiys.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = 'headshots';
const MAX_DIMENSION = 1000;
const WEBP_QUALITY = 80;
const SEARCH_LIMIT = 5; // images per cast member
const BATCH_SIZE = 3; // concurrent cast members (firecrawl has 5 concurrency limit)

interface CastMember {
  id: string;
  name: string;
}

interface ImageResult {
  title: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  url: string;
  position: number;
}

// Temp directory for firecrawl results
const tmpDir = path.join(process.cwd(), '.firecrawl', 'headshots');
if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

async function searchImages(name: string): Promise<ImageResult[]> {
  const safeName = name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase();
  const outFile = path.join(tmpDir, `${safeName}.json`);
  const query = `"${name}" headshot OR portrait photo`;

  try {
    execFileSync('firecrawl', [
      'search', query,
      '--sources', 'images',
      '--limit', String(SEARCH_LIMIT),
      '-o', outFile,
      '--json',
    ], { timeout: 30000, stdio: 'pipe' });
    const data = JSON.parse(readFileSync(outFile, 'utf-8'));
    return data?.data?.images || [];
  } catch (err) {
    console.warn(`  ⚠ Search failed for "${name}":`, (err as Error).message?.slice(0, 100));
    return [];
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function processImage(buffer: Buffer): Promise<{ data: Buffer; width: number; height: number } | null> {
  try {
    const processed = sharp(buffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY });

    const data = await processed.toBuffer();
    const meta = await sharp(data).metadata();

    if (!meta.width || !meta.height) return null;
    return { data, width: meta.width, height: meta.height };
  } catch {
    return null;
  }
}

async function uploadHeadshot(
  contactId: string,
  index: number,
  imageData: Buffer,
  width: number,
  height: number,
  sourceUrl: string,
  featured: boolean
): Promise<boolean> {
  const storagePath = `${contactId}/${index}.webp`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, imageData, { contentType: 'image/webp', upsert: true });

  if (uploadError) {
    console.warn(`    ✗ Upload failed: ${uploadError.message}`);
    return false;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // Insert into headshots table
  const aspectRatio = +(width / height).toFixed(3);
  const { error: dbError } = await supabase.from('headshots').insert({
    contact_id: contactId,
    storage_path: storagePath,
    url: publicUrl,
    featured,
    width,
    height,
    aspect_ratio: aspectRatio,
    file_size: imageData.length,
    source_url: sourceUrl,
  });

  if (dbError) {
    console.warn(`    ✗ DB insert failed: ${dbError.message}`);
    return false;
  }

  return true;
}

async function processCastMember(member: CastMember): Promise<number> {
  console.log(`\n🔍 Searching: ${member.name}`);
  const images = await searchImages(member.name);

  if (images.length === 0) {
    console.log(`  ⚠ No images found`);
    return 0;
  }

  console.log(`  Found ${images.length} images`);
  let uploaded = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`  📥 Downloading [${i + 1}/${images.length}]: ${img.imageUrl.slice(0, 80)}...`);

    const buffer = await downloadImage(img.imageUrl);
    if (!buffer) {
      console.log(`    ✗ Download failed`);
      continue;
    }

    const processed = await processImage(buffer);
    if (!processed) {
      console.log(`    ✗ Processing failed`);
      continue;
    }

    console.log(`    📐 ${processed.width}x${processed.height} (${(processed.data.length / 1024).toFixed(0)}KB)`);

    const success = await uploadHeadshot(
      member.id,
      uploaded,
      processed.data,
      processed.width,
      processed.height,
      img.imageUrl,
      uploaded === 0 // first successful upload is featured
    );

    if (success) {
      uploaded++;
      console.log(`    ✓ Uploaded (${uploaded})`);
    }
  }

  return uploaded;
}

async function main() {
  console.log('🎬 Cast Headshot Scraper');
  console.log('========================\n');

  // Fetch cast members
  const { data: castMembers, error } = await supabase
    .from('contacts')
    .select('id, name')
    .eq('type', 'cast')
    .order('name');

  if (error || !castMembers) {
    console.error('Failed to fetch cast members:', error?.message);
    process.exit(1);
  }

  console.log(`Found ${castMembers.length} cast members\n`);

  let totalUploaded = 0;
  let totalProcessed = 0;

  // Process in batches
  for (let i = 0; i < castMembers.length; i += BATCH_SIZE) {
    const batch = castMembers.slice(i, i + BATCH_SIZE);
    console.log(`\n--- Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(castMembers.length / BATCH_SIZE)} ---`);

    const results = await Promise.all(batch.map(m => processCastMember(m)));
    totalUploaded += results.reduce((a, b) => a + b, 0);
    totalProcessed += batch.length;

    console.log(`\nProgress: ${totalProcessed}/${castMembers.length} people, ${totalUploaded} headshots uploaded`);
  }

  console.log('\n========================');
  console.log(`✅ Done! ${totalUploaded} headshots uploaded for ${totalProcessed} cast members.`);
}

main().catch(console.error);
