export interface PresentationSlide {
  sceneNumber: number;
  sceneName: string;
  beatLetter: string;
  audioContent: string;
  visualContent: string;
  notesContent: string;
  storyboardImageUrl: string | null;
  referenceImageUrls: string[];
  sceneId: string;
  beatId: string;
  storyboardFrames?: Array<{
    id: string;
    image_url: string;
    slot: number;
    crop_config: import('@/types/scripts').CropConfig | null;
  }>;
  storyboard_layout?: string | null;
}

function toBeatLetter(n: number): string {
  let result = '';
  let num = n;
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

/** Accepts both admin ComputedScene and share-page Scene shapes via structural typing */
interface SceneInput {
  id: string;
  sceneNumber: number;
  int_ext: string;
  location_name: string;
  time_of_day: string;
  beats: { id: string; audio_content: string; visual_content: string; notes_content: string; storyboard_layout?: string | null }[];
}

interface FrameInput {
  beat_id: string | null;
  image_url: string;
  slot?: number | null;
  crop_config?: import('@/types/scripts').CropConfig | null;
}

interface ReferenceInput {
  image_url: string;
}

export function buildPresentationSlides(
  scenes: SceneInput[],
  storyboardFrames: FrameInput[],
  references: Record<string, ReferenceInput[]>,
): PresentationSlide[] {
  const slides: PresentationSlide[] = [];

  // Group all frames by beat_id
  const framesByBeat = new Map<string, FrameInput[]>();
  for (const f of storyboardFrames) {
    if (f.beat_id) {
      const list = framesByBeat.get(f.beat_id) ?? [];
      list.push(f);
      framesByBeat.set(f.beat_id, list);
    }
  }

  for (const scene of scenes) {
    const sceneName = [
      scene.int_ext,
      scene.location_name || 'UNTITLED LOCATION',
      scene.time_of_day ? `— ${scene.time_of_day}` : '',
    ].filter(Boolean).join('. ').replace('. —', ' —');

    if (scene.beats.length === 0) {
      // Empty scene — still create a slide so it appears in timeline
      slides.push({
        sceneNumber: scene.sceneNumber,
        sceneName,
        beatLetter: '',
        audioContent: '',
        visualContent: '',
        notesContent: '',
        storyboardImageUrl: null,
        referenceImageUrls: [],
        sceneId: scene.id,
        beatId: `empty-${scene.id}`,
        storyboardFrames: [],
        storyboard_layout: null,
      });
      continue;
    }

    for (let i = 0; i < scene.beats.length; i++) {
      const beat = scene.beats[i];
      const beatFrames = framesByBeat.get(beat.id) ?? [];
      const beatRefs = references[beat.id] ?? [];

      // Slotted frames for multi-frame layout
      const slottedFrames = beatFrames
        .filter(f => f.slot != null)
        .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
        .map(f => ({
          id: (f as { id?: string }).id ?? '',
          image_url: f.image_url,
          slot: f.slot!,
          crop_config: f.crop_config ?? null,
        }));

      // Fallback single image: first slotted frame or first frame
      const primaryFrame = beatFrames.find(f => f.slot != null) ?? beatFrames[0] ?? null;

      slides.push({
        sceneNumber: scene.sceneNumber,
        sceneName,
        beatLetter: toBeatLetter(i + 1),
        audioContent: beat.audio_content,
        visualContent: beat.visual_content,
        notesContent: beat.notes_content,
        storyboardImageUrl: primaryFrame?.image_url ?? null,
        referenceImageUrls: beatRefs.map(r => r.image_url),
        sceneId: scene.id,
        beatId: beat.id,
        storyboardFrames: slottedFrames,
        storyboard_layout: beat.storyboard_layout ?? null,
      });
    }
  }

  return slides;
}
