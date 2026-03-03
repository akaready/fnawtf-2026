import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic();

export type RewriteLevel = 'preserve' | 'grammar' | 'light' | 'production';

type DefaultTimeOfDay = 'DAY' | 'NIGHT' | 'MORNING' | 'EVENING' | 'AUTO';

interface ExtractRequest {
  scriptId: string;
  scratchContent: string;
  rewriteLevel: RewriteLevel;
  defaultTimeOfDay?: DefaultTimeOfDay;
  existingCharacters: Array<{ name: string; color: string; character_type: string }>;
  existingLocations: Array<{ name: string; color: string }>;
}

const REWRITE_INSTRUCTIONS: Record<RewriteLevel, string> = {
  preserve:
    'PRESERVE the author\'s EXACT original wording. Do not change any words, grammar, or punctuation. Only move content into the correct columns and scenes.',
  grammar:
    'Fix only grammar: capitalization, punctuation, and periods. Do not rephrase, add, or remove any words beyond basic grammar corrections.',
  light:
    'Apply light cleanup: fix grammar and improve clarity where needed, but keep the author\'s voice and intent intact. Do not add new content.',
  production:
    'Rewrite content to production-ready quality. Expand and add descriptive detail where appropriate, improve flow and clarity, but NEVER lose the original author\'s intent or key ideas.',
};

const SYSTEM_PROMPT = `You are a script structure extraction assistant for a video production company.
Analyze the provided freeform text and extract a structured script breakdown.

Return ONLY valid JSON matching this exact schema — no prose, no markdown fences, no explanation:
{
  "characters": [{ "name": string, "description": string, "color": string (hex), "character_type": "vo"|"actor"|"animated" }],
  "locations": [{ "name": string (UPPERCASE), "description": string, "color": string (hex) }],
  "scenes": [{
    "location_name": string (must match a location name exactly),
    "int_ext": "INT"|"EXT"|"INT/EXT",
    "time_of_day": "DAY"|"NIGHT"|"MORNING"|"EVENING"|"DUSK"|"DAWN",
    "beats": [{ "audio_content": string, "visual_content": string, "notes_content": string }]
  }]
}

Rules:
- Match character and location names exactly to the existing ones provided when they clearly refer to the same entity. Keep their existing colors.
- For NEW characters/locations, pick a distinct hex color that does not clash with existing ones.
- audio_content = dialogue, narration, voiceover, or sound descriptions (what is HEARD)
- visual_content = what the camera sees, action descriptions, visual staging (what is SEEN)
- notes_content = production notes, b-roll flags, special instructions, or empty string if none
- Each scene should have 1-6 beats. Do not over-segment.
- ALL CAPS text in the scratchpad typically signals location or scene breaks. Many headings will just be a location name (e.g. "ROOFTOP", "CAFÉ FLOOR") without INT/EXT or time-of-day — this is normal.
- Infer INT/EXT from context; default to INT if ambiguous.
- For time_of_day: use the user's preferred default (provided below) when the heading does not specify one. If the preference is AUTO, infer the most appropriate time from the content and flow of the script.
- Location names should be UPPERCASE (e.g. "OFFICE", "ROOFTOP").
- Character names should be Title Case.
- @[Name](id) mentions in the text indicate known characters — preserve those names exactly.
- #[slug] tags indicate production tags — these are metadata, not content. Ignore them for scene structure.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as ExtractRequest;
  const { scriptId, scratchContent, rewriteLevel, defaultTimeOfDay, existingCharacters, existingLocations } = body;

  if (!scratchContent?.trim()) {
    return NextResponse.json({ error: 'No content to analyze' }, { status: 400 });
  }

  const rewriteInstruction = REWRITE_INSTRUCTIONS[rewriteLevel] ?? REWRITE_INSTRUCTIONS.preserve;
  const todPref = defaultTimeOfDay ?? 'DAY';
  const todInstruction = todPref === 'AUTO'
    ? 'DEFAULT TIME OF DAY: AUTO — infer the most appropriate time of day for each scene based on the content and flow of the script.'
    : `DEFAULT TIME OF DAY: ${todPref} — when a scene heading does not specify a time of day, use "${todPref}".`;

  const userMessage = `REWRITE LEVEL INSTRUCTION: ${rewriteInstruction}

${todInstruction}

Existing characters (match these when applicable): ${JSON.stringify(existingCharacters)}
Existing locations (match these when applicable): ${JSON.stringify(existingLocations)}

Script scratchpad to analyze:
---
${scratchContent}
---`;

  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const duration = Date.now() - startTime;

    // Parse JSON — strip markdown fences if model added them despite instructions
    const cleaned = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      // Log failure
      await supabase.from('ai_prompt_log').insert({
        script_id: scriptId,
        model: 'claude-sonnet-4-20250514',
        prompt_text: userMessage.slice(0, 2000),
        response_summary: 'JSON parse failure',
        input_tokens: response.usage?.input_tokens ?? null,
        output_tokens: response.usage?.output_tokens ?? null,
        duration_ms: duration,
        status: 'error',
        source: 'scratch_extract',
      } as never);
      return NextResponse.json({ error: 'AI returned invalid JSON', raw: rawText }, { status: 422 });
    }

    // Log success
    await supabase.from('ai_prompt_log').insert({
      script_id: scriptId,
      model: 'claude-sonnet-4-20250514',
      prompt_text: userMessage.slice(0, 2000),
      response_summary: `Extracted ${extracted.characters?.length ?? 0} characters, ${extracted.locations?.length ?? 0} locations, ${extracted.scenes?.length ?? 0} scenes`,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      duration_ms: duration,
      status: 'success',
      source: 'scratch_extract',
    } as never);

    return NextResponse.json({ extracted });
  } catch (err) {
    const duration = Date.now() - startTime;
    try {
      await supabase.from('ai_prompt_log').insert({
        script_id: scriptId,
        model: 'claude-sonnet-4-20250514',
        prompt_text: userMessage.slice(0, 2000),
        response_summary: String(err),
        duration_ms: duration,
        status: 'error',
        source: 'scratch_extract',
      } as never);
    } catch { /* ignore logging errors */ }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
