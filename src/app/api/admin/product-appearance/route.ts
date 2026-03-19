import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-pro';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface ProductAppearanceRequest {
  imageUrls: string[];
  metadata: {
    name: string;
    description?: string;
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const { imageUrls, metadata } = (await request.json()) as ProductAppearanceRequest;

  if (!imageUrls || imageUrls.length === 0) {
    return NextResponse.json({ error: 'imageUrls required' }, { status: 400 });
  }

  try {
    // Fetch and encode images (up to 8)
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (const url of imageUrls.slice(0, 8)) {
      try {
        const imgRes = await fetch(url);
        if (!imgRes.ok) continue;
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';
        imageParts.push({ inlineData: { mimeType, data: buf.toString('base64') } });
      } catch {
        // Skip failed images
      }
    }

    if (imageParts.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch any product images' }, { status: 502 });
    }

    // Build context from metadata
    const contextLines: string[] = [];
    if (metadata.name) contextLines.push(`Product name: ${metadata.name}`);
    if (metadata.description) contextLines.push(`Notes: ${metadata.description}`);
    const contextBlock = contextLines.length > 0
      ? `\nCONTEXT (use to inform your description but do not repeat verbatim):\n${contextLines.join('\n')}\n`
      : '';

    const multiImage = imageParts.length > 1;
    const prompt = [
      multiImage
        ? `These ${imageParts.length} photos show the SAME product from different angles. Analyze ALL photos together to build the most comprehensive visual description possible. Cross-reference details across images to capture every surface, material, and visual feature.`
        : `Analyze this photo of a product and provide an exhaustively detailed visual description.`,
      contextBlock,
      `Write a COMPREHENSIVE visual description in 3-4 DENSE paragraphs (at least 10-15 sentences total). This is for AI image generation — the description must be detailed enough to accurately recreate this product in a storyboard frame. Cover ALL of the following in rich, specific detail:`,
      ``,
      `PARAGRAPH 1 — FORM & SHAPE:`,
      `- Overall object category (bottle, device, garment, box, tool, etc.)`,
      `- Three-dimensional form: silhouette, proportions, aspect ratio`,
      `- Structural features: corners, edges, curves, symmetry, any notable geometry`,
      `- Size relative to implied scale (compact, large, elongated, etc.)`,
      `- Any handles, lids, closures, buttons, ports, or functional elements`,
      ``,
      `PARAGRAPH 2 — SURFACE & MATERIALS:`,
      `- Primary material(s): glass, metal, plastic, fabric, leather, paper, ceramic, etc.`,
      `- Surface finish: matte, gloss, satin, textured, brushed, frosted, transparent`,
      `- Dominant colors: be specific (not just "blue" — describe tone, saturation, lightness)`,
      `- Secondary colors or accents`,
      `- Any gradients, patterns, or surface treatments (embossing, foiling, print)`,
      `- Transparency or opacity if applicable`,
      ``,
      `PARAGRAPH 3 — VISUAL IDENTITY & DETAILS:`,
      `- Label or packaging design: layout, text areas (describe placement, NOT brand names)`,
      `- Graphic elements: icons, shapes, illustrations, color blocks on label/packaging`,
      `- Typography style on product (serif, sans-serif, script — describe without reading brand)`,
      `- Any lids, caps, applicators, or secondary components`,
      `- Distinguishing visual details that make this product recognizable`,
      ``,
      `PARAGRAPH 4 — CONTEXT & PRESENTATION:`,
      `- How the product is oriented in the image (upright, angled, flat lay, hero shot)`,
      `- Background or surface it rests on`,
      `- Lighting quality: direction, softness, any specular highlights or reflections on surface`,
      `- Overall visual mood (clean studio, lifestyle, dark dramatic, bright minimal)`,
      ``,
      `CRITICAL RULES:`,
      `- Do NOT mention brand names, company names, or specific product names`,
      `- Do NOT read or transcribe text visible on the product or packaging`,
      `- Do NOT speculate about ingredients, contents, or function`,
      `- Write in third person present tense using "This product" as the subject`,
      `- Be OBJECTIVE and PRECISE — describe what you see, not what you interpret`,
      `- Use specific visual language a product designer or prop stylist would use`,
      `- When in doubt, be more detailed rather than less`,
    ].join('\n');

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: prompt },
      ...imageParts,
    ];

    const geminiRes = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini product appearance error:', errText);
      return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 502 });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No description generated' }, { status: 502 });
    }

    return NextResponse.json({ appearancePrompt: text.trim() });
  } catch (err) {
    console.error('Product appearance extraction error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed' },
      { status: 500 },
    );
  }
}
