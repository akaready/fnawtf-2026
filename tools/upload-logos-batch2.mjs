import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ipzfnpjkslormhbkkiys.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MAX_DIM = 1000;

const LOGOS = [
  { id: '7b18c785-efca-43b6-a0eb-f2fd3d4f4179', name: 'Etcher Laser (SmartDIYs)', url: 'https://www.smartdiys.com/common/img/s_logo-w.webp', recolor: false },
];

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processLogo(buf, isSvg, recolor) {
  let img = isSvg ? sharp(buf, { density: 300 }) : sharp(buf);
  img = img.ensureAlpha();
  const meta = await img.metadata();
  if ((meta.width ?? 0) > MAX_DIM || (meta.height ?? 0) > MAX_DIM)
    img = img.resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });
  if (recolor) {
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
    }
    return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  }
  return img.png().toBuffer();
}

for (const logo of LOGOS) {
  try {
    process.stdout.write(`  ${logo.name}... `);
    const buf = await fetchBuffer(logo.url);
    const pngBuf = await processLogo(buf, logo.url.includes('.svg'), logo.recolor);
    const path = `${logo.id}.png`;
    const { error } = await supabase.storage.from('logos').upload(path, pngBuf, { contentType: 'image/png', upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
    await supabase.from('clients').update({ logo_url: publicUrl }).eq('id', logo.id);
    console.log(`✓ (${Math.round(pngBuf.length / 1024)}KB)`);
  } catch (err) { console.log(`✗ ${err.message}`); }
}
