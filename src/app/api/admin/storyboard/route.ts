import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { STYLE_PRESETS } from '@/lib/scripts/stylePresets';
import type { StoryboardStylePreset } from '@/types/scripts';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Nano Banana Pro — built for complex multi-constraint instructions. Override via STORYBOARD_MODEL env var.
const MODEL = process.env.STORYBOARD_MODEL ?? 'gemini-3-pro-image-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
// Image editing uses 3.1 Flash per Google docs — Pro doesn't reliably modify existing images.
const MODIFY_MODEL = process.env.STORYBOARD_MODIFY_MODEL ?? 'gemini-3.1-flash-image-preview';
const MODIFY_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODIFY_MODEL}:generateContent`;

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
  /** Parallel array to castReferenceUrls — character name for each cast image */
  castReferenceLabels?: string[];
  /** When set from the generation modal, overrides contentPrompt in the structured JSON */
  promptOverride?: string;
  /** Image modification mode — send existing image + edit instructions */
  modifyMode?: boolean;
  modifyImageUrl?: string;
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
    castReferenceLabels = [],
    promptOverride,
    modifyMode, modifyImageUrl,
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

    // ── Modification mode: send existing image + edit instructions ──
    if (modifyMode && modifyImageUrl) {
      // Image first, then instruction — Gemini edits better when it sees the image before the ask
      const modifyParts: Part[] = [];
      const srcImg = await fetchImagePart(modifyImageUrl);
      if (srcImg) modifyParts.push(srcImg);

      const instruction = (promptOverride?.trim()) || 'Improve this image';
      const modifyTextPart = `Using the provided storyboard frame, ${instruction}. Keep the art style, medium, and any elements not mentioned in the instructions unchanged. Do not add any text, letters, borders, or watermarks.`;

      modifyParts.push({ text: modifyTextPart });

      const geminiRes = await fetch(MODIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: modifyParts }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error('Gemini API error (modify):', errText);
        return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 502 });
      }

      const geminiData = await geminiRes.json();
      const candidate = geminiData.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(
        (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.data
      );
      if (!imagePart?.inlineData) {
        return NextResponse.json({ error: 'No image in response' }, { status: 502 });
      }

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

      // Deactivate existing active frame(s)
      if (beatId) {
        await serviceClient.from('script_storyboard_frames').update({ is_active: false } as never).eq('beat_id', beatId).eq('is_active', true);
      } else if (sceneId) {
        await serviceClient.from('script_storyboard_frames').update({ is_active: false } as never).eq('scene_id', sceneId).eq('is_active', true);
      }

      const { data: frame, error: insertErr } = await serviceClient
        .from('script_storyboard_frames')
        .insert({
          script_id: scriptId, beat_id: beatId ?? null, scene_id: sceneId ?? null,
          image_url, storage_path: storagePath, source: 'generated',
          prompt_used: modifyTextPart, is_active: true, slot: 1,
          reference_urls_used: [{ url: modifyImageUrl, purpose: 'beat' }],
        } as never)
        .select('*')
        .single();
      if (insertErr) throw new Error(insertErr.message);

      return NextResponse.json({ frame });
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

    // ── Fetch all reference images first, then build declarations from what succeeded ──
    const [styleImgs, consistencyImgs, castImgs, locImgs, beatImgs] = await Promise.all([
      Promise.all(styleUrls.map(fetchImagePart)),
      Promise.all(consistencyUrls.map(fetchImagePart)),
      Promise.all(castUrls.map(fetchImagePart)),
      Promise.all(locUrls.map(fetchImagePart)),
      Promise.all(beatUrls.map(fetchImagePart)),
    ]);

    // Build image parts array and reference declarations based on ACTUALLY fetched images
    const imageParts: Part[] = [];
    const refDeclarations: object[] = [];
    let imgIdx = 1;

    // Helper: add a group of images, return the image_ids that succeeded
    function addImageGroup(results: (Part | null)[]): number[] {
      const ids: number[] = [];
      for (const img of results) {
        if (img) { imageParts.push(img); ids.push(imgIdx); imgIdx++; }
      }
      return ids;
    }

    const styleIds = addImageGroup(styleImgs);
    if (styleIds.length > 0) {
      refDeclarations.push({
        image_ids: styleIds,
        purpose: 'style reference',
        extract: 'visual rendering technique, line weight, color palette, shading approach, overall feel',
        apply_to: 'entire output — match this style exactly',
      });
    }

    const consistencyIds = addImageGroup(consistencyImgs);
    if (consistencyIds.length > 0) {
      refDeclarations.push({
        image_ids: consistencyIds,
        purpose: 'nearby frames from this storyboard sequence',
        extract: 'visual style, line weight, color palette, rendering technique, character appearances, environment',
        apply_to: 'entire output — your frame must be visually indistinguishable from these',
      });
    }

    // Cast images: group per-character based on which actually fetched
    const castIds = addImageGroup(castImgs);
    if (castIds.length > 0) {
      const charGroups = new Map<string, number[]>();
      // Map successful fetch indices back to their labels
      let castSuccessIdx = 0;
      for (let i = 0; i < castImgs.length; i++) {
        if (castImgs[i]) {
          const name = castReferenceLabels[i] || 'Unknown character';
          if (!charGroups.has(name)) charGroups.set(name, []);
          charGroups.get(name)!.push(castIds[castSuccessIdx]);
          castSuccessIdx++;
        }
      }
      for (const [name, ids] of charGroups) {
        refDeclarations.push({
          image_ids: ids,
          purpose: `appearance reference for character: ${name}`,
          extract: `exact facial structure, hair color and style, eye shape, skin tone, identifying physical features of ${name}`,
          apply_to: `rendering of ${name} — this is what ${name} looks like, match exactly every frame`,
        });
      }
    }

    const locIds = addImageGroup(locImgs);
    if (locIds.length > 0) {
      refDeclarations.push({
        image_ids: locIds,
        purpose: 'location environment reference',
        extract: 'architecture, surfaces, spatial layout, lighting quality, color palette of this specific place',
        apply_to: 'environment rendering — this specific location, match exactly every frame',
      });
    }

    const beatIds = addImageGroup(beatImgs);
    if (beatIds.length > 0) {
      refDeclarations.push({
        image_ids: beatIds,
        purpose: 'product or visual reference for this scene',
        extract: 'exact appearance, shape, color, and details of this product or object',
        apply_to: 'product or object rendering — match exactly as shown',
      });
    }

    const promptObj = {
      task: 'Generate a single storyboard frame illustration',
      ...(styleBlock && { style: styleBlock }),
      sequence_consistency: consistencyIds.length > 0
        ? 'CRITICAL: This is one frame in an ongoing storyboard sequence. Your output MUST be visually indistinguishable from the nearby frames provided — same artist, same medium, same rendering technique, same character appearances. Zero drift between frames.'
        : 'This is one frame in an ongoing storyboard sequence. Apply the style parameters above with absolute consistency — same artist, same tools, same rendering every frame.',
      scene: {
        content: promptOverride || contentPrompt,
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
    const parts: Part[] = [{ text: textPart }, ...imageParts];

    // Call Gemini with 90s timeout
    const geminiController = new AbortController();
    const geminiTimeout = setTimeout(() => geminiController.abort(), 90_000);
    let geminiRes: Response;
    try {
      geminiRes = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        signal: geminiController.signal,
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
    } catch (fetchErr) {
      clearTimeout(geminiTimeout);
      if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'Generation timed out (90s). Try again or simplify the prompt.' }, { status: 504 });
      }
      throw fetchErr;
    } finally {
      clearTimeout(geminiTimeout);
    }

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

    // Deactivate existing active frame(s) — preserve history instead of deleting
    if (beatId) {
      await serviceClient
        .from('script_storyboard_frames')
        .update({ is_active: false } as never)
        .eq('beat_id', beatId)
        .eq('is_active', true);
    } else if (sceneId) {
      await serviceClient
        .from('script_storyboard_frames')
        .update({ is_active: false } as never)
        .eq('scene_id', sceneId)
        .eq('is_active', true);
    }

    // Build reference URL history for this generation
    const referenceUrlsUsed = [
      ...styleUrls.map(url => ({ url, purpose: 'style' })),
      ...castUrls.map(url => ({ url, purpose: 'cast' })),
      ...locUrls.map(url => ({ url, purpose: 'location' })),
      ...beatUrls.map(url => ({ url, purpose: 'beat' })),
      ...consistencyUrls.map(url => ({ url, purpose: 'consistency' })),
    ];

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
        is_active: true,
        slot: 1,
        reference_urls_used: referenceUrlsUsed,
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
