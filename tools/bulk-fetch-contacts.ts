/**
 * Bulk-fetch contact URLs and emails using Firecrawl CLI.
 *
 * For each contact in the database, this script:
 *   1. Searches Firecrawl for LinkedIn, Instagram, IMDb, and website URLs
 *   2. For contacts missing an email, scrapes confirmed website domains for email addresses
 *   3. Updates the contact record in Supabase with any newly found data
 *
 * Usage:
 *   npx tsx tools/bulk-fetch-contacts.ts
 *
 * Requires:
 *   - SUPABASE_SERVICE_ROLE_KEY set in environment (or .env.local loaded via --env-file)
 *   - `firecrawl` CLI available on PATH
 */

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'child_process';

// ── Supabase setup ───────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ipzfnpjkslormhbkkiys.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Types ────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  email: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  imdb_url: string | null;
}

const URL_FIELDS = ['linkedin_url', 'instagram_url', 'imdb_url', 'website_url'] as const;

// ── Firecrawl URL search (mirrors route.ts searchUrls) ───────────────────

function searchUrls(name: string): Record<string, string> {
  const query = `"${name}" linkedin OR instagram OR imdb OR portfolio`;

  try {
    const stdout = execFileSync('firecrawl', [
      'search', query, '--limit', '10', '--json',
    ], { timeout: 30_000, encoding: 'utf-8' });

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

    return urls;
  } catch (err) {
    console.error(`    Firecrawl search failed: ${(err as Error).message?.slice(0, 120)}`);
    return {};
  }
}

// ── Firecrawl email scrape (mirrors route.ts searchEmails) ───────────────

function searchEmails(urls: Record<string, string | null>): string | null {
  const confirmedUrls = Object.values(urls).filter(Boolean) as string[];
  if (confirmedUrls.length === 0) return null;

  // Extract unique non-social-media domains
  const socialDomains = ['linkedin.com', 'instagram.com', 'imdb.com', 'facebook.com', 'twitter.com', 'youtube.com', 'tiktok.com'];
  const allowedDomains = new Set<string>();
  for (const url of confirmedUrls) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      if (!socialDomains.includes(hostname)) {
        allowedDomains.add(hostname);
      }
    } catch { /* invalid URL */ }
  }

  if (allowedDomains.size === 0) return null;

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails: string[] = [];

  for (const domain of allowedDomains) {
    // Scrape root page
    try {
      const stdout = execFileSync('firecrawl', [
        'scrape', `https://${domain}`, '--format', 'markdown', '--json',
      ], { timeout: 20_000, encoding: 'utf-8' });

      const result = JSON.parse(stdout);
      const markdown: string = result?.data?.markdown || '';
      const matches = markdown.match(emailRegex) || [];
      foundEmails.push(...matches);
    } catch { /* skip failed scrape */ }

    // Also try /contact page
    try {
      const stdout = execFileSync('firecrawl', [
        'scrape', `https://${domain}/contact`, '--format', 'markdown', '--json',
      ], { timeout: 20_000, encoding: 'utf-8' });

      const result = JSON.parse(stdout);
      const markdown: string = result?.data?.markdown || '';
      const matches = markdown.match(emailRegex) || [];
      foundEmails.push(...matches);
    } catch { /* skip */ }
  }

  // Deduplicate and filter to emails from allowed domains only
  const unique = [...new Set(foundEmails.map(e => e.toLowerCase()))];
  const filtered = unique.filter(email => {
    const emailDomain = email.split('@')[1];
    return allowedDomains.has(emailDomain);
  });

  return filtered[0] || null;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching all contacts from Supabase...\n');

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, name, email, website_url, linkedin_url, instagram_url, imdb_url')
    .order('name');

  if (error) {
    console.error('Failed to fetch contacts:', error.message);
    process.exit(1);
  }

  const total = contacts.length;
  console.log(`Found ${total} contacts.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    const contact = contacts[i] as Contact;
    const label = `[${i + 1}/${total}] ${contact.name}`;

    // Check if all fields are already filled
    const missingUrls = URL_FIELDS.filter(f => !contact[f]);
    const missingEmail = !contact.email;

    if (missingUrls.length === 0 && !missingEmail) {
      console.log(`${label} — already complete, skipping`);
      skipped++;
      continue;
    }

    try {
      const updates: Record<string, string> = {};

      // Step 1: Search for URLs if any are missing
      if (missingUrls.length > 0) {
        console.log(`${label} — searching for URLs (missing: ${missingUrls.join(', ')})...`);
        const foundUrls = searchUrls(contact.name);

        for (const field of missingUrls) {
          if (foundUrls[field]) {
            updates[field] = foundUrls[field];
          }
        }
      }

      // Step 2: Search for email if missing
      if (missingEmail) {
        // Build the full URL map: existing values + anything we just found
        const allUrls: Record<string, string | null> = {};
        for (const f of URL_FIELDS) {
          allUrls[f] = updates[f] || contact[f] || null;
        }

        console.log(`${label} — searching for email...`);
        const email = searchEmails(allUrls);
        if (email) {
          updates.email = email;
        }
      }

      // Step 3: Update if we found anything new
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ ...updates, updated_at: new Date().toISOString() } as never)
          .eq('id', contact.id);

        if (updateError) {
          console.error(`${label} — update failed: ${updateError.message}`);
          failed++;
          continue;
        }

        const found = Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ');
        console.log(`${label} — UPDATED: ${found}`);
        updated++;
      } else {
        console.log(`${label} — no new data found, skipping`);
        skipped++;
      }
    } catch (err) {
      console.error(`${label} — ERROR: ${(err as Error).message?.slice(0, 200)}`);
      failed++;
    }

    console.log('');
  }

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('━'.repeat(60));
  console.log(`Done. ${total} contacts processed.`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);
  console.log('━'.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
