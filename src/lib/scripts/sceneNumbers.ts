import type { ScriptSceneRow, ScriptBeatRow, ComputedScene } from '@/types/scripts';

/**
 * Compute scene numbers from a sorted list of scenes.
 * Location groups increment when the location changes (even returning to a previous location).
 * Scene number = locationGroup * 100 + sceneIndex within that group.
 * e.g. INT. CAFE scenes → 101, 102; EXT. STREET → 201; back to INT. CAFE → 301
 */
export function computeSceneNumbers(
  scenes: ScriptSceneRow[],
  beatsByScene: Record<string, ScriptBeatRow[]>
): ComputedScene[] {
  let locationGroup = 0;
  let lastLocationKey = '';
  const groupCounters = new Map<number, number>();

  return scenes.map((scene) => {
    const locationKey = `${scene.int_ext}|${scene.location_name}`.toLowerCase().trim();

    if (locationKey !== lastLocationKey) {
      locationGroup++;
      groupCounters.set(locationGroup, 0);
    }
    lastLocationKey = locationKey;

    const count = (groupCounters.get(locationGroup) ?? 0) + 1;
    groupCounters.set(locationGroup, count);

    return {
      ...scene,
      beats: beatsByScene[scene.id] ?? [],
      locationGroup,
      sceneIndex: count,
      sceneNumber: locationGroup * 100 + count,
    };
  });
}

/** Format a scene heading string, e.g. "INT. CAFE - DAY" */
export function formatSceneHeading(scene: ScriptSceneRow): string {
  const parts: string[] = [scene.int_ext];
  if (scene.location_name) parts.push(scene.location_name);
  if (scene.time_of_day) parts.push(`- ${scene.time_of_day}`);
  return parts.join('. ').replace('. -', ' -');
}
