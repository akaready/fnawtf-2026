import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { STYLE_PRESETS } from '@/lib/scripts/stylePresets';
import type { StoryboardStylePreset } from '@/types/scripts';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Nano Banana Pro — built for complex multi-constraint instructions. Override via STORYBOARD_MODEL env var.
const MODEL = process.env.STORYBOARD_MODEL ?? 'gemini-3-pro-image-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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
  consistencyFrameUrls?: string[];
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
    referenceImageUrls = [], beatReferenceUrls = [], castReferenceUrls = [],
    locationReferenceUrls = [], consistencyFrameUrls = [],
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

    // ── Image slot allocation (14 total — Nano Banana Pro maximum) ──
    // Object slots (cap 6): style(2) + location(2) + beat/product(2) = 6
    // Character slots (cap 5): cast(4)
    // Remaining slots: consistency/nearby frames(4)
    // Total: 2 + 4 + 2 + 2 + 4 = 14
    const styleUrls       = referenceImageUrls.slice(0, 2);
    const castUrls        = castReferenceUrls.slice(0, 4);
    const consistencyUrls = consistencyFrameUrls.slice(0, 4);
    const locUrls         = locationReferenceUrls.slice(0, 2);
    const beatUrls        = beatReferenceUrls.slice(0, 2);

    // ── Build structured JSON prompt ──
    const styleBlock = (stylePreset && STYLE_PRESETS[stylePreset])
      ? STYLE_PRESETS[stylePreset].jsonStyle
      : stylePrompt
        ? { name: 'Custom style', rendering: stylePrompt, depth_of_field: 'f/2.0' }
        : null;

    // Reference image declarations numbered to match inline parts order
    const refDeclarations: object[] = [];
    let imgIdx = 1;

    if (styleUrls.length > 0) {
      refDeclarations.push({
        image_ids: Array.from({ length: styleUrls.length }, (_, i) => imgIdx + i),
        purpose: 'style reference',
        extract: 'visual rendering technique, line weight, color palette, shading approach, overall feel',
        apply_to: 'entire output — match this style exactly',
      });
      imgIdx += styleUrls.length;
    }
    if (consistencyUrls.length > 0) {
      refDeclarations.push({
        image_ids: Array.from({ length: consistencyUrls.length }, (_, i) => imgIdx + i),
        purpose: 'nearby frames from this storyboard sequence',
        extract: 'visual style, line weight, color palette, rendering technique, character appearances, environment',
        apply_to: 'entire output — your frame must be visually indistinguishable from these',
      });
      imgIdx += consistencyUrls.length;
    }
    if (castUrls.length > 0) {
      refDeclarations.push({
        image_ids: Array.from({ length: castUrls.length }, (_, i) => imgIdx + i),
        purpose: 'character appearance reference',
        extract: 'exact facial structure, hair color and style, eye shape, skin tone, identifying physical features',
        apply_to: 'character rendering — this specific person, match exactly every frame',
      });
      imgIdx += castUrls.length;
    }
    if (locUrls.length > 0) {
      refDeclarations.push({
        image_ids: Array.from({ length: locUrls.length }, (_, i) => imgIdx + i),
        purpose: 'location environment reference',
        extract: 'architecture, surfaces, spatial layout, lighting quality, color palette of this specific place',
        apply_to: 'environment rendering — this specific location, match exactly every frame',
      });
      imgIdx += locUrls.length;
    }
    if (beatUrls.length > 0) {
      refDeclarations.push({
        image_ids: Array.from({ length: beatUrls.length }, (_, i) => imgIdx + i),
        purpose: 'product or visual reference for this scene',
        extract: 'exact appearance, shape, color, and details of this product or object',
        apply_to: 'product or object rendering — match exactly as shown',
      });
    }

    const promptObj = {
      task: 'Generate a single storyboard frame illustration',
      ...(styleBlock && { style: styleBlock }),
      sequence_consistency: consistencyUrls.length > 0
        ? 'CRITICAL: This is one frame in an ongoing storyboard sequence. Your output MUST be visually indistinguishable from the nearby frames provided — same artist, same medium, same rendering technique, same character appearances. Zero drift between frames.'
        : 'This is one frame in an ongoing storyboard sequence. Apply the style parameters above with absolute consistency — same artist, same tools, same rendering every frame.',
      scene: {
        content: contentPrompt,
      },
      ...(refDeclarations.length > 0 && { reference_images: refDeclarations }),
      constraints: {
        must_avoid: [
          'any text, letters, numbers, words, or symbols rendered anywhere in the image',
          'borders, panel frames, or rectangular outlines drawn inside the image',
          'watermarks, production logos, or frame numbering',
          'camera equipment — boom microphones, tripods, light stands, camera rigs',
          'crew members, camera operators, sound recordists',
          'interviewer presence in interview scenes — subject only on camera, no OTS shots',
          'whiteboards or screens with readable content — show them blank or with abstract shapes only',
        ],
        output: 'edge-to-edge illustration filling 100% of canvas with zero internal borders',
      },
      output_specifications: {
        resolution: '2K',
        aspect_ratio: aspectRatio,
        format: 'single storyboard frame',
      },
    };

    const textPart = JSON.stringify(promptObj, null, 2);

    // ── Assemble parts: text first, then reference images in declared order ──
    const parts: Part[] = [{ text: textPart }];

    // Fetch all image groups in parallel
    const [styleImgs, consistencyImgs, castImgs, locImgs, beatImgs] = await Promise.all([
      Promise.all(styleUrls.map(fetchImagePart)),
      Promise.all(consistencyUrls.map(fetchImagePart)),
      Promise.all(castUrls.map(fetchImagePart)),
      Promise.all(locUrls.map(fetchImagePart)),
      Promise.all(beatUrls.map(fetchImagePart)),
    ]);

    for (const img of styleImgs)       { if (img) parts.push(img); }
    for (const img of consistencyImgs) { if (img) parts.push(img); }
    for (const img of castImgs)        { if (img) parts.push(img); }
    for (const img of locImgs)         { if (img) parts.push(img); }
    for (const img of beatImgs)        { if (img) parts.push(img); }

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
          responseModalities: ['IMAGE'],
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
