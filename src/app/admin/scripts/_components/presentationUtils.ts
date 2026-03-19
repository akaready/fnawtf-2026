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
  beats: { id: string; audio_content: string; visual_content: string; notes_content: string }[];
}

interface FrameInput {
  beat_id: string | null;
  image_url: string;
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
  const framesByBeat = new Map<string, FrameInput>();
  for (const f of storyboardFrames) {
    if (f.beat_id) framesByBeat.set(f.beat_id, f);
  }

  for (const scene of scenes) {
    for (let i = 0; i < scene.beats.length; i++) {
      const beat = scene.beats[i];
      const frame = framesByBeat.get(beat.id);
      const beatRefs = references[beat.id] ?? [];
      const sceneName = [
        scene.int_ext,
        scene.location_name || 'UNTITLED LOCATION',
        scene.time_of_day ? `— ${scene.time_of_day}` : '',
      ].filter(Boolean).join('. ').replace('. —', ' —');
      slides.push({
        sceneNumber: scene.sceneNumber,
        sceneName,
        beatLetter: toBeatLetter(i + 1),
        audioContent: beat.audio_content,
        visualContent: beat.visual_content,
        notesContent: beat.notes_content,
        storyboardImageUrl: frame?.image_url ?? null,
        referenceImageUrls: beatRefs.map(r => r.image_url),
        sceneId: scene.id,
        beatId: beat.id,
      });
    }
  }

  return slides;
}
