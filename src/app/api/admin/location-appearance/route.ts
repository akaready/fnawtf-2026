import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-pro';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface LocationAppearanceRequest {
  imageUrls: string[];
  metadata: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
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

  const { imageUrls, metadata } = (await request.json()) as LocationAppearanceRequest;

  if (!imageUrls || imageUrls.length === 0) {
    return NextResponse.json({ error: 'imageUrls required' }, { status: 400 });
  }

  try {
    // Fetch and encode images (up to 5)
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (const url of imageUrls.slice(0, 5)) {
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
      return NextResponse.json({ error: 'Failed to fetch any location images' }, { status: 502 });
    }

    // Build context from metadata
    const contextLines: string[] = [];
    if (metadata.name) contextLines.push(`Location name: ${metadata.name}`);
    if (metadata.address) contextLines.push(`Address: ${metadata.address}`);
    if (metadata.city || metadata.state) {
      contextLines.push(`City/State: ${[metadata.city, metadata.state].filter(Boolean).join(', ')}`);
    }
    if (metadata.description) contextLines.push(`Notes: ${metadata.description}`);
    const contextBlock = contextLines.length > 0
      ? `\nCONTEXT (use to inform your description but do not repeat verbatim):\n${contextLines.join('\n')}\n`
      : '';

    const multiImage = imageParts.length > 1;
    const prompt = [
      multiImage
        ? `These ${imageParts.length} photos show the SAME location/space from different angles. Analyze ALL photos together to build the most comprehensive visual description possible. Cross-reference details across images to capture every surface, material, and spatial element.`
        : `Analyze this photo of a location/space and provide an exhaustively detailed visual description.`,
      contextBlock,
      `Write a COMPREHENSIVE visual description in 3-4 DENSE paragraphs (at least 10-15 sentences total). This is for AI image generation — the description must be detailed enough to recreate this space from text alone. Cover ALL of the following in rich, specific detail:`,
      ``,
      `PARAGRAPH 1 — SPACE TYPE & ARCHITECTURE:`,
      `- Interior or exterior setting`,
      `- Room type or space category (studio, loft, rooftop, garden, warehouse, kitchen, etc.)`,
      `- Architectural style (modern, industrial, mid-century, Victorian, minimalist, etc.)`,
      `- Ceiling height and type (exposed beams, vaulted, dropped, skylights)`,
      `- Structural elements (columns, arches, load-bearing walls, staircases)`,
      `- Overall dimensions feel (intimate, expansive, narrow, open-plan)`,
      `- Windows and openings (size, shape, placement, natural light quality)`,
      ``,
      `PARAGRAPH 2 — SURFACES & MATERIALS:`,
      `- Wall finish and color (painted drywall, exposed brick, concrete, wood paneling, tile — describe exact tones)`,
      `- Floor material and color (hardwood species/shade, polished concrete, tile pattern, carpet)`,
      `- Countertops, shelving, or work surfaces if visible (material, color, finish)`,
      `- Fixtures and hardware (light fixtures, door handles, faucets — style and finish)`,
      `- Any accent materials (stone, metal, glass, fabric — describe textures)`,
      ``,
      `PARAGRAPH 3 — LIGHTING & ATMOSPHERE:`,
      `- Natural light: direction, intensity, quality (warm golden, cool diffused, dappled)`,
      `- Artificial lighting: type (pendant, recessed, track, sconce, neon), warmth, brightness`,
      `- Overall mood and atmosphere (bright and airy, moody and dramatic, warm and cozy, stark and minimal)`,
      `- Shadow patterns and contrast levels`,
      `- Color temperature of the overall space`,
      ``,
      `PARAGRAPH 4 — KEY VISUAL ELEMENTS:`,
      `- Furniture: style, material, color, placement (be specific — "tufted leather Chesterfield sofa" not just "couch")`,
      `- Decor and accessories: art, plants, rugs, curtains, shelving contents`,
      `- Signage, branding, or distinctive visual markers`,
      `- Spatial layout: how elements are arranged, sight lines, focal points`,
      `- Background depth and what's visible in the distance`,
      `- Any outdoor elements visible (landscape, cityscape, sky)`,
      ``,
      `CRITICAL RULES:`,
      `- Do NOT mention brand names, company names, or specific product names`,
      `- Do NOT describe people or personal belongings`,
      `- Do NOT reference pricing, capacity, availability, or business operations`,
      `- Do NOT speculate about ownership, purpose, or history`,
      `- Write in third person present tense using "This space" as the subject`,
      `- Be OBJECTIVE and PRECISE — describe what you see, not what you interpret`,
      `- Use specific visual language a production designer would use`,
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
      console.error('Gemini location appearance error:', errText);
      return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 502 });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No description generated' }, { status: 502 });
    }

    return NextResponse.json({ appearancePrompt: text.trim() });
  } catch (err) {
    console.error('Location appearance extraction error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed' },
      { status: 500 },
    );
  }
}
