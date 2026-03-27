import type { ScriptBeatRow, ComputedScene, ScriptCharacterRow, ScriptLocationRow, ScriptTagRow, CharacterCastWithContact, CharacterReferenceRow } from '@/types/scripts';

/**
 * Build a rich context prompt for storyboard image generation.
 * Includes scene heading, location, characters, neighboring beats, beat content, and tag prompt snippets.
 */
export function buildRichPrompt(
  beat: ScriptBeatRow,
  beatIndex: number,
  scene: ComputedScene,
  characters: ScriptCharacterRow[],
  locations: ScriptLocationRow[],
  castMap?: Record<string, CharacterCastWithContact[]>,
  referenceMap?: Record<string, CharacterReferenceRow[]>,
  tags?: ScriptTagRow[],
): string {
  const parts: string[] = [];

  // Scene context
  parts.push('SCENE CONTEXT:');
  parts.push(`Scene ${scene.sceneNumber} — ${scene.int_ext}. ${scene.location_name} — ${scene.time_of_day}`);
  const location = locations.find(l => l.id === scene.location_id);
  if (location?.description) parts.push(`Location: ${location.description}`);
  if (scene.scene_notes) parts.push(`Scene notes: ${scene.scene_notes}`);
  parts.push('');

  // Characters — include all so the model knows who exists
  if (characters.length > 0) {
    parts.push('CHARACTERS IN THIS SCRIPT:');
    for (const char of characters) {
      const desc = char.description ? `: ${char.description}` : '';
      const type = char.character_type === 'vo' ? 'VO' : char.character_type === 'animated' ? 'Animated' : 'Actor';
      let appearance = '';
      if (char.cast_mode === 'references') {
        const refCount = (referenceMap?.[char.id] ?? []).length;
        if (refCount > 0) appearance = ` — LOOK AT the reference images labeled "${char.name}" to see exactly what ${char.name} looks like. Match their face precisely.`;
      } else {
        const featured = castMap?.[char.id]?.find(c => c.is_featured);
        if (featured?.appearance_prompt) appearance = ` Physical appearance: ${featured.appearance_prompt}`;
      }
      parts.push(`- ${char.name}${desc}${appearance} (${type})`);
    }
    parts.push('');
  }

  // Interview scene detection — default to showing the interviewee on camera
  const isInterviewScene =
    /interview/i.test(scene.location_name ?? '') ||
    /\binterview\b/i.test(`${beat.audio_content ?? ''} ${beat.visual_content ?? ''} ${beat.notes_content ?? ''}`);
  if (isInterviewScene) {
    parts.push('INTERVIEW SCENE GUIDANCE:');
    parts.push(
      'This is an interview scene. Show the SUBJECT being interviewed — frame them directly on camera ' +
      '(medium shot, close-up, etc.). Do NOT show the interviewer. Do NOT use over-the-shoulder shots. ' +
      'Do NOT show camera equipment, a film set, or crew. ' +
      'Only show B-roll (environments, objects, activities) if the visual_content explicitly describes it.'
    );
    parts.push('');
  }

  // Data/statistics detection — describe concept cinematically, never as text/numbers
  const mentionsData = /\d+\s*%|(?:times\s+)?faster|slower|\bstats?\b|\bdata\b|\bstatistics?\b|\bpercentage\b|\bchart\b|\bgraph\b|\bmetric\b/i
    .test(`${beat.audio_content ?? ''} ${beat.visual_content ?? ''}`);
  if (mentionsData) {
    parts.push('DATA/STATISTICS CONTENT NOTE:');
    parts.push(
      'The script references numbers, percentages, or statistics. Do NOT render any data as readable ' +
      'text, numbers, infographics, or overlaid charts. Translate the meaning into a cinematic image ' +
      'showing people, environments, or objects that represent the concept — never as readable figures.'
    );
    parts.push('');
  }

  // Beat position + neighbors
  const total = scene.beats.length;
  parts.push(`BEAT ${beatIndex + 1} OF ${total} IN THIS SCENE:`);
  parts.push('');

  const prev = scene.beats[beatIndex - 1];
  if (prev) {
    const prevContent = [prev.audio_content, prev.visual_content].filter(Boolean).join(' | ');
    if (prevContent) parts.push(`Previous beat: ${prevContent}`);
  }

  // Current beat
  parts.push('Current beat:');
  if (beat.audio_content) parts.push(`Audio: ${beat.audio_content}`);
  if (beat.visual_content) parts.push(`Visual: ${beat.visual_content}`);
  if (beat.notes_content) parts.push(`Notes: ${beat.notes_content}`);

  const next = scene.beats[beatIndex + 1];
  if (next) {
    const nextContent = [next.audio_content, next.visual_content].filter(Boolean).join(' | ');
    if (nextContent) parts.push(`Next beat: ${nextContent}`);
  }

  // Tag prompt snippets — inject guidance for any tags referenced in this beat
  if (tags && tags.length > 0) {
    const beatText = `${beat.audio_content ?? ''} ${beat.visual_content ?? ''} ${beat.notes_content ?? ''}`;
    const slugPattern = /#\[(.+?)\]/g;
    const matchedSlugs = new Set<string>();
    let match = slugPattern.exec(beatText);
    while (match !== null) {
      matchedSlugs.add(match[1]);
      match = slugPattern.exec(beatText);
    }
    for (const tag of tags) {
      if (matchedSlugs.has(tag.slug) && tag.prompt_snippet?.trim()) {
        parts.push('');
        parts.push(`TAG GUIDANCE (#${tag.name}):`);
        parts.push(tag.prompt_snippet.trim());
      }
    }
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n') || 'Empty beat — generate a neutral establishing shot';
}
