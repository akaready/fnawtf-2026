/**
 * FNA Supabase Seed Script
 *
 * Loads all real project data from seed-projects.json into Supabase.
 * Handles: clients, projects, project_credits, testimonials
 *
 * Run with:
 *   npx tsx supabase/seed.ts
 *
 * Prerequisites:
 *   npm install -D tsx
 *   Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   (or set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for server-side inserts bypassing RLS)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (Next.js doesn't expose it to Node scripts)
const envPath = resolve(__dirname, '../.env.local');
try {
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
} catch {
  // .env.local not found — rely on environment variables already set
}

// ---------------------------------------------------------------------------
// Config — uses service role key so RLS is bypassed during seeding
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Seed data types
// ---------------------------------------------------------------------------
interface SeedTestimonial {
  quote: string;
  person_name: string | null;
  person_title: string | null;
  company: string | null;
  profile_picture_url: string | null;
}

interface SeedCredit {
  role: string;
  name: string;
  sort_order: number;
}

interface SeedProject {
  slug: string;
  title: string;
  subtitle: string;
  client_name: string;
  description: string;
  type: 'video' | 'design';
  category: string;
  style_tags: string[];
  premium_addons: string[];
  camera_techniques: string[];
  production_days: number;
  crew_count: number;
  talent_count: number;
  location_count: number;
  assets_delivered: string[];
  thumbnail_url: string | null;
  preview_gif_url: string | null;
  featured: boolean;
  published: boolean;
  placeholder: boolean;
  full_width: boolean;
  testimonial: SeedTestimonial;
  credits: SeedCredit[];
  bts_images: string[];
}

interface SeedFile {
  projects: SeedProject[];
}

// ---------------------------------------------------------------------------
// Client registry
// Maps canonical client name → logo_url (local public path)
// Includes all 20 homepage logo-wall clients + project clients without logos
// ---------------------------------------------------------------------------
const CLIENT_REGISTRY: Array<{
  name: string;
  logo_url: string | null;
  // aliases: project client_name values that map to this client
  aliases: string[];
}> = [
  // Clients with homepage logos
  { name: 'Cal Water',               logo_url: '/images/clients/cal-water.png',            aliases: [] },
  { name: 'Couples Institute',        logo_url: '/images/clients/couples-institute.png',    aliases: [] },
  { name: 'Crave',                   logo_url: '/images/clients/crave.png',                aliases: ['Crave'] },
  { name: 'Daily Grill',             logo_url: '/images/clients/daily-grill.png',          aliases: [] },
  { name: 'Dell',                    logo_url: '/images/clients/dell.png',                 aliases: [] },
  { name: 'Designer Pages',          logo_url: '/images/clients/designer-pages.png',       aliases: [] },
  { name: 'Epson',                   logo_url: '/images/clients/epson.png',                aliases: [] },
  { name: 'Erie',                    logo_url: '/images/clients/eri-logo.png',             aliases: ['Erie'] },
  { name: 'Keyboard.io',             logo_url: '/images/clients/key-logo.png',             aliases: ['Keyboard.io'] },
  { name: 'Light Pong',              logo_url: '/images/clients/light-pong.png',           aliases: ['Light Pong'] },
  { name: 'Lumen',                   logo_url: '/images/clients/lumen.png',                aliases: ['Lumen'] },
  { name: 'Lumos',                   logo_url: '/images/clients/lumos.png',                aliases: ['Lumos'] },
  { name: 'Lynx',                    logo_url: '/images/clients/lynx-1.png',               aliases: [] },
  { name: 'Monterey Bay Aquarium',   logo_url: '/images/clients/monteray-bay-aquarium.png',aliases: [] },
  { name: 'New Holland',             logo_url: '/images/clients/new-holland.png',          aliases: [] },
  { name: 'Nine Arches',             logo_url: '/images/clients/nine-arches.png',          aliases: ['Nine Arches'] },
  { name: 'Octopus Camera',          logo_url: '/images/clients/octopus-camera.png',       aliases: [] },
  { name: 'Omega Events',            logo_url: '/images/clients/omega-events.png',         aliases: [] },
  { name: 'Planned Parenthood',      logo_url: '/images/clients/planned-parenthood.png',   aliases: [] },
  { name: 'Samsung',                 logo_url: '/images/clients/samsung.png',              aliases: [] },

  // Project clients without homepage logos
  { name: 'Tilt 5',                  logo_url: null, aliases: ['Tilt 5', 'Tilt Five'] },
  { name: 'Tidbyt',                  logo_url: null, aliases: ['Tidbyt'] },
  { name: 'CMYK Games',              logo_url: null, aliases: ['CMYK Games'] },
  { name: 'Breadwinner',             logo_url: null, aliases: ['Breadwinner'] },
  { name: 'Wild Clean',              logo_url: null, aliases: ['Wild Clean'] },
  { name: 'TaloBrush',               logo_url: null, aliases: ['TaloBrush'] },
  { name: 'Lightfoot Scooters',      logo_url: null, aliases: ['Lightfoot Scooters'] },
  { name: 'Seismic',                 logo_url: null, aliases: ['Seismic'] },
  { name: 'Joué Music Instruments',  logo_url: null, aliases: ['Joué Music Instruments'] },
  { name: 'Etcher Laser',            logo_url: null, aliases: ['Etcher Laser'] },
  { name: 'Seco Tools',              logo_url: null, aliases: ['Seco Tools (IDEM)'] },
  { name: 'Dabby',                   logo_url: null, aliases: ['Dabby'] },
  { name: 'Negative',                logo_url: null, aliases: ['Negative'] },
  { name: 'Next Thing Co.',          logo_url: null, aliases: ['Next Thing Co.'] },
];

// Build alias → client name lookup
const aliasMap = new Map<string, string>();
for (const c of CLIENT_REGISTRY) {
  for (const alias of c.aliases) {
    aliasMap.set(alias, c.name);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(msg: string) { console.log(`  ${msg}`); }
function err(msg: string) { console.error(`  ✗ ${msg}`); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🌱 FNA Supabase Seed\n');

  // Load JSON
  const seedPath = resolve(__dirname, 'seed-projects.json');
  const seed: SeedFile = JSON.parse(readFileSync(seedPath, 'utf-8'));
  log(`Loaded ${seed.projects.length} projects from seed-projects.json`);

  // ------------------------------------------------------------------
  // 1. Clear existing placeholder data
  // ------------------------------------------------------------------
  console.log('\n1. Clearing placeholder data...');
  await supabase.from('project_credits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('testimonials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('project_bts_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  log('Cleared existing data');

  // ------------------------------------------------------------------
  // 2. Insert clients
  // ------------------------------------------------------------------
  console.log('\n2. Inserting clients...');
  const clientInserts = CLIENT_REGISTRY.map((c) => ({
    name: c.name,
    company: null as string | null,
    email: `hello@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    notes: null as string | null,
    logo_url: c.logo_url,
  }));

  const { data: insertedClients, error: clientErr } = await supabase
    .from('clients')
    .insert(clientInserts)
    .select('id, name');

  if (clientErr) { err(`Client insert failed: ${clientErr.message}`); process.exit(1); }
  log(`Inserted ${insertedClients!.length} clients`);

  // Build name → id map
  const clientIdMap = new Map<string, string>();
  for (const c of insertedClients!) {
    clientIdMap.set(c.name, c.id);
  }

  // ------------------------------------------------------------------
  // 3. Insert projects
  // ------------------------------------------------------------------
  console.log('\n3. Inserting projects...');

  const projectRows = seed.projects.map((p) => {
    const canonicalName = aliasMap.get(p.client_name) ?? p.client_name;
    const clientId = clientIdMap.get(canonicalName) ?? null;
    return {
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      client_name: p.client_name,
      client_id: clientId,
      client_quote: p.testimonial?.quote ?? null,
      type: p.type,
      category: p.category,
      style_tags: p.style_tags,
      premium_addons: p.premium_addons,
      camera_techniques: p.camera_techniques,
      production_days: p.production_days,
      crew_count: p.crew_count,
      talent_count: p.talent_count,
      location_count: p.location_count,
      assets_delivered: p.assets_delivered,
      thumbnail_url: p.thumbnail_url,
      preview_gif_url: p.preview_gif_url,
      featured: p.featured,
      published: p.published,
      placeholder: p.placeholder,
      full_width: p.full_width,
    };
  });

  const { data: insertedProjects, error: projectErr } = await supabase
    .from('projects')
    .insert(projectRows)
    .select('id, slug');

  if (projectErr) { err(`Project insert failed: ${projectErr.message}`); process.exit(1); }
  log(`Inserted ${insertedProjects!.length} projects`);

  // Build slug → id map
  const projectIdMap = new Map<string, string>();
  for (const p of insertedProjects!) {
    projectIdMap.set(p.slug, p.id);
  }

  // ------------------------------------------------------------------
  // 4. Insert testimonials
  // ------------------------------------------------------------------
  console.log('\n4. Inserting testimonials...');

  const testimonialRows = seed.projects
    .filter((p) => p.testimonial?.quote)
    .map((p) => ({
      project_id: projectIdMap.get(p.slug) ?? null,
      quote: p.testimonial.quote,
      person_name: p.testimonial.person_name,
      person_title: p.testimonial.person_title,
      company: p.testimonial.company,
      profile_picture_url: p.testimonial.profile_picture_url,
    }));

  const { data: insertedTestimonials, error: testimonialErr } = await supabase
    .from('testimonials')
    .insert(testimonialRows)
    .select('id');

  if (testimonialErr) { err(`Testimonial insert failed: ${testimonialErr.message}`); process.exit(1); }
  log(`Inserted ${insertedTestimonials!.length} testimonials`);

  // ------------------------------------------------------------------
  // 5. Insert project credits
  // ------------------------------------------------------------------
  console.log('\n5. Inserting project credits...');

  const creditRows = seed.projects.flatMap((p) =>
    (p.credits ?? []).map((c) => ({
      project_id: projectIdMap.get(p.slug)!,
      role: c.role,
      name: c.name,
      sort_order: c.sort_order,
    }))
  );

  // Insert in chunks to avoid request size limits
  const CHUNK = 100;
  let totalCredits = 0;
  for (let i = 0; i < creditRows.length; i += CHUNK) {
    const chunk = creditRows.slice(i, i + CHUNK);
    const { error: creditErr } = await supabase.from('project_credits').insert(chunk);
    if (creditErr) { err(`Credit insert failed at chunk ${i}: ${creditErr.message}`); process.exit(1); }
    totalCredits += chunk.length;
  }
  log(`Inserted ${totalCredits} credits`);

  // ------------------------------------------------------------------
  // Done
  // ------------------------------------------------------------------
  console.log('\n✓ Seed complete\n');
  console.log('  Summary:');
  console.log(`    Clients:      ${insertedClients!.length}`);
  console.log(`    Projects:     ${insertedProjects!.length}`);
  console.log(`    Testimonials: ${insertedTestimonials!.length}`);
  console.log(`    Credits:      ${totalCredits}`);
  console.log('\n  Next steps:');
  console.log('    - Upload thumbnails + preview GIFs → update thumbnail_url / preview_gif_url');
  console.log('    - Upload Bunny CDN videos → add rows to project_videos');
  console.log('    - Upload BTS photos → add rows to project_bts_images');
  console.log('    - Upload testimonial headshots → update profile_picture_url');
  console.log('    - Set featured=true + full_width on select projects');
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
