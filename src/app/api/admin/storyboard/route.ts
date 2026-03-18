import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { STYLE_PRESETS } from '@/app/admin/scripts/_components/ScriptStylePanel';
import type { StoryboardStylePreset } from '@/types/scripts';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Nano Banana Pro — built for complex multi-constraint instructions. Override via STORYBOARD_MODEL env var.
const MODEL = process.env.STORYBOARD_MODEL ?? 'gemini-3-pro-image-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Absolute rules injected at the very top of every prompt — must appear before style or content.
const ABSOLUTE_RULES = `\
════════════════════════════════════════════════════════
ABSOLUTE RULES — THESE OVERRIDE EVERY OTHER INSTRUCTION
════════════════════════════════════════════════════════

ZERO TEXT: No words, letters, numbers, percentages, statistics, labels, captions, \
scene titles, dialogue, subtitles, speech bubbles, sound effects, infographics, \
charts, graphs, or data visualizations anywhere in the image — not on whiteboards \
or chalkboards (show them BLANK or with abstract scribbles only), not on screens or \
monitors (show abstract glowing shapes only), not as statistical overlays, not as \
frame numbers, production notes, or directional arrows. If the script mentions data \
or statistics, represent the CONCEPT through people, objects, and environments only — \
never as readable numbers or text.

ZERO BORDERS: No storyboard panel borders, no rectangular frames drawn inside the \
image, no decorative edges, no vignette treatments that create a frame-within-a-frame \
effect. The illustration fills 100% of the image edge-to-edge with zero internal borders.

ZERO WATERMARKS: No production logos, copyright notices, studio identifiers, or \
frame numbering of any kind.`;

interface GenerateRequest {
  scriptId: string;
  beatId?: string;
  sceneId?: string;
  contentPrompt: string;
  stylePrompt: string;
  stylePreset?: StoryboardStylePreset | null;
  notesContent?: string;
  aspectRatio?: string;
  referenceImageUrls?: string[];
  beatReferenceUrls?: string[];
  castReferenceUrls?: string[];
  locationReferenceUrls?: string[];
}

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const body = (await request.json()) as GenerateRequest;
  const {
    scriptId, beatId, sceneId, contentPrompt, stylePrompt,
    stylePreset, notesContent: _notesContent, aspectRatio = '16:9',
    referenceImageUrls = [], beatReferenceUrls = [], castReferenceUrls = [], locationReferenceUrls = [],
  } = body;

  if (!scriptId || (!beatId && !sceneId)) {
    return NextResponse.json({ error: 'scriptId and beatId or sceneId required' }, { status: 400 });
  }

  try {
    type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

    // Helper: fetch a URL and return an inlineData part, or null on failure
    async function fetchImagePart(url: string): Promise<Part | null> {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
        return { inlineData: { mimeType, data: buf.toString('base64') } };
      } catch {
        return null;
      }
    }

    // ── Section 1: Absolute rules (top of prompt — highest enforcement weight) ──
    const promptSections: string[] = [ABSOLUTE_RULES, ''];

    // ── Section 2: Mandatory visual style ──
    const hasStyle = (stylePreset && STYLE_PRESETS[stylePreset]) || stylePrompt;
    if (hasStyle) {
      promptSections.push('════════════════════════════════════════════════════════');
      promptSections.push('MANDATORY VISUAL STYLE — every pixel of this image MUST match:');
      promptSections.push('════════════════════════════════════════════════════════');
      if (stylePreset && STYLE_PRESETS[stylePreset]) {
        promptSections.push(STYLE_PRESETS[stylePreset].prompt);
      }
      if (stylePrompt) {
        promptSections.push(stylePrompt);
      }
      promptSections.push('');
      promptSections.push(
        'SEQUENCE CONSISTENCY: This is one frame in a multi-frame storyboard sequence. ' +
        'It MUST look as if drawn by the same artist using identical tools, identical line ' +
        'weight, identical color palette, identical shading technique, and identical rendering ' +
        'approach as every other frame in this project. Do not introduce any new colors, ' +
        'textures, or techniques not specified above. Do not drift.'
      );
      promptSections.push('');
    }

    // ── Section 3: Scene content ──
    promptSections.push('════════════════════════════════════════════════════════');
    promptSections.push('SCENE CONTENT — generate a single storyboard frame for:');
    promptSections.push('════════════════════════════════════════════════════════');
    promptSections.push(contentPrompt);
    promptSections.push('');

    // ── Section 4: Location references (text header only — images follow inline) ──
    if (locationReferenceUrls.length > 0) {
      promptSections.push('════════════════════════════════════════════════════════');
      promptSections.push('LOCATION REFERENCE PHOTOS — see attached images below:');
      promptSections.push('════════════════════════════════════════════════════════');
      promptSections.push(
        'The attached photos show the actual location where this scene takes place. ' +
        'You MUST replicate the environment\'s architecture, surfaces, lighting quality, ' +
        'color palette, and spatial feel. This is not a "similar-looking" place — it is ' +
        'THIS specific location. Match the reference photos exactly in every frame.'
      );
      promptSections.push('');
    }

    // ── Section 5: Character references (text header only — images follow inline) ──
    const castUrls = castReferenceUrls.slice(0, 2);
    if (castUrls.length > 0) {
      promptSections.push('════════════════════════════════════════════════════════');
      promptSections.push('CHARACTER REFERENCE PHOTOS — see attached images below:');
      promptSections.push('════════════════════════════════════════════════════════');
      promptSections.push(
        'The attached photos define this character\'s exact appearance. You MUST replicate ' +
        'their precise facial structure, hair color and style, eye shape, skin tone, and key ' +
        'identifying physical features. This is not a "similar-looking" person — it is THIS ' +
        'specific person. Match the reference photos exactly in every frame.'
      );
      promptSections.push('');
    }

    const textPart = promptSections.join('\n');

    // ── Assemble parts: text first, then reference images interleaved with labels ──
    const styleUrls = referenceImageUrls.slice(0, 4);
    const locUrls = locationReferenceUrls.slice(0, 2);
    const remainingSlots = Math.max(0, 8 - styleUrls.length - castUrls.length - locUrls.length);
    const beatUrls = beatReferenceUrls.slice(0, remainingSlots);

    const parts: Part[] = [{ text: textPart }];

    // Style reference images — labeled group
    if (styleUrls.length > 0) {
      parts.push({ text: 'STYLE REFERENCE IMAGES (match this visual style exactly):' });
      const styleImgs = await Promise.all(styleUrls.map(fetchImagePart));
      for (const img of styleImgs) { if (img) parts.push(img); }
    }

    // Character reference images — labeled group
    if (castUrls.length > 0) {
      parts.push({ text: 'CHARACTER REFERENCE PHOTOS (replicate this face exactly — same person every frame):' });
      const castImgs = await Promise.all(castUrls.map(fetchImagePart));
      for (const img of castImgs) { if (img) parts.push(img); }
    }

    // Location reference images — labeled group
    if (locUrls.length > 0) {
      parts.push({ text: 'LOCATION REFERENCE PHOTOS (replicate this environment exactly — same location every frame):' });
      const locImgs = await Promise.all(locUrls.map(fetchImagePart));
      for (const img of locImgs) { if (img) parts.push(img); }
    }

    // Beat visual reference images — labeled group
    if (beatUrls.length > 0) {
      parts.push({ text: 'VISUAL REFERENCE for this scene:' });
      const beatImgs = await Promise.all(beatUrls.map(fetchImagePart));
      for (const img of beatImgs) { if (img) parts.push(img); }
    }

    // Call Nano Banana Pro
    const geminiRes = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio,
            imageSize: '2K',
          },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const candidate = geminiData.candidates?.[0];
    if (!candidate?.content?.parts) {
      return NextResponse.json({ error: 'No image generated' }, { status: 502 });
    }

    // Find the image part in the response
    const imagePart = candidate.content.parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.data
    );

    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: 'No image in response' }, { status: 502 });
    }

    // Upload to Supabase storage
    const serviceClient = createServiceClient();
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const folder = beatId ?? sceneId ?? 'unknown';
    const storagePath = `frames/${folder}/${Date.now()}.png`;

    const { error: uploadErr } = await serviceClient.storage
      .from('script-storyboards')
      .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: false });
    if (uploadErr) throw new Error(uploadErr.message);

    const { data: urlData } = serviceClient.storage.from('script-storyboards').getPublicUrl(storagePath);
    const image_url = urlData.publicUrl;

    // Delete existing frame for this beat/scene (single image per beat)
    if (beatId) {
      const { data: old } = await serviceClient
        .from('script_storyboard_frames')
        .select('id, storage_path')
        .eq('beat_id', beatId);
      if (old && old.length > 0) {
        const paths = (old as { storage_path: string }[]).map(r => r.storage_path);
        await serviceClient.storage.from('script-storyboards').remove(paths);
        await serviceClient.from('script_storyboard_frames').delete().eq('beat_id', beatId);
      }
    } else if (sceneId) {
      const { data: old } = await serviceClient
        .from('script_storyboard_frames')
        .select('id, storage_path')
        .eq('scene_id', sceneId);
      if (old && old.length > 0) {
        const paths = (old as { storage_path: string }[]).map(r => r.storage_path);
        await serviceClient.storage.from('script-storyboards').remove(paths);
        await serviceClient.from('script_storyboard_frames').delete().eq('scene_id', sceneId);
      }
    }

    // Insert frame record
    const { data: frame, error: insertErr } = await serviceClient
      .from('script_storyboard_frames')
      .insert({
        script_id: scriptId,
        beat_id: beatId ?? null,
        scene_id: sceneId ?? null,
        image_url,
        storage_path: storagePath,
        source: 'generated',
        prompt_used: textPart,
      } as never)
      .select('*')
      .single();
    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({ frame });
  } catch (err) {
    console.error('Storyboard generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
