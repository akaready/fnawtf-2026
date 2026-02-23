/**
 * reconcile.ts — Three-way match: Bunny videos × Tana metadata × Supabase projects
 *
 * Usage: npx tsx tools/reconcile.ts
 *
 * Outputs: tools/reconciliation_report.json
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ── Supabase client (service role for full access) ─────────────────────────
const supabase = createClient(
  'https://ipzfnpjkslormhbkkiys.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwemZucGprc2xvcm1oYmtraXlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE2OTY3MywiZXhwIjoyMDg2NzQ1NjczfQ.w8A1sengM9i5ToFNV-2-592H4-QtaWR6HTxSbSCePQE'
);

// ── Types ──────────────────────────────────────────────────────────────────
interface BunnyVideo {
  vimeo_url: string;
  bunny_url: string;
  thumbnail_url: string;
  collection: string;
  title: string;
  transferred_at: string;
}

interface TanaProject {
  name: string;
  client: string;
  type: string;
  locations: string;
  cast: string;
  crew: string;
  days: string;
  techniques: string[];
  addons: string[];
  style: string[];
  delivered: string[];
  credits: string;
}

interface SupabaseProject {
  id: string;
  title: string;
  slug: string;
  client_name: string;
  type: string;
  published: boolean;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
}

interface VideoGroup {
  clientName: string;
  videos: BunnyVideo[];
  videoIds: string[]; // extracted GUIDs
}

// ── Parse UrlMapping.json ──────────────────────────────────────────────────
function loadBunnyVideos(): BunnyVideo[] {
  const raw = readFileSync(join(__dirname, 'UrlMapping.json'), 'utf-8');
  return JSON.parse(raw);
}

function extractVideoId(bunnyUrl: string): string {
  // https://iframe.mediadelivery.net/play/604035/GUID → GUID
  const parts = bunnyUrl.split('/');
  return parts[parts.length - 1];
}

function extractClientName(title: string): string {
  // "Client • Title" or "Client · Title" or "Client - Title"
  const separators = [' • ', ' · ', ' \u2022 ', ' \u00b7 '];
  for (const sep of separators) {
    const idx = title.indexOf(sep);
    if (idx !== -1) return title.substring(0, idx).trim();
  }
  // Fallback: use entire title
  return title.trim();
}

function extractVideoTitle(title: string): string {
  const separators = [' • ', ' · ', ' \u2022 ', ' \u00b7 '];
  for (const sep of separators) {
    const idx = title.indexOf(sep);
    if (idx !== -1) return title.substring(idx + sep.length).trim();
  }
  return title.trim();
}

// ── Group videos by client ─────────────────────────────────────────────────
function groupByClient(videos: BunnyVideo[]): VideoGroup[] {
  const groups = new Map<string, BunnyVideo[]>();

  for (const v of videos) {
    // Skip non-portfolio collections
    if (v.collection === 'Talent Reels for Portals') continue;
    if (v.collection === 'Phoneado') continue;

    const client = extractClientName(v.title);
    if (!groups.has(client)) groups.set(client, []);
    groups.get(client)!.push(v);
  }

  return Array.from(groups.entries()).map(([clientName, videos]) => ({
    clientName,
    videos,
    videoIds: videos.map(v => extractVideoId(v.bunny_url)),
  }));
}

// ── Parse Tana export ──────────────────────────────────────────────────────
function loadTanaProjects(): TanaProject[] {
  const raw = readFileSync(join(__dirname, 'tana_export.md'), 'utf-8');
  const lines = raw.split('\n');

  const projects: TanaProject[] = [];

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    if (line.includes('#<br>project')) continue; // header row
    if (!line.includes('🚀')) continue; // data rows start with 🚀

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 12) continue;

    // Parse project name: "🚀<br>Name<br>#" → "Name"
    const nameRaw = cells[0];
    const nameParts = nameRaw.replace(/🚀/g, '').split('<br>').map(s => s.replace(/#/g, '').trim()).filter(Boolean);
    const name = nameParts[0] || '';

    // Parse client: "ClientName<br>#" → "ClientName"
    const clientRaw = cells[1];
    const client = clientRaw.split('<br>')[0].replace(/#/g, '').replace(/🆘/g, '').trim();

    const type = cells[2] || '';

    const parseTags = (cell: string): string[] =>
      cell.split('<br>').map(s => s.trim()).filter(s => s && s !== '#');

    projects.push({
      name,
      client,
      type,
      locations: cells[3] || '',
      cast: cells[4] || '',
      crew: cells[5] || '',
      days: cells[6] || '',
      techniques: parseTags(cells[7] || ''),
      addons: parseTags(cells[8] || ''),
      style: parseTags(cells[9] || ''),
      delivered: parseTags(cells[10] || ''),
      credits: cells[11] || '',
    });
  }

  return projects;
}

// ── Fuzzy match helper ─────────────────────────────────────────────────────
function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[''""]/g, "'")
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchScore(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  // Word overlap
  const wa = new Set(na.split(' '));
  const wb = new Set(nb.split(' '));
  const intersection = [...wa].filter(w => wb.has(w));
  const union = new Set([...wa, ...wb]);
  return intersection.length / union.size;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('Loading data sources...\n');

  // 1. Load Bunny videos
  const allVideos = loadBunnyVideos();
  console.log(`Bunny CDN: ${allVideos.length} videos`);

  const videoGroups = groupByClient(allVideos);
  console.log(`Grouped into ${videoGroups.length} client groups (excl. non-portfolio)\n`);

  // 2. Load Tana projects
  const tanaProjects = loadTanaProjects();
  console.log(`Tana: ${tanaProjects.length} projects\n`);

  // 3. Load Supabase projects
  const { data: supabaseProjects, error } = await supabase
    .from('projects')
    .select('id, title, slug, client_name, type, published, description, category, thumbnail_url')
    .order('title');

  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  console.log(`Supabase: ${supabaseProjects.length} existing projects\n`);

  // 4. Three-way matching
  const report: {
    matched: Array<{
      supabase: SupabaseProject | null;
      tana: TanaProject | null;
      bunny: VideoGroup | null;
      confidence: number;
      notes: string;
    }>;
    bunnyOnly: VideoGroup[];
    tanaOnly: TanaProject[];
    supabaseOnly: SupabaseProject[];
  } = { matched: [], bunnyOnly: [], tanaOnly: [], supabaseOnly: [] };

  const usedSupabase = new Set<string>();
  const usedTana = new Set<number>();
  const usedBunny = new Set<string>();

  // Match Bunny groups → Tana → Supabase
  for (const group of videoGroups) {
    let bestTana: { proj: TanaProject; idx: number; score: number } | null = null;
    let bestSupa: { proj: SupabaseProject; score: number } | null = null;

    // Try matching Bunny client name to Tana client
    for (let i = 0; i < tanaProjects.length; i++) {
      if (usedTana.has(i)) continue;
      const tp = tanaProjects[i];
      const clientScore = matchScore(group.clientName, tp.client);
      // Also check if any video title matches the Tana project name
      const nameScores = group.videos.map(v => matchScore(extractVideoTitle(v.title), tp.name));
      const bestNameScore = Math.max(0, ...nameScores);
      const score = Math.max(clientScore, bestNameScore * 0.9);

      if (score > 0.4 && (!bestTana || score > bestTana.score)) {
        bestTana = { proj: tp, idx: i, score };
      }
    }

    // Try matching to Supabase
    for (const sp of supabaseProjects as SupabaseProject[]) {
      if (usedSupabase.has(sp.id)) continue;
      const clientScore = matchScore(group.clientName, sp.client_name);
      const titleScore = matchScore(group.clientName, sp.title);
      const score = Math.max(clientScore, titleScore);

      if (score > 0.4 && (!bestSupa || score > bestSupa.score)) {
        bestSupa = { proj: sp, score };
      }
    }

    const confidence = Math.max(bestTana?.score ?? 0, bestSupa?.score ?? 0);

    if (confidence > 0.4) {
      if (bestTana) usedTana.add(bestTana.idx);
      if (bestSupa) usedSupabase.add(bestSupa.proj.id);
      usedBunny.add(group.clientName);

      report.matched.push({
        supabase: bestSupa?.proj ?? null,
        tana: bestTana?.proj ?? null,
        bunny: group,
        confidence,
        notes: confidence < 0.7 ? '⚠️ LOW CONFIDENCE — needs review' : '',
      });
    } else {
      report.bunnyOnly.push(group);
    }
  }

  // Find unmatched Tana projects
  for (let i = 0; i < tanaProjects.length; i++) {
    if (!usedTana.has(i)) {
      report.tanaOnly.push(tanaProjects[i]);
    }
  }

  // Find unmatched Supabase projects
  for (const sp of supabaseProjects as SupabaseProject[]) {
    if (!usedSupabase.has(sp.id)) {
      report.supabaseOnly.push(sp);
    }
  }

  // Sort matched by confidence (lowest first for easier review)
  report.matched.sort((a, b) => a.confidence - b.confidence);

  // 5. Output report
  const outPath = join(__dirname, 'reconciliation_report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  // Console summary
  console.log('═══════════════════════════════════════════════════');
  console.log('RECONCILIATION REPORT');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`✅ Matched: ${report.matched.length}`);
  console.log(`   High confidence (≥0.7): ${report.matched.filter(m => m.confidence >= 0.7).length}`);
  console.log(`   Low confidence (<0.7):  ${report.matched.filter(m => m.confidence < 0.7).length}`);
  console.log(`\n📹 Bunny-only (no Tana/Supabase match): ${report.bunnyOnly.length}`);
  console.log(`📋 Tana-only (no Bunny videos): ${report.tanaOnly.length}`);
  console.log(`💾 Supabase-only (no matches): ${report.supabaseOnly.length}`);

  console.log('\n─── MATCHES ───\n');
  for (const m of report.matched) {
    const conf = m.confidence >= 0.7 ? '✅' : '⚠️';
    console.log(`${conf} [${(m.confidence * 100).toFixed(0)}%] Bunny: "${m.bunny?.clientName}" (${m.bunny?.videos.length} videos)`);
    if (m.tana) console.log(`     Tana: "${m.tana.name}" by ${m.tana.client} [${m.tana.type}]`);
    if (m.supabase) console.log(`     Supabase: "${m.supabase.title}" (${m.supabase.slug})`);
    console.log();
  }

  if (report.bunnyOnly.length) {
    console.log('\n─── BUNNY ONLY (need new projects) ───\n');
    for (const g of report.bunnyOnly) {
      console.log(`📹 "${g.clientName}" — ${g.videos.length} video(s):`);
      for (const v of g.videos) {
        console.log(`   - ${v.title}`);
      }
      console.log();
    }
  }

  if (report.tanaOnly.length) {
    console.log('\n─── TANA ONLY (no Bunny videos) ───\n');
    for (const t of report.tanaOnly) {
      console.log(`📋 "${t.name}" by ${t.client} [${t.type}]`);
    }
  }

  if (report.supabaseOnly.length) {
    console.log('\n─── SUPABASE ONLY (no matches) ───\n');
    for (const s of report.supabaseOnly) {
      console.log(`💾 "${s.title}" (${s.slug}) — ${s.published ? 'published' : 'draft'}`);
    }
  }

  console.log(`\n\nFull report written to: ${outPath}`);
}

main().catch(console.error);
