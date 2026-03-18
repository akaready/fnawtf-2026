export type ScriptStatus = 'draft' | 'review' | 'locked';
export type IntExt = 'INT' | 'EXT' | 'INT/EXT';
export type ContentMode = 'table' | 'scratchpad';

export interface ScriptRow {
  id: string;
  title: string;
  project_id: string | null;
  script_group_id: string | null;
  status: ScriptStatus;
  version: number;
  major_version: number;
  minor_version: number;
  is_published: boolean;
  notes: string | null;
  scratch_content: string | null;
  content_mode: ContentMode;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function formatScriptVersion(major: number, minor: number, isPublished: boolean): string {
  return isPublished ? `${major}` : `${major}.${minor}`;
}

export interface ScriptBeatReferenceRow {
  id: string;
  beat_id: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface ScriptSceneRow {
  id: string;
  script_id: string;
  sort_order: number;
  location_name: string;
  location_id: string | null;
  time_of_day: string;
  int_ext: IntExt;
  scene_notes: string | null;
  created_at: string;
}

export interface ScriptBeatRow {
  id: string;
  scene_id: string;
  sort_order: number;
  audio_content: string;
  visual_content: string;
  notes_content: string;
  created_at: string;
  updated_at: string;
}

export type ScriptCharacterType = 'vo' | 'actor' | 'animated';

export interface ScriptCharacterRow {
  id: string;
  script_id: string;
  name: string;
  description: string | null;
  color: string;
  character_type: ScriptCharacterType;
  sort_order: number;
  max_cast_slots: number;
  cast_mode: 'people' | 'references';
  created_at: string;
}

export interface CharacterReferenceRow {
  id: string;
  character_id: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface CharacterCastRow {
  id: string;
  character_id: string;
  contact_id: string;
  slot_order: number;
  is_featured: boolean;
  appearance_prompt: string | null;
  created_at: string;
}

/** Cast member with joined contact + headshot data for UI */
export interface CharacterCastWithContact extends CharacterCastRow {
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    /** All headshot URLs for this contact (for multi-image appearance extraction) */
    all_headshot_urls: string[];
    /** Global appearance description stored on the contact */
    appearance_prompt: string | null;
  };
}

export interface ScriptLocationRow {
  id: string;
  script_id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  global_location_id: string | null;
  created_at: string;
}

export interface ScriptLocationOptionRow {
  id: string;
  script_location_id: string;
  location_id: string;
  slot_order: number;
  is_featured: boolean;
  appearance_prompt: string | null;
  created_at: string;
}

export interface LocationOptionWithLocation extends ScriptLocationOptionRow {
  location: {
    id: string;
    name: string;
    featured_image: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    appearance_prompt: string | null;
    top_images: string[];
  };
}

export interface ScriptTagRow {
  id: string;
  script_id: string;
  name: string;
  slug: string;
  category: string;
  color: string;
  created_at: string;
}

/** Scene with computed number and nested beats */
export interface ComputedScene extends ScriptSceneRow {
  sceneNumber: number;
  locationGroup: number;
  sceneIndex: number;
  beats: ScriptBeatRow[];
}

/** Column visibility config (stored in localStorage) */
export interface ScriptColumnConfig {
  audio: boolean;
  visual: boolean;
  notes: boolean;
  reference: boolean;
  storyboard: boolean;
}

export type StoryboardGenerationMode = 'beat' | 'scene';
export type StoryboardFrameSource = 'generated' | 'uploaded';
export type StoryboardStylePreset = 'sketch' | 'comic' | 'studio' | 'cinematic' | 'watercolor' | 'noir' | 'documentary' | 'anime';

export interface ScriptStyleRow {
  id: string;
  script_id: string;
  prompt: string;
  aspect_ratio: string;
  generation_mode: StoryboardGenerationMode;
  style_preset: StoryboardStylePreset | null;
  created_at: string;
  updated_at: string;
}

export interface ScriptStyleReferenceRow {
  id: string;
  style_id: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface ScriptStoryboardFrameRow {
  id: string;
  script_id: string;
  beat_id: string | null;
  scene_id: string | null;
  image_url: string;
  storage_path: string;
  source: StoryboardFrameSource;
  prompt_used: string | null;
  created_at: string;
}

export interface AiPromptLogRow {
  id: string;
  script_id: string | null;
  beat_id: string | null;
  scene_id: string | null;
  model: string;
  prompt_text: string;
  response_summary: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_estimate: number | null;
  duration_ms: number | null;
  status: string;
  source: string;
  image_url: string | null;
  created_at: string;
}

/** Script with joined project name for list view */
export interface ScriptWithProject extends ScriptRow {
  project?: { id: string; title: string } | null;
}

/** Default tags seeded on every new script. */
export const DEFAULT_SCRIPT_TAGS: { name: string; color: string }[] = [
  { name: 'Interview',        color: '#f97316' },
  { name: 'B-Roll',           color: '#3b82f6' },
  { name: 'Graphics',         color: '#22c55e' },
  { name: 'Overlay Graphics', color: '#84cc16' },
  { name: 'Stock',            color: '#38bdf8' },
  { name: 'Transition',       color: '#14b8a6' },
  { name: 'VFX',              color: '#8b5cf6' },
];
