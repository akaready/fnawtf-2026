import type { ScriptBeatRow, ComputedScene, ScriptCharacterRow, ScriptLocationRow, CharacterCastWithContact, CharacterReferenceRow } from '@/types/scripts';

/**
 * Build a rich context prompt for storyboard image generation.
 * Includes scene heading, location, characters, neighboring beats, and beat content.
 */
export function buildRichPrompt(
  beat: ScriptBeatRow,
  beatIndex: number,
  scene: ComputedScene,
  characters: ScriptCharacterRow[],
  locations: ScriptLocationRow[],
  castMap?: Record<string, CharacterCastWithContact[]>,
  referenceMap?: Record<string, CharacterReferenceRow[]>,
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
        if (refCount > 0) appearance = ` (${refCount} visual reference image${refCount !== 1 ? 's' : ''} provided)`;
      } else {
        const featured = castMap?.[char.id]?.find(c => c.is_featured);
        if (featured?.appearance_prompt) appearance = ` Physical appearance: ${featured.appearance_prompt}`;
      }
      parts.push(`- ${char.name}${desc}${appearance} (${type})`);
    }
    parts.push('');
  }

  // Interview scene detection — default to B-roll, not the talking head
  const isInterviewScene =
    /interview/i.test(scene.location_name ?? '') ||
    /\binterview\b/i.test(`${beat.audio_content ?? ''} ${beat.visual_content ?? ''} ${beat.notes_content ?? ''}`);
  if (isInterviewScene) {
    parts.push('INTERVIEW SCENE GUIDANCE:');
    parts.push(
      'Unless visual_content explicitly places the subject on camera (e.g. "CU on NAME speaking"), ' +
      'do NOT show the interview subject talking to camera. Show B-ROLL imagery instead — ' +
      'the environments, objects, products, activities, or concepts referenced in the audio content. ' +
      'Ask: what would a documentary editor cut to while this audio plays?'
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
    if (nextContent) parts.push(`\nNext beat: ${nextContent}`);
  }

  return parts.join('\n') || 'Empty beat — generate a neutral establishing shot';
}
