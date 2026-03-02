export type ScriptStatus = 'draft' | 'review' | 'locked';
export type IntExt = 'INT' | 'EXT' | 'INT/EXT';

export interface ScriptRow {
  id: string;
  title: string;
  project_id: string | null;
  script_group_id: string | null;
  status: ScriptStatus;
  version: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  sort_order: number;
  global_location_id: string | null;
  created_at: string;
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
export type StoryboardStylePreset = 'sketch' | 'comic' | 'studio' | 'cinematic';

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

/** Script with joined project name for list view */
export interface ScriptWithProject extends ScriptRow {
  project?: { id: string; title: string } | null;
}

/** Default tags seeded on every new script. Colors are reserved. */
export const DEFAULT_SCRIPT_TAGS: { name: string; slug: string; category: string; color: string }[] = [
  { name: 'Interview',        slug: 'interview',   category: 'general', color: '#f97316' }, // orange
  { name: 'B-Roll',           slug: 'broll',       category: 'general', color: '#3b82f6' }, // blue
  { name: 'Graphics',         slug: 'gfx',         category: 'general', color: '#22c55e' }, // green
  { name: 'Overlay Graphics', slug: 'gfx-overlay', category: 'general', color: '#84cc16' }, // lime
  { name: 'Stock',            slug: 'stock',       category: 'general', color: '#38bdf8' }, // sky
  { name: 'Transition',       slug: 'transition',  category: 'general', color: '#14b8a6' }, // teal
  { name: 'VFX',              slug: 'vfx',         category: 'general', color: '#8b5cf6' }, // violet
];
