/**
 * Execute Reconciliation: manual_reconciliation.json → Supabase
 *
 * Reads the reconciliation file and performs:
 * - UPDATE: updates metadata on existing projects, inserts project_videos + credits
 * - CREATE: creates new projects (published: false), inserts project_videos + credits
 * - SKIP: ignored
 *
 * Run with:
 *   npx tsx tools/execute_reconciliation.ts [--dry-run]
 *
 * Prerequisites:
 *   .env.local must have SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// Load .env.local
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
} catch { /* rely on existing env */ }

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ?? 'vz-6b68e26c-531.b-cdn.net';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BunnyVideo {
  title: string;
  id: string;
  type: 'flagship' | 'cutdown' | 'bts' | 'pitch';
}

interface ReconciliationProject {
  client: string;
  supabase_id: string | null;
  supabase_slug?: string;
  tana_name: string | null;
  tana_type: string | null;
  tana_data?: {
    locations?: number | null;
    cast?: number | null;
    crew?: number | null;
    days?: number | null;
    techniques?: string[];
    addons?: string[];
    style?: string[];
    delivered?: string[];
    credits?: string;
  };
  bunny_videos: BunnyVideo[];
  action: 'UPDATE' | 'CREATE' | 'SKIP';
  new_title?: string;
  new_slug?: string;
  is_campaign: boolean;
  note?: string;
  password_protected?: boolean;
  published?: boolean;
}

interface ReconciliationFile {
  projects: ReconciliationProject[];
  tana_only_no_videos: unknown[];
  summary: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Credit parser: "role NAME role NAME ..." → [{role, name}]
// ---------------------------------------------------------------------------
function parseCredits(raw: string): Array<{ role: string; name: string }> {
  if (!raw || !raw.trim()) return [];
  // Known roles (order matters — longer first to match greedily)
  const roles = [
    'assistant camera', 'camera intern', 'color correction', 'custom wardrobe',
    'd.p.', 'director', 'drone operator', 'editor', 'food stylist',
    'gaffer', 'gfx', 'grip swing', 'hair and makeup', 'jib operator',
    'jingle composer', 'jingle mixed by', 'key grip', 'location sound',
    'location sound/sound mix', 'narrator', 'original music by',
    'pedicab operator', 'pedicab provided by', 'photo assist',
    'producer', 'producer/editor', 'production assistant', 'production assistants',
    'production design', 'production designer', 'production manager',
    'score mixed by', 'second unit d.p.', 'sound design/mix',
    'sound design/mix/original music', 'still photographer',
    'studio teacher', 'vfx', 'vfx/gfx', 'vocalists', 'voiceover',
    'copywriter/c.d.', 'cast',
  ];

  const credits: Array<{ role: string; name: string }> = [];
  let remaining = raw.trim();

  while (remaining.length > 0) {
    let matched = false;
    for (const role of roles) {
      if (remaining.toLowerCase().startsWith(role)) {
        const afterRole = remaining.slice(role.length).trim();
        // Find where the next role starts
        let nameEnd = afterRole.length;
        for (const nextRole of roles) {
          const idx = afterRole.toLowerCase().indexOf(` ${nextRole} `);
          if (idx !== -1 && idx < nameEnd) {
            nameEnd = idx;
          }
        }
        const name = afterRole.slice(0, nameEnd).trim();
        if (name) {
          // Split cast by bullet or newline
          if (role === 'cast') {
            const castNames = name.split(/[•\n]/).map(n => n.trim()).filter(Boolean);
            for (const cn of castNames) {
              credits.push({ role: 'Cast', name: cn });
            }
          } else {
            // Capitalize role for display
            const displayRole = role.split(' ').map(w =>
              w === 'd.p.' ? 'D.P.' :
              w === 'vfx' ? 'VFX' :
              w === 'gfx' ? 'GFX' :
              w === 'vfx/gfx' ? 'VFX/GFX' :
              w.charAt(0).toUpperCase() + w.slice(1)
            ).join(' ');
            credits.push({ role: displayRole, name });
          }
        }
        remaining = afterRole.slice(nameEnd).trim();
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Skip unrecognized token
      const space = remaining.indexOf(' ');
      remaining = space === -1 ? '' : remaining.slice(space + 1).trim();
    }
  }

  return credits;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(msg: string) { console.log(`  ${msg}`); }
function err(msg: string) { console.error(`  ✗ ${msg}`); }

function thumbnailUrl(videoId: string): string {
  return `https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}

function getFlagshipId(videos: BunnyVideo[]): string | null {
  const flagship = videos.find(v => v.type === 'flagship');
  return flagship?.id ?? videos[0]?.id ?? null;
}

// Strip client prefix from video title: "Client • Title" → "Title"
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
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n${DRY_RUN ? '🏜️  DRY RUN — ' : ''}Reconciliation → Supabase\n`);

  // Load reconciliation
  const recoPath = resolve(__dirname, 'manual_reconciliation.json');
  const reco: ReconciliationFile = JSON.parse(readFileSync(recoPath, 'utf-8'));

  const updates = reco.projects.filter(p => p.action === 'UPDATE');
  const creates = reco.projects.filter(p => p.action === 'CREATE');
  const skips = reco.projects.filter(p => p.action === 'SKIP');

  log(`${updates.length} projects to UPDATE`);
  log(`${creates.length} projects to CREATE`);
  log(`${skips.length} projects to SKIP`);

  // ------------------------------------------------------------------
  // Phase 1: UPDATE existing projects
  // ------------------------------------------------------------------
  console.log('\n--- Phase 1: UPDATE existing projects ---\n');

  let updatedCount = 0;
  let videosInserted = 0;
  let creditsInserted = 0;

  for (const proj of updates) {
    const id = proj.supabase_id!;
    const slug = proj.supabase_slug ?? '?';
    const td = proj.tana_data;

    // Build update payload (only set fields we have data for)
    const payload: Record<string, unknown> = {};

    if (proj.tana_type) payload.category = proj.tana_type;
    if (proj.is_campaign) payload.is_campaign = true;
    if (td) {
      if (td.style && td.style.length > 0) payload.style_tags = td.style;
      if (td.addons && td.addons.length > 0) payload.premium_addons = td.addons;
      if (td.techniques && td.techniques.length > 0) payload.camera_techniques = td.techniques;
      if (td.delivered && td.delivered.length > 0) payload.assets_delivered = td.delivered;
      if (td.days != null) payload.production_days = td.days;
      if (td.crew != null) payload.crew_count = td.crew;
      if (td.cast != null) payload.talent_count = td.cast;
      if (td.locations != null) payload.location_count = td.locations;
    }

    // Set thumbnail from flagship video
    const flagshipId = getFlagshipId(proj.bunny_videos);
    if (flagshipId) {
      payload.thumbnail_url = thumbnailUrl(flagshipId);
    }

    if (DRY_RUN) {
      log(`[dry-run] UPDATE ${slug} (${id}): ${JSON.stringify(payload).slice(0, 120)}...`);
    } else {
      if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from('projects').update(payload).eq('id', id);
        if (error) { err(`Update ${slug}: ${error.message}`); continue; }
      }
    }

    // Insert project_videos
    if (proj.bunny_videos.length > 0) {
      // First delete existing project_videos for this project
      if (!DRY_RUN) {
        await supabase.from('project_videos').delete().eq('project_id', id);
      }

      const videoRows = proj.bunny_videos.map((v, i) => ({
        project_id: id,
        bunny_video_id: v.id,
        title: stripClientPrefix(v.title),
        video_type: v.type,
        sort_order: i,
        password_protected: proj.password_protected ?? false,
      }));

      if (DRY_RUN) {
        log(`  [dry-run] ${videoRows.length} videos`);
      } else {
        const { error } = await supabase.from('project_videos').insert(videoRows);
        if (error) { err(`Videos for ${slug}: ${error.message}`); }
        else { videosInserted += videoRows.length; }
      }
    }

    // Insert credits from Tana
    if (td?.credits) {
      const parsed = parseCredits(td.credits);
      if (parsed.length > 0) {
        if (!DRY_RUN) {
          await supabase.from('project_credits').delete().eq('project_id', id);
        }

        const creditRows = parsed.map((c, i) => ({
          project_id: id,
          role: c.role,
          name: c.name,
          sort_order: i,
        }));

        if (DRY_RUN) {
          log(`  [dry-run] ${creditRows.length} credits`);
        } else {
          const { error } = await supabase.from('project_credits').insert(creditRows);
          if (error) { err(`Credits for ${slug}: ${error.message}`); }
          else { creditsInserted += creditRows.length; }
        }
      }
    }

    updatedCount++;
    if (!DRY_RUN) log(`✓ ${slug}`);
  }

  // ------------------------------------------------------------------
  // Phase 2: CREATE new projects
  // ------------------------------------------------------------------
  console.log('\n--- Phase 2: CREATE new projects ---\n');

  let createdCount = 0;

  for (const proj of creates) {
    const slug = proj.new_slug ?? proj.supabase_slug ?? 'unknown';
    const title = proj.new_title ?? proj.tana_name ?? proj.client;
    const td = proj.tana_data;

    const projectRow: Record<string, unknown> = {
      title,
      slug,
      client_name: proj.client,
      type: 'video',
      published: proj.published ?? false,
      featured: false,
      placeholder: false,
      full_width: false,
      is_campaign: proj.is_campaign ?? false,
      subtitle: '',
      description: '',
    };

    if (proj.tana_type) projectRow.category = proj.tana_type;
    if (td) {
      if (td.style && td.style.length > 0) projectRow.style_tags = td.style;
      if (td.addons && td.addons.length > 0) projectRow.premium_addons = td.addons;
      if (td.techniques && td.techniques.length > 0) projectRow.camera_techniques = td.techniques;
      if (td.delivered && td.delivered.length > 0) projectRow.assets_delivered = td.delivered;
      if (td.days != null) projectRow.production_days = td.days;
      if (td.crew != null) projectRow.crew_count = td.crew;
      if (td.cast != null) projectRow.talent_count = td.cast;
      if (td.locations != null) projectRow.location_count = td.locations;
    }

    // Thumbnail from flagship
    const flagshipId = getFlagshipId(proj.bunny_videos);
    if (flagshipId) {
      projectRow.thumbnail_url = thumbnailUrl(flagshipId);
    }

    let projectId: string;

    if (DRY_RUN) {
      log(`[dry-run] CREATE "${title}" (${slug}): ${JSON.stringify(projectRow).slice(0, 120)}...`);
      projectId = 'dry-run-id';
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectRow)
        .select('id')
        .single();

      if (error) { err(`Create ${slug}: ${error.message}`); continue; }
      projectId = data.id;
    }

    // Insert project_videos
    if (proj.bunny_videos.length > 0) {
      const videoRows = proj.bunny_videos.map((v, i) => ({
        project_id: projectId,
        bunny_video_id: v.id,
        title: stripClientPrefix(v.title),
        video_type: v.type,
        sort_order: i,
        password_protected: proj.password_protected ?? false,
      }));

      if (DRY_RUN) {
        log(`  [dry-run] ${videoRows.length} videos`);
      } else {
        const { error } = await supabase.from('project_videos').insert(videoRows);
        if (error) { err(`Videos for ${slug}: ${error.message}`); }
        else { videosInserted += videoRows.length; }
      }
    }

    // Insert credits
    if (td?.credits) {
      const parsed = parseCredits(td.credits);
      if (parsed.length > 0) {
        const creditRows = parsed.map((c, i) => ({
          project_id: projectId,
          role: c.role,
          name: c.name,
          sort_order: i,
        }));

        if (DRY_RUN) {
          log(`  [dry-run] ${creditRows.length} credits`);
        } else {
          const { error } = await supabase.from('project_credits').insert(creditRows);
          if (error) { err(`Credits for ${slug}: ${error.message}`); }
          else { creditsInserted += creditRows.length; }
        }
      }
    }

    createdCount++;
    if (!DRY_RUN) log(`✓ ${slug} (${projectId})`);
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n--- Summary ---\n');
  console.log(`  Projects updated:  ${updatedCount}`);
  console.log(`  Projects created:  ${createdCount}`);
  console.log(`  Projects skipped:  ${skips.length}`);
  console.log(`  Videos inserted:   ${videosInserted}`);
  console.log(`  Credits inserted:  ${creditsInserted}`);
  if (DRY_RUN) console.log('\n  (DRY RUN — no changes made)');
  console.log('');
}

main().catch(console.error);
