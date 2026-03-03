/**
 * Generates AI preview images for storyboard style presets using Gemini.
 * Run: node tools/generate-style-previews.mjs
 *
 * Reads GEMINI_API_KEY from .env.local and writes PNGs to public/images/storyboard-presets/
 *
 * Usage:
 *   node tools/generate-style-previews.mjs                    # generates all 4 missing styles
 *   node tools/generate-style-previews.mjs watercolor         # generates only watercolor
 *   node tools/generate-style-previews.mjs watercolor noir    # generates specific styles
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load GEMINI_API_KEY from .env.local
function loadEnv() {
  const envPath = resolve(ROOT, '.env.local');
  if (!existsSync(envPath)) throw new Error('.env.local not found');
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^GEMINI_API_KEY=(.+)$/);
    if (match) return match[1].trim();
  }
  throw new Error('GEMINI_API_KEY not found in .env.local');
}

const STYLE_PRESETS = {
  watercolor: {
    label: 'Watercolor',
    prompt: "Soft watercolor painting with visible brushstrokes and gentle color washes bleeding into each other. Dreamlike, impressionistic quality with areas of deliberate white paper showing through. Wet-on-wet technique creating organic color blends — soft edges where pigments meet, with occasional sharp details in focal points. Muted, harmonious color palette with pops of saturated pigment. Loose, expressive composition that suggests form rather than defining it precisely. Atmospheric perspective achieved through progressively lighter washes in the background. Feels like an original watercolor study by a skilled illustrator — the kind of painterly concept art you'd find in a Miyazaki art book. Delicate, contemplative, and luminous. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.",
  },
  noir: {
    label: 'Noir',
    prompt: 'High-contrast black and white film noir photography. Deep, inky shadows consuming large areas of the frame with dramatic shafts of hard light cutting through — venetian blind shadows, single-source overhead practicals, neon reflections on wet pavement. Extreme chiaroscuro lighting with virtually no midtones. Sharp, angular compositions with Dutch angles and dramatic low/high camera positions. Silhouetted figures, smoke curling through light beams, reflections in rain-slicked streets. The texture and grain of high-ISO black and white film — Tri-X pushed two stops. Moody, tension-filled atmosphere reminiscent of classic noir cinematography by John Alton or Gordon Willis. Every frame drips with mystery and unease. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
  },
  documentary: {
    label: 'Documentary',
    prompt: 'Raw, naturalistic documentary photography with an authentic, unposed quality. Handheld camera feel with slight motion blur on moving subjects. Available light only — mixed color temperatures from fluorescents, tungsten, and daylight creating realistic, imperfect lighting. Slightly desaturated color palette with muted tones. Shallow depth of field isolating subjects from busy, real-world backgrounds. Candid moments captured mid-action — genuine expressions, real environments, unstaged compositions. Visible environmental context and texture — worn surfaces, everyday objects, lived-in spaces. The grain and imperfection of a fast prime lens shot wide open in low light. Feels like a still from a Frederick Wiseman or Hoop Dreams-style observational documentary. Intimate, truthful, and unvarnished. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
  },
  anime: {
    label: 'Anime',
    prompt: "Japanese animation style with clean, confident ink outlines and flat color fills with subtle cel-shading gradients. Large, expressive character eyes with detailed light reflections. Dynamic compositions with dramatic perspective and foreshortening. Rich, saturated color palette with strong atmospheric lighting — golden hour warmth, cool moonlight blues, dramatic backlit rim lighting. Detailed, painterly backgrounds contrasting with cleaner character linework (Makoto Shinkai-style environmental detail). Speed lines for motion, dramatic lens flares, and volumetric light rays. Cherry blossoms, clouds, or particles floating through scenes for atmosphere. The polish and production value of a high-budget anime film — think Your Name or Violet Evergarden. Emotionally evocative, visually stunning, and meticulously composed. NEVER include any text, letters, words, captions, labels, titles, speech bubbles, or watermarks of any kind.",
  },
};

// The same coffee shop scene used for all other preset reference images
const COFFEE_SHOP_BEAT = `VISUAL: Close on a woman's hands wrapped around a warm coffee cup. She sits alone at a corner café table. Soft window light, autumn leaves visible through glass behind her. She stares off-frame, contemplative.
AUDIO: (V.O.) I thought I knew exactly what I wanted. Funny how that changes.`;

const MODEL = 'gemini-3.1-flash-image-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function generateImage(apiKey, stylePrompt) {
  const fullPrompt = `MANDATORY VISUAL STYLE (the entire image MUST match this style):\n${stylePrompt}\n\nSCENE TO VISUALIZE:\n${COFFEE_SHOP_BEAT}`;

  const response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) {
    throw new Error(`No image in response. Parts: ${JSON.stringify(parts.map(p => Object.keys(p)))}`);
  }

  return Buffer.from(imagePart.inlineData.data, 'base64');
}

async function main() {
  const apiKey = loadEnv();
  const outDir = resolve(ROOT, 'public/images/storyboard-presets');

  // Which styles to generate (default: all 4)
  const args = process.argv.slice(2);
  const targets = args.length > 0
    ? args.filter((a) => STYLE_PRESETS[a])
    : Object.keys(STYLE_PRESETS);

  if (targets.length === 0) {
    console.error('No valid style keys specified. Valid: watercolor, noir, documentary, anime');
    process.exit(1);
  }

  console.log(`Generating images for: ${targets.join(', ')}`);
  console.log('4 images per style, ~30-60s per image...\n');

  for (const key of targets) {
    const preset = STYLE_PRESETS[key];
    console.log(`▸ ${preset.label}`);

    for (let i = 1; i <= 4; i++) {
      const filename = i === 1 ? `${key}.png` : `${key}-${i}.png`;
      const outPath = resolve(outDir, filename);

      process.stdout.write(`  ${filename} ... `);
      try {
        const buf = await generateImage(apiKey, preset.prompt);
        writeFileSync(outPath, buf);
        console.log(`✓ (${(buf.length / 1024).toFixed(0)}KB)`);
      } catch (err) {
        console.log(`✗ FAILED: ${err.message}`);
      }

      // Small delay between requests to avoid rate limits
      if (i < 4) await new Promise((r) => setTimeout(r, 2000));
    }
    console.log('');
  }

  console.log('Done! Update STYLE_PRESETS in ScriptStylePanel.tsx to reference the new .png files.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
