import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-pro';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface AppearanceRequest {
  headshotUrls: string[];
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

  const { headshotUrls } = (await request.json()) as AppearanceRequest;

  if (!headshotUrls || headshotUrls.length === 0) {
    return NextResponse.json({ error: 'headshotUrls required' }, { status: 400 });
  }

  try {
    // Fetch and encode all headshots (up to 6)
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (const url of headshotUrls.slice(0, 6)) {
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
      return NextResponse.json({ error: 'Failed to fetch any headshot images' }, { status: 502 });
    }

    const multiImage = imageParts.length > 1;
    const prompt = [
      multiImage
        ? `These ${imageParts.length} photos all show the SAME person from different angles and lighting conditions. Analyze ALL photos together to build the most comprehensive and precise physical description possible. Cross-reference details across images to capture every nuance.`
        : `Analyze this headshot photo and provide an exhaustively detailed physical description of this person.`,
      ``,
      `Write a COMPREHENSIVE physical description in 3-4 DENSE paragraphs (at least 10-15 sentences total). This is for AI image generation — the description must be detailed enough to recreate this person's likeness from text alone. Cover ALL of the following in rich, specific detail:`,
      ``,
      `PARAGRAPH 1 — FACE STRUCTURE & SKIN:`,
      `- Gender presentation and approximate age range (be specific, e.g. "early 30s" not just "adult")`,
      `- Skin tone described with nuance (undertones, warmth, luminosity — e.g. "warm golden-brown with amber undertones" or "porcelain fair with cool pink undertones and light freckling across the bridge of the nose")`,
      `- Face shape (oval, round, square, diamond, heart, oblong, etc.)`,
      `- Bone structure in detail: brow ridge prominence, cheekbone height and width, jawline angle and definition, chin shape and projection`,
      `- Forehead height and width`,
      `- Any facial asymmetry, dimples, creases, or expression lines`,
      ``,
      `PARAGRAPH 2 — FEATURES:`,
      `- Eye shape (almond, round, hooded, monolid, deep-set, protruding, downturned, upturned), size relative to face, color with specificity (e.g. "dark brown nearly black" or "hazel-green with golden flecks around the iris"), lash density and length, brow shape and thickness and arch position`,
      `- Nose: bridge width and height, tip shape (bulbous, pointed, upturned, flat), nostril shape and flare, overall size relative to face, profile angle`,
      `- Mouth and lips: upper lip shape (cupid's bow definition), lower lip fullness, mouth width, lip color/pigmentation, any asymmetry`,
      `- Ears if visible: size, position, lobe type`,
      `- Teeth if visible: alignment, size, any gaps`,
      ``,
      `PARAGRAPH 3 — HAIR & BODY:`,
      `- Hair color with extreme precision (include highlights, lowlights, root color vs ends — e.g. "dark chestnut brown with warm auburn highlights at the crown, slightly lighter honey-brown at the tips")`,
      `- Hair texture (pin-straight, loose waves, tight curls, coily, etc.), density/thickness, length`,
      `- Current styling (parted where, swept which direction, layered, bangs/fringe, updone, etc.)`,
      `- Hairline shape (straight, widow's peak, receding, rounded, etc.)`,
      `- Facial hair if present: style, density, color, grooming`,
      `- Build and body type if visible (neck thickness, shoulder width, frame size)`,
      `- Any distinguishing features: moles, scars, birthmarks, tattoos, piercings, freckle patterns, beauty marks`,
      ``,
      `CRITICAL RULES:`,
      `- Do NOT mention clothing, accessories, jewelry, makeup, background, or lighting`,
      `- Do NOT guess or mention the person's name or ethnicity/race`,
      `- Write in third person present tense using "This person" as the subject`,
      `- Be OBJECTIVE and PRECISE — describe what you see, not what you interpret`,
      `- Use specific visual language an artist would use (not medical/clinical terms)`,
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
      console.error('Gemini appearance extraction error:', errText);
      return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 502 });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No description generated' }, { status: 502 });
    }

    return NextResponse.json({ appearancePrompt: text.trim() });
  } catch (err) {
    console.error('Appearance extraction error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Extraction failed' },
      { status: 500 },
    );
  }
}
