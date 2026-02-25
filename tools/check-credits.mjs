import { createClient } from '@supabase/supabase-js';
const c = createClient(
  'https://ipzfnpjkslormhbkkiys.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwemZucGprc2xvcm1oYmtraXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjk2NzMsImV4cCI6MjA4Njc0NTY3M30.yvDRZscuaa_XDu_aw8V7-APxtUy63maIbKsvMjis0rs'
);

const { data: dbCredits } = await c.from('project_credits').select('role, name, sort_order, project_id');
const { data: projects } = await c.from('projects').select('id, slug');
const slugMap = Object.fromEntries(projects.map(p => [p.id, p.slug]));

// Group DB credits by project slug
const dbBySlug = {};
dbCredits.forEach(cr => {
  const slug = slugMap[cr.project_id];
  if (!dbBySlug[slug]) dbBySlug[slug] = [];
  dbBySlug[slug].push(cr);
});

// Load seed
import { readFileSync } from 'fs';
const seedRaw = JSON.parse(readFileSync('./supabase/seed-projects.json', 'utf8'));
const seed = seedRaw.projects || seedRaw;

console.log('\n=== PROJECTS WITH MISMATCHED CREDIT COUNTS ===\n');
for (const proj of seed) {
  const seedCredits = proj.credits || [];
  const db = dbBySlug[proj.slug] || [];
  if (db.length !== seedCredits.length) {
    console.log(`${proj.slug}: DB has ${db.length} rows, seed has ${seedCredits.length}`);
  }
}

console.log('\n=== ALL DB CREDITS (role + name) FOR MISMATCHED PROJECTS ===\n');
for (const proj of seed) {
  const seedCredits = proj.credits || [];
  const db = dbBySlug[proj.slug] || [];
  if (db.length !== seedCredits.length) {
    console.log(`\n--- ${proj.slug} (DB: ${db.length}, Seed: ${seedCredits.length}) ---`);
    console.log('DB:');
    db.sort((a, b) => a.sort_order - b.sort_order).forEach(cr => console.log(`  [${cr.sort_order}] ${cr.role}: ${cr.name}`));
    console.log('SEED:');
    seedCredits.forEach(cr => console.log(`  [${cr.sort_order}] ${cr.role}: ${cr.name}`));
  }
}
