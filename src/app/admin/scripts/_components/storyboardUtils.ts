import type { ScriptBeatRow, ComputedScene, ScriptCharacterRow, ScriptLocationRow, CharacterCastWithContact } from '@/types/scripts';

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
      const featured = castMap?.[char.id]?.find(c => c.is_featured);
      const appearance = featured?.appearance_prompt
        ? ` Physical appearance: ${featured.appearance_prompt}`
        : '';
      parts.push(`- ${char.name}${desc}${appearance} (${type})`);
    }
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
