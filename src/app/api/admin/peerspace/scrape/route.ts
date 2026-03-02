import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import type { PeerspaceData, PeerspaceReview } from '@/types/locations';

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 85;
const BUCKET = 'location-images';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'scrape':
      return scrapeListing(body.url);
    case 'save-images':
      return saveImages(body.locationId, body.images);
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// ── Scrape a Peerspace listing ───────────────────────────────────────────

async function scrapeListing(url: string) {
  if (!url || !url.includes('peerspace.com')) {
    return NextResponse.json({ error: 'Valid Peerspace URL required' }, { status: 400 });
  }

  try {
    // Scrape the listing page using execFileSync (safe from shell injection)
    const stdout = execFileSync('firecrawl', [
      'scrape', url,
      '--format', 'markdown,links',
      '--json',
    ], { timeout: 45000, encoding: 'utf-8' });

    const result = JSON.parse(stdout);
    const markdown: string = result?.data?.markdown || result?.markdown || '';
    const metadata = result?.data?.metadata || result?.metadata || {};

    // Parse structured data from the markdown
    const parsed = parsePeerspaceMarkdown(markdown);

    // Try to get more images by scraping the media/photos view
    let allImages = parsed.images;
    try {
      const mediaUrl = url.replace(/#.*$/, '') + '#type=media';
      const mediaStdout = execFileSync('firecrawl', [
        'scrape', mediaUrl,
        '--format', 'markdown',
        '--wait-for', '3000',
        '--json',
      ], { timeout: 45000, encoding: 'utf-8' });

      const mediaResult = JSON.parse(mediaStdout);
      const mediaMd: string = mediaResult?.data?.markdown || mediaResult?.markdown || '';
      const mediaImages = extractImageUrls(mediaMd);
      const existingUrls = new Set(allImages.map(i => normalizeCloudinaryUrl(i.url)));
      for (const img of mediaImages) {
        if (!existingUrls.has(normalizeCloudinaryUrl(img.url))) {
          allImages.push(img);
        }
      }
    } catch {
      // Media page scrape failed — that's fine, we have the main page images
    }

    // Collect all image alt texts as descriptions
    const imageDescriptions = allImages
      .map(i => i.alt_text)
      .filter((t): t is string => !!t && t.length > 10);

    return NextResponse.json({
      success: true,
      data: {
        name: parsed.title || (metadata as Record<string, string>).title || '',
        description: parsed.description,
        address: parsed.address,
        peerspace_id: extractPeerspaceId(url),
        peerspace_url: url,
        peerspace_data: {
          title: parsed.title,
          description: parsed.description,
          space_type: parsed.spaceType,
          neighborhood: parsed.neighborhood,
          city: parsed.city,
          state: parsed.state,
          amenities: parsed.amenities,
          pricing: parsed.pricing,
          capacity: parsed.capacity,
          sqft: parsed.sqft,
          min_hours: parsed.minHours,
          rating: parsed.rating,
          hours: parsed.hours,
          host: parsed.host,
          parking: parsed.parking,
          lighting: parsed.lighting,
          sound: parsed.sound,
          space_access: parsed.spaceAccess,
          electrical: parsed.electrical,
          host_rules: parsed.hostRules,
          cancellation_policy: parsed.cancellationPolicy,
          cancellation_tier: parsed.cancellationTier,
          health_safety: parsed.healthSafety,
          cleaning_protocol: parsed.cleaningProtocol,
          reviews: parsed.reviews,
          image_descriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined,
          coordinates: parsed.coordinates,
          scraped_at: new Date().toISOString(),
        } satisfies PeerspaceData,
        images: allImages,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Scrape failed', detail: (err as Error).message?.slice(0, 500) },
      { status: 500 }
    );
  }
}

// ── Download images to Supabase storage ──────────────────────────────────

async function saveImages(
  locationId: string,
  images: { url: string; alt_text: string | null }[]
) {
  if (!locationId || !images?.length) {
    return NextResponse.json({ error: 'locationId and images required' }, { status: 400 });
  }

  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const saved: { image_url: string; storage_path: string; alt_text: string | null; sort_order: number }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      // Download the image
      const response = await fetch(img.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) { errors.push(`Failed to download image ${i}`); continue; }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Process with sharp — resize and convert to webp
      const processed = await sharp(buffer)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      // Upload to storage
      const storagePath = `${locationId}/${i.toString().padStart(3, '0')}.webp`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, processed, { contentType: 'image/webp', upsert: true });
      if (upErr) { errors.push(`Upload failed for image ${i}: ${upErr.message}`); continue; }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      // Insert into location_images table
      const { error: dbErr } = await supabase
        .from('location_images')
        .insert({
          location_id: locationId,
          image_url: urlData.publicUrl,
          storage_path: storagePath,
          alt_text: img.alt_text,
          source: 'peerspace',
          is_featured: i === 0,
          sort_order: i,
        } as never);
      if (dbErr) { errors.push(`DB insert failed for image ${i}: ${dbErr.message}`); continue; }

      saved.push({
        image_url: urlData.publicUrl,
        storage_path: storagePath,
        alt_text: img.alt_text,
        sort_order: i,
      });
    } catch (err) {
      errors.push(`Image ${i}: ${(err as Error).message?.slice(0, 100)}`);
    }
  }

  // Update featured_image on the location record if we saved at least one
  if (saved.length > 0) {
    await supabase
      .from('locations')
      .update({ featured_image: saved[0].image_url, updated_at: new Date().toISOString() } as never)
      .eq('id', locationId);
  }

  return NextResponse.json({ saved, errors, total: images.length });
}

// ── Parsing utilities ────────────────────────────────────────────────────

function extractPeerspaceId(url: string): string | null {
  const match = url.match(/listings\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

function normalizeCloudinaryUrl(url: string): string {
  const match = url.match(/\/([a-z0-9]+)$/);
  return match?.[1] ?? url;
}

function extractImageUrls(markdown: string): { url: string; alt_text: string | null }[] {
  const regex = /!\[([^\]]*)\]\((https:\/\/img\.peerspace\.com\/[^\)]+)\)/g;
  const images: { url: string; alt_text: string | null }[] = [];
  const seen = new Set<string>();
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    if (match[2].includes('w_180') || match[2].includes('w_100')) continue;
    const normalized = normalizeCloudinaryUrl(match[2]);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    images.push({ url: match[2], alt_text: match[1] || null });
  }
  return images;
}

function parsePeerspaceMarkdown(markdown: string) {
  const lines = markdown.split('\n');

  // ── Title — first h1 ──────────────────────────────────────────────────
  let title = '';
  const h1Match = markdown.match(/^# (.+)$/m);
  if (h1Match) title = h1Match[1].trim();

  // ── Location/address — extract from link pattern ───────────────────────
  // Pattern: [Berkeley Hills,](…location=berkeley-hills--berkeley--ca) [Berkeley, CA](…)
  let neighborhood = '';
  let city = '';
  let state = '';
  let address = '';
  const locationMatch = markdown.match(
    /\[([^\]]+),\]\(https:\/\/www\.peerspace\.com\/s\/\?space_use=(\w+)&location=[^\)]+\)\s*\[([^\]]+)\]/
  );
  if (locationMatch) {
    neighborhood = locationMatch[1].trim();
    const spaceType = locationMatch[2]; // extracted below too
    const cityState = locationMatch[3].trim(); // "Berkeley, CA"
    const parts = cityState.split(',').map(s => s.trim());
    city = parts[0] || '';
    state = parts[1] || '';
    address = `${neighborhood}, ${cityState}`;
    // space_type comes from here too
    void spaceType; // used below
  }

  // ── Space type — extracted from location URL query param ───────────────
  let spaceType = '';
  const spaceTypeMatch = markdown.match(/space_use=(\w+)/);
  if (spaceTypeMatch) spaceType = spaceTypeMatch[1];

  // ── Description — "About the Space" / "About this space" section ──────
  let description = '';
  const aboutIdx = lines.findIndex(l =>
    /^##\s+(About the Space|About this space)/i.test(l.trim())
  );
  if (aboutIdx !== -1) {
    const descLines: string[] = [];
    for (let i = aboutIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // Stop at escaped subsection headers (### \#\#\# Parking) or real ## headers or dividers
      if (/^###\s+\\#/.test(line) || /^##\s+[^#]/.test(line) || line === '* * *' || line === '---') break;
      if (line) descLines.push(line);
    }
    description = descLines.join('\n\n');
  }

  // ── Pricing — "$135/hr" pattern ────────────────────────────────────────
  let pricing: PeerspaceData['pricing'] = undefined;
  const priceMatch = markdown.match(/\$(\d+)\/hr/);
  if (priceMatch) {
    pricing = { amount: parseInt(priceMatch[1]), unit: 'hr' };
  }

  // ── Min hours — "8 hrs min" or "8 hr minimum" ─────────────────────────
  let minHours: number | undefined;
  const minMatch = markdown.match(/(\d+)\s*hrs?\s*min(?:imum)?/i);
  if (minMatch) {
    minHours = parseInt(minMatch[1]);
    if (pricing) pricing.minimum = `${minMatch[1]} hr`;
  }

  // ── Capacity — "15 people" ─────────────────────────────────────────────
  let capacity: number | undefined;
  const capMatch = markdown.match(/(\d+)\s*people/);
  if (capMatch) capacity = parseInt(capMatch[1]);

  // ── Square footage — "1000 sqft" ──────────────────────────────────────
  let sqft: number | undefined;
  const sqftMatch = markdown.match(/(\d[\d,]*)\s*sqft/i);
  if (sqftMatch) sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

  // ── Rating — "4.9 (12)" ───────────────────────────────────────────────
  let rating: PeerspaceData['rating'] = undefined;
  const ratingMatch = markdown.match(/(\d+\.?\d*)\s*\((\d+)\)/);
  if (ratingMatch) {
    rating = { score: parseFloat(ratingMatch[1]), count: parseInt(ratingMatch[2]) };
  }

  // ── Operating hours — day name on one line, time range on next ────────
  const hours: Record<string, string> = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (days.includes(trimmed)) {
      // Scan forward past blank lines for the time range
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (/^\d+:\d+\s*(AM|PM)\s*-\s*\d+:\d+\s*(AM|PM)$/i.test(nextLine)) {
          hours[trimmed.toLowerCase()] = nextLine;
          break;
        }
        if (nextLine && !nextLine.match(/^\s*$/)) break; // non-blank, non-time = stop
      }
    }
  }

  // ── Host info — "Hosted by Name" with profile link ────────────────────
  let host: PeerspaceData['host'] = undefined;
  const hostLinkMatch = markdown.match(
    /\[Hosted by\s+([^\]]+)\]\((https:\/\/www\.peerspace\.com\/profiles\/[^\)]+)\)/
  );
  if (hostLinkMatch) {
    host = { name: hostLinkMatch[1].trim(), profile_url: hostLinkMatch[2] };
  } else {
    const hostPlainMatch = markdown.match(/Hosted by\s+([^\n\]]+)/);
    if (hostPlainMatch) host = { name: hostPlainMatch[1].trim() };
  }
  // Host avatar
  if (host) {
    const avatarMatch = markdown.match(/!\[avatar\]\((https:\/\/img\.peerspace\.com\/[^\)]+)\)/);
    if (avatarMatch) host.avatar = avatarMatch[1];
  }
  // Response time — "typically responds within 1 hr" (often "respondswithin" without space)
  const responseMatch = markdown.match(/typically responds?\s*within\s*(\d+\s*\w+)/i);
  if (responseMatch && host) host.response_time = responseMatch[1].trim();

  // ── Amenities — "Included in your booking" / "Features" section ───────
  const amenities: string[] = [];
  const amenityStartIdx = lines.findIndex(l => l.includes('Included in your booking'));
  if (amenityStartIdx !== -1) {
    // Find the "Features" sub-header or start right after
    const featureStart = lines.findIndex((l, idx) => idx > amenityStartIdx && l.trim() === '### Features');
    const startIdx = featureStart !== -1 ? featureStart + 1 : amenityStartIdx + 1;
    for (let i = startIdx; i < Math.min(startIdx + 30, lines.length); i++) {
      const line = lines[i].trim();
      if (line.startsWith('#') || line === '* * *' || line === '---') break;
      if (line === 'Show all') continue;
      if (line && line.length > 2 && line.length < 80) amenities.push(line);
    }
  }

  // ── Subsections (Parking, Lighting, etc.) ─────────────────────────────
  // These appear as "### \#\#\# Parking" (escaped markdown from JS-expandable sections)
  // Content may be on subsequent lines, but is usually behind JS so we try both patterns
  const extractSubsection = (name: string): string | undefined => {
    // Pattern 1: "### \#\#\# Name" (escaped header)
    const escapedIdx = lines.findIndex(l => l.trim() === `### \\#\\#\\# ${name}`);
    if (escapedIdx !== -1) {
      const content: string[] = [];
      for (let i = escapedIdx + 1; i < Math.min(escapedIdx + 8, lines.length); i++) {
        const line = lines[i].trim();
        if (line.startsWith('#') || line === '* * *' || line === '---') break;
        if (line) content.push(line);
      }
      return content.join(' ') || undefined;
    }
    // Pattern 2: "### Name" or "## Name" (normal header)
    const normalIdx = lines.findIndex(l =>
      l.trim() === `### ${name}` || l.trim() === `## ${name}`
    );
    if (normalIdx !== -1) {
      const content: string[] = [];
      for (let i = normalIdx + 1; i < Math.min(normalIdx + 8, lines.length); i++) {
        const line = lines[i].trim();
        if (line.startsWith('#') || line === '* * *' || line === '---') break;
        if (line) content.push(line);
      }
      return content.join(' ') || undefined;
    }
    return undefined;
  };

  const parking = extractSubsection('Parking');
  const lighting = extractSubsection('Lighting');
  const sound = extractSubsection('Sound');
  const spaceAccess = extractSubsection('Space access');
  const electrical = extractSubsection('Electrical');
  const hostRules = extractSubsection('Host rules');
  const cleaningProtocol = extractSubsection('Cleaning protocol');

  // ── Health & Safety — full paragraph ──────────────────────────────────
  let healthSafety = '';
  const healthIdx = lines.findIndex(l => /^##\s+Health and Safety/i.test(l.trim()));
  if (healthIdx !== -1) {
    const healthLines: string[] = [];
    for (let i = healthIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^###\s+\\#/.test(line) || /^##\s+[^#]/.test(line) || line === '* * *' || line === '---') break;
      if (line) healthLines.push(line);
    }
    healthSafety = healthLines.join(' ');
  }

  // ── Cancellation policy — tier name + full text ───────────────────────
  let cancellationTier = '';
  let cancellationPolicy = '';
  const cancelIdx = lines.findIndex(l => /^##\s+Cancellation Policy/i.test(l.trim()));
  if (cancelIdx !== -1) {
    // Tier is usually the next ### header (e.g., "### Flexible")
    const tierMatch = lines.slice(cancelIdx + 1, cancelIdx + 4).find(l => /^###\s+(\w+)/.test(l.trim()));
    if (tierMatch) {
      const m = tierMatch.trim().match(/^###\s+(.+)/);
      if (m) cancellationTier = m[1].trim();
    }
    // Full policy text
    const policyLines: string[] = [];
    const policyStart = tierMatch ? lines.indexOf(tierMatch) + 1 : cancelIdx + 1;
    for (let i = policyStart; i < Math.min(policyStart + 15, lines.length); i++) {
      const line = lines[i].trim();
      if (/^##\s+[^#]/.test(line) || line === '* * *' || line === '---') break;
      if (line.startsWith('#')) continue;
      if (line.startsWith('[Learn')) continue;
      if (line) policyLines.push(line);
    }
    cancellationPolicy = policyLines.join(' ').slice(0, 1000);
  }

  // ── Coordinates from Google Maps static image URL ─────────────────────
  let coordinates: PeerspaceData['coordinates'] = undefined;
  const coordMatch = markdown.match(/center=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordMatch) {
    coordinates = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  }

  // ── Reviews — structured parsing ──────────────────────────────────────
  const reviews: PeerspaceReview[] = [];
  const reviewsIdx = lines.findIndex(l => /Reviews\s*\(\d+\)/.test(l));
  if (reviewsIdx !== -1) {
    // Reviews follow the pattern:
    // [Name](profile_url)(Role)     ← or just [Name](profile_url)
    // booked a Production for 13 people
    // Yes,I would book again.       ← or no equivalent line
    // Review text here
    // Month Day, Year
    let i = reviewsIdx + 1;
    while (i < lines.length) {
      const line = lines[i].trim();
      // Stop at "## See N More Reviews" or pricing section or divider
      if (/^##\s+See \d+ More/.test(line) || line === '* * *' || line === '---') break;
      if (line.startsWith('Add details to view')) break;

      // Try to match a reviewer name link: [Name](profile_url)
      const reviewerMatch = line.match(/^\[([^\]]+)\]\(https:\/\/www\.peerspace\.com\/profiles\/[^\)]+\)/);
      if (reviewerMatch) {
        const reviewerName = reviewerMatch[1].trim();
        // Check for role in parentheses after the link: (Producer)
        const roleMatch = line.match(/\)\(([^)]+)\)\s*$/);
        const reviewerRole = roleMatch ? roleMatch[1].trim() : undefined;

        // Scan forward for booking info, would_book_again, text, date
        let bookingType: string | undefined;
        let guestCount: number | undefined;
        let wouldBookAgain = false;
        let reviewText = '';
        let reviewDate = '';

        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (!nextLine) continue;

          // "booked a Production for 13 people"
          const bookingMatch = nextLine.match(/booked a (\w+) for (\d+) people/i);
          if (bookingMatch) {
            bookingType = bookingMatch[1];
            guestCount = parseInt(bookingMatch[2]);
            continue;
          }

          // "Yes,I would book again." or "Yes, I would book again."
          if (/yes,?\s*I would book again/i.test(nextLine)) {
            wouldBookAgain = true;
            continue;
          }

          // Date line: "February 19, 2026"
          const dateMatch = nextLine.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}$/i);
          if (dateMatch) {
            reviewDate = nextLine;
            i = j; // advance outer loop past this review
            break;
          }

          // If it's another reviewer link, we went too far
          if (nextLine.match(/^\[([^\]]+)\]\(https:\/\/www\.peerspace\.com\/profiles\//)) {
            i = j - 1;
            break;
          }

          // Otherwise it's the review text
          if (!reviewText && nextLine.length > 5) {
            reviewText = nextLine;
          }
        }

        if (reviewText || reviewDate) {
          reviews.push({
            reviewer_name: reviewerName,
            reviewer_role: reviewerRole,
            booking_type: bookingType,
            guest_count: guestCount,
            would_book_again: wouldBookAgain,
            text: reviewText,
            date: reviewDate,
          });
        }
      }
      i++;
    }
  }

  // ── Images ─────────────────────────────────────────────────────────────
  const images = extractImageUrls(markdown);

  return {
    title,
    description,
    address,
    neighborhood,
    city,
    state,
    spaceType: spaceType || undefined,
    amenities,
    pricing,
    capacity,
    sqft,
    minHours,
    rating,
    hours: Object.keys(hours).length > 0 ? hours : undefined,
    host,
    parking,
    lighting,
    sound,
    spaceAccess,
    electrical,
    hostRules,
    cleaningProtocol,
    healthSafety: healthSafety || undefined,
    cancellationTier: cancellationTier || undefined,
    cancellationPolicy: cancellationPolicy || undefined,
    coordinates,
    reviews: reviews.length > 0 ? reviews : undefined,
    images,
  };
}
