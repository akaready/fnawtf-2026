import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const MAX_DIMENSION = 1000;
const WEBP_QUALITY = 80;
const BUCKET = 'headshots';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'search-headshots':
      return searchHeadshots(body.name);
    case 'save-headshot':
      return saveHeadshot(supabase, body);
    case 'search-urls':
      return searchUrls(body.name);
    case 'search-emails':
      return searchEmails(body.name, body.urls);
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// ── Search headshots via Firecrawl image search ─────────────────────────

async function searchHeadshots(name: string) {
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  try {
    const query = `"${name}" headshot OR portrait photo`;
    const stdout = execFileSync('firecrawl', [
      'search', query, '--sources', 'images', '--limit', '8', '--json',
    ], { timeout: 30000, encoding: 'utf-8' });

    const result = JSON.parse(stdout);
    const images = result?.data?.images || [];
    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ error: 'Search failed', detail: (err as Error).message?.slice(0, 200) }, { status: 500 });
  }
}

// ── Download, process, and upload a single headshot ─────────────────────

async function saveHeadshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  body: { contactId: string; imageUrl: string; index: number; featured: boolean }
) {
  const { contactId, imageUrl, index, featured } = body;
  if (!contactId || !imageUrl) return NextResponse.json({ error: 'contactId and imageUrl required' }, { status: 400 });

  // Download
  const response = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return NextResponse.json({ error: 'Download failed' }, { status: 502 });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) return NextResponse.json({ error: 'Not an image' }, { status: 400 });

  const buffer = Buffer.from(await response.arrayBuffer());

  // Process with sharp
  const processed = sharp(buffer)
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY });
  const data = await processed.toBuffer();
  const meta = await sharp(data).metadata();
  if (!meta.width || !meta.height) return NextResponse.json({ error: 'Processing failed' }, { status: 500 });

  // Upload to storage
  const storagePath = `${contactId}/${index}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, data, { contentType: 'image/webp', upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const aspectRatio = +(meta.width / meta.height).toFixed(3);

  // Insert into headshots table
  const { data: row, error: dbError } = await supabase
    .from('headshots')
    .insert({
      contact_id: contactId,
      storage_path: storagePath,
      url: publicUrl,
      featured,
      width: meta.width,
      height: meta.height,
      aspect_ratio: aspectRatio,
      file_size: data.length,
      source_url: imageUrl,
    } as never)
    .select('*')
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ headshot: row });
}

// ── Search for web profile URLs via Firecrawl ───────────────────────────

async function searchUrls(name: string) {
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  try {
    const query = `"${name}" linkedin OR instagram OR imdb OR portfolio`;
    const stdout = execFileSync('firecrawl', [
      'search', query, '--limit', '10', '--json',
    ], { timeout: 30000, encoding: 'utf-8' });

    const result = JSON.parse(stdout);
    const webResults: Array<{ url: string; title: string }> = result?.data?.web || [];

    const urls: Record<string, string> = {};
    for (const r of webResults) {
      const u = r.url.toLowerCase();
      if (!urls.linkedin_url && u.includes('linkedin.com/in/')) urls.linkedin_url = r.url;
      if (!urls.instagram_url && u.includes('instagram.com/') && !u.includes('/p/') && !u.includes('/reel/')) urls.instagram_url = r.url;
      if (!urls.imdb_url && u.includes('imdb.com/name/')) urls.imdb_url = r.url;
      if (!urls.website_url
        && !u.includes('linkedin.com') && !u.includes('instagram.com')
        && !u.includes('imdb.com') && !u.includes('facebook.com')
        && !u.includes('twitter.com') && !u.includes('youtube.com')
        && !u.includes('tiktok.com'))
        urls.website_url = r.url;
    }

    return NextResponse.json({ urls });
  } catch (err) {
    return NextResponse.json({ error: 'Search failed', detail: (err as Error).message?.slice(0, 200) }, { status: 500 });
  }
}

// ── Search for email addresses by scraping confirmed websites ──────────

async function searchEmails(name: string, urls: Record<string, string>) {
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  // Only scrape domains from the contact's own confirmed URLs
  const confirmedUrls = Object.values(urls || {}).filter(Boolean);
  if (confirmedUrls.length === 0) {
    return NextResponse.json({ email: null });
  }

  // Extract unique domains from confirmed URLs
  const allowedDomains = new Set<string>();
  for (const url of confirmedUrls) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      // Skip social media — we want their personal/company sites
      if (!['linkedin.com', 'instagram.com', 'imdb.com', 'facebook.com', 'twitter.com', 'youtube.com', 'tiktok.com'].includes(hostname)) {
        allowedDomains.add(hostname);
      }
    } catch { /* invalid URL */ }
  }

  if (allowedDomains.size === 0) {
    return NextResponse.json({ email: null });
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails: string[] = [];

  // Scrape each confirmed website for email addresses
  for (const domain of allowedDomains) {
    try {
      const stdout = execFileSync('firecrawl', [
        'scrape', `https://${domain}`, '--format', 'markdown', '--json',
      ], { timeout: 20000, encoding: 'utf-8' });

      const result = JSON.parse(stdout);
      const markdown: string = result?.data?.markdown || '';
      const matches = markdown.match(emailRegex) || [];
      foundEmails.push(...matches);
    } catch { /* skip failed scrape */ }

    // Also try /contact page
    try {
      const stdout = execFileSync('firecrawl', [
        'scrape', `https://${domain}/contact`, '--format', 'markdown', '--json',
      ], { timeout: 20000, encoding: 'utf-8' });

      const result = JSON.parse(stdout);
      const markdown: string = result?.data?.markdown || '';
      const matches = markdown.match(emailRegex) || [];
      foundEmails.push(...matches);
    } catch { /* skip */ }
  }

  // Deduplicate and filter to only emails from allowed domains
  const unique = [...new Set(foundEmails.map(e => e.toLowerCase()))];
  const filtered = unique.filter(email => {
    const emailDomain = email.split('@')[1];
    return allowedDomains.has(emailDomain);
  });

  return NextResponse.json({ email: filtered[0] || null, allEmails: filtered });
}
