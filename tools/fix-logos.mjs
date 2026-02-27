import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ipzfnpjkslormhbkkiys.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const MAX_DIM = 1000;

// These were uploaded without recoloring — fix them
const LOGOS = [
  { id: '176be500-e636-4116-b89c-8dcdf9b8d573', name: 'Tilt 5', url: 'https://cdn.prod.website-files.com/64c014cfbff33f53d39bd26f/64c014cfbff33f53d39bd419_T5_Logo_Horizontal_RGB_Inverse.svg' },
  { id: '2733cb1e-84c5-4bf5-affd-1342fd1966a4', name: 'Wild Clean', url: 'https://cms.wildclean.com/uploads/logo_plastic_negative_2990cdff8e.png' },
  { id: '21075e8e-2f08-4b0b-a33e-012c6371fe37', name: 'Route92 Medical', url: 'https://www.route92medical.com/wp-content/themes/route92blokparty/assets/images/route-92-logo-white.png' },
];

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const logo of LOGOS) {
  try {
    process.stdout.write(`  ${logo.name}... `);
    const buf = await fetchBuffer(logo.url);
    const isSvg = logo.url.includes('.svg');
    let img = isSvg ? sharp(buf, { density: 300 }) : sharp(buf);
    img = img.ensureAlpha();
    const meta = await img.metadata();
    if ((meta.width ?? 0) > MAX_DIM || (meta.height ?? 0) > MAX_DIM)
      img = img.resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });

    // Recolor ALL non-transparent pixels to white
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
    }
    const pngBuf = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

    const path = `${logo.id}.png`;
    const { error } = await supabase.storage.from('logos').upload(path, pngBuf, { contentType: 'image/png', upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
    await supabase.from('clients').update({ logo_url: publicUrl }).eq('id', logo.id);
    console.log(`✓ recolored (${Math.round(pngBuf.length / 1024)}KB)`);
  } catch (err) { console.log(`✗ ${err.message}`); }
}
