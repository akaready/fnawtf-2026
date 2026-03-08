// ── Call Sheet Admin Types ───────────────────────────────────

export type CallSheetStatus = 'draft' | 'published';
export type CastStatus = 'W' | 'SW' | 'SWF' | 'H' | 'D';
export type SetContact = 'ready' | 'richie';
export type ImageSource = 'location' | 'scout';

// ── Core ────────────────────────────────────────────────────

export interface CallSheetRow {
  id: string;
  project_id: string | null;
  script_id: string | null;
  slug: string;
  status: CallSheetStatus;
  date: string; // ISO date
  shoot_day: number;
  total_days: number;
  general_call_time: string;
  crew_call: string | null;
  talent_call: string | null;
  shooting_call: string | null;
  lunch_time: string | null;
  estimated_wrap: string | null;
  doordash_enabled: boolean;
  doordash_link: string | null;
  set_contact: SetContact | null;
  location_id: string | null;
  parking_address: string | null;
  parking_note: string | null;
  hospital_name: string | null;
  hospital_address: string | null;
  hospital_phone: string | null;
  vendors_visible: boolean;
  dept_notes_visible: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ── Junction tables ─────────────────────────────────────────

export interface CallSheetBulletinRow {
  id: string;
  call_sheet_id: string;
  text: string;
  pinned: boolean;
  visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface CallSheetLocationImageRow {
  id: string;
  call_sheet_id: string;
  location_image_id: string;
  source: ImageSource;
  sort_order: number;
}

export interface CallSheetCastRow {
  id: string;
  call_sheet_id: string;
  contact_id: string;
  character_id: string | null;
  status: CastStatus;
  call_time: string | null;
  wrap_time: string | null;
  sort_order: number;
}

export interface CallSheetCrewRow {
  id: string;
  call_sheet_id: string;
  contact_id: string;
  role_override: string | null;
  call_time: string | null;
  wrap_time: string | null;
  sort_order: number;
}

export interface CallSheetSceneRow {
  id: string;
  call_sheet_id: string;
  scene_id: string;
  selected: boolean;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  sort_order: number;
}

export interface CallSheetVendorRow {
  id: string;
  call_sheet_id: string;
  company_id: string;
  role_label: string | null;
  contact_person: string | null;
  phone_override: string | null;
  sort_order: number;
}

export interface CallSheetDeptNoteRow {
  id: string;
  call_sheet_id: string;
  department: string;
  notes: string;
  visible: boolean;
  sort_order: number;
}

export interface CallSheetLocationRow {
  id: string;
  call_sheet_id: string;
  location_id: string;
  parking_address: string | null;
  parking_note: string | null;
  visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface CallSheetLocationJoined extends CallSheetLocationRow {
  location_name: string;
  location_address: string | null;
}

// ── Joined / enriched types for the panel ───────────────────

export interface CallSheetCastJoined extends CallSheetCastRow {
  contact_name: string;
  headshot_url: string | null;
  character_name: string | null;
}

export interface CallSheetCrewJoined extends CallSheetCrewRow {
  contact_name: string;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  headshot_url: string | null;
}

export interface CallSheetSceneJoined extends CallSheetSceneRow {
  scene_sort_order: number;
  location_name: string | null;
  int_ext: string | null;
  time_of_day: string | null;
  scene_notes: string | null;
  beats: { id: string; audio_content: string | null; visual_content: string | null }[];
  characters: { id: string; name: string; headshot_url: string | null }[];
}

export interface CallSheetVendorJoined extends CallSheetVendorRow {
  company_name: string;
  company_phone: string | null;
}

export interface CallSheetLocationImageJoined extends CallSheetLocationImageRow {
  image_url: string;
  alt_text: string | null;
}

// ── Table list row (with aggregated joins) ──────────────────

export interface CallSheetListRow extends CallSheetRow {
  project_title: string | null;
  location_name: string | null;
  crew_count: number;
}

// ── Full call sheet with all relations (for panel) ──────────

export interface CallSheetWithRelations extends CallSheetRow {
  project_title: string | null;
  location_name: string | null;
  location_address: string | null;
  location_google_maps_url: string | null;
  bulletins: CallSheetBulletinRow[];
  locations: CallSheetLocationJoined[];
  location_images: CallSheetLocationImageJoined[];
  cast: CallSheetCastJoined[];
  crew: CallSheetCrewJoined[];
  scenes: CallSheetSceneJoined[];
  vendors: CallSheetVendorJoined[];
  dept_notes: CallSheetDeptNoteRow[];
}
