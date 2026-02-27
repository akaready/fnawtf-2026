/**
 * Logo auto-fetcher: downloads logos, converts to white transparent PNG (max 1000px),
 * uploads to Supabase storage, and updates the clients table.
 *
 * Usage:  node tools/upload-logos.mjs
 */
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ipzfnpjkslormhbkkiys.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_DIM = 1000;

// ── Logo sources: client_id → source URL ──────────────────────────────────────
const LOGOS = [
  // Already-white or inverse logos (just resize + ensure transparency)
  { id: '21075e8e-2f08-4b0b-a33e-012c6371fe37', name: 'Route92 Medical',        url: 'https://www.route92medical.com/wp-content/themes/route92blokparty/assets/images/route-92-logo-white.png', recolor: false },
  { id: '176be500-e636-4116-b89c-8dcdf9b8d573', name: 'Tilt 5',                 url: 'https://cdn.prod.website-files.com/64c014cfbff33f53d39bd26f/64c014cfbff33f53d39bd419_T5_Logo_Horizontal_RGB_Inverse.svg', recolor: false },

  // Colored logos → recolor to white
  { id: 'cce9656e-b5a5-4888-ae76-7e5d4618e58a', name: 'Captify',               url: 'https://captifytechnologies.com/wp-content/uploads/2021/12/logogreen.svg', recolor: true },
  { id: '266b7d4d-32a0-408f-87e0-da4f61ca5f21', name: 'Niraxx',                url: 'https://niraxx.com/wp-content/uploads/2023/08/niraxx-horzontallogo-rgb.png', recolor: true },
  { id: '857dcad7-3337-4ed7-8197-a21fc59b3c9a', name: 'Pronomos Capital',       url: 'https://cdn.prod.website-files.com/5dcc0d4ee90195fa75b9e99b/5de62559b8a0ed13f3af751e_Pronomos-Logo-Glyph.png', recolor: true },
  { id: '68f68271-b44e-4e49-bccc-044b52380fcf', name: 'Keyboardio',             url: 'https://shop.keyboard.io/cdn/shop/files/logo-in-E27857.png?v=1714686892&width=600', recolor: true },
  { id: 'f6f35b0a-7ed2-448f-acb2-8f79620c0a93', name: 'Rain Factory',          url: 'https://www.rainfactory.com/wp-content/uploads/2025/01/RF_Logo_Full-2025.svg', recolor: true },
  { id: '9eef1e74-0836-44c0-a4cc-5738a828be7f', name: 'Seco Tools',            url: 'https://www.secotools.com/assets/dotcom/Content/assets/secologo.svg', recolor: true },
  { id: 'defcf455-4916-4eee-a83b-d3ed08f60984', name: 'Seismic',               url: 'https://images.squarespace-cdn.com/content/v1/60b71f6fd70b3159a097769a/1622615541375-PCIRGXGTC133XIWBO26N/Seismic+Logo+Black+Pad.png?format=1500w', recolor: true },
  { id: '2733cb1e-84c5-4bf5-affd-1342fd1966a4', name: 'Wild Clean',            url: 'https://cms.wildclean.com/uploads/logo_plastic_negative_2990cdff8e.png', recolor: false },
  { id: '82d94fdb-9f7c-472c-a93e-d2b48433f4f0', name: 'Lightfoot Scooters',    url: 'https://lightfoot.solar/cdn/shop/files/Logo.svg?v=1730805590&width=600', recolor: true },
  { id: '1c55e117-c580-4613-a3b1-1dd29ff89bbc', name: 'TechCrunch',            url: 'https://techcrunch.com/wp-content/uploads/2024/10/desktop-logo.svg', recolor: true },
  { id: '3847ad59-c5c1-489e-b628-e276a622d7d3', name: 'Kickstarter',           url: 'https://www.kickstarter.com/favicon.ico', recolor: true },
];

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processLogo(buf, isSvg, recolor) {
  let img;

  if (isSvg) {
    // Render SVG at high density, then resize
    img = sharp(buf, { density: 300 });
  } else {
    img = sharp(buf);
  }

  // Ensure RGBA
  img = img.ensureAlpha();

  // Get metadata for sizing
  const meta = await img.metadata();
  const w = meta.width ?? MAX_DIM;
  const h = meta.height ?? MAX_DIM;

  // Resize if needed (max 1000px in either direction, preserve aspect)
  if (w > MAX_DIM || h > MAX_DIM) {
    img = img.resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });
  }

  // Convert to raw RGBA for pixel manipulation if recoloring
  if (recolor) {
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

    // Make all non-transparent pixels white, preserve alpha
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a > 0) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        // keep alpha as-is
      }
    }

    return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png()
      .toBuffer();
  }

  return img.png().toBuffer();
}

async function uploadLogo(clientId, pngBuffer) {
  const path = `${clientId}.png`;
  const { error } = await supabase.storage
    .from('logos')
    .upload(path, pngBuffer, { contentType: 'image/png', upsert: true });
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
  return publicUrl;
}

async function updateClient(clientId, logoUrl) {
  const { error } = await supabase
    .from('clients')
    .update({ logo_url: logoUrl })
    .eq('id', clientId);
  if (error) throw error;
}

// ── Main ──────────────────────────────────────────────────────────────────────
let success = 0;
let failed = 0;

for (const logo of LOGOS) {
  try {
    process.stdout.write(`  ${logo.name}... `);

    const buf = await fetchBuffer(logo.url);
    const isSvg = logo.url.includes('.svg');
    const pngBuf = await processLogo(buf, isSvg, logo.recolor);
    const publicUrl = await uploadLogo(logo.id, pngBuf);
    await updateClient(logo.id, publicUrl);

    console.log(`✓ (${Math.round(pngBuf.length / 1024)}KB)`);
    success++;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${success} uploaded, ${failed} failed`);
