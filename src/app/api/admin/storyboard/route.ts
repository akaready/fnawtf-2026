import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { STYLE_PRESETS } from '@/app/admin/scripts/_components/ScriptStylePanel';
import type { StoryboardStylePreset } from '@/types/scripts';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.1-flash-image-preview';
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
  } = body;

  if (!scriptId || (!beatId && !sceneId)) {
    return NextResponse.json({ error: 'scriptId and beatId or sceneId required' }, { status: 400 });
  }

  try {
    // Build prompt: preset → custom style → beat content (audio, visual, notes)
    const promptParts: string[] = [];

    // Style instructions come first and are strongly framed
    const hasStyle = (stylePreset && STYLE_PRESETS[stylePreset]) || stylePrompt;
    if (hasStyle) {
      promptParts.push('MANDATORY VISUAL STYLE (the entire image MUST match this style):');
      if (stylePreset && STYLE_PRESETS[stylePreset]) {
        promptParts.push(STYLE_PRESETS[stylePreset].prompt);
      }
      if (stylePrompt) {
        promptParts.push(stylePrompt);
      }
      promptParts.push('');
    }

    promptParts.push('Generate a single storyboard frame based on the following context:');
    promptParts.push(contentPrompt);
    promptParts.push('');
    promptParts.push('Single frame, no text overlays. The visual style above is non-negotiable.');

    // If cast reference photos are included, instruct the model to match appearance
    const castUrls = castReferenceUrls.slice(0, 2);
    if (castUrls.length > 0) {
      promptParts.push('');
      promptParts.push('CHARACTER REFERENCE PHOTOS are included as reference images. Match the physical appearance of these people in the generated frame.');
    }

    const textPart = promptParts.join('\n');

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: textPart },
    ];

    // Fetch reference images: style refs (up to 4) + cast refs (up to 2) + beat refs (remaining), cap 8
    const styleUrls = referenceImageUrls.slice(0, 4);
    const remainingSlots = 8 - styleUrls.length - castUrls.length;
    const allRefUrls = [
      ...styleUrls,
      ...castUrls,
      ...beatReferenceUrls.slice(0, Math.max(0, remainingSlots)),
    ].slice(0, 8);
    for (const url of allRefUrls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType,
            data: buf.toString('base64'),
          },
        });
      } catch {
        // Skip failed reference images
      }
    }

    // Call Nano Banana 2
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
