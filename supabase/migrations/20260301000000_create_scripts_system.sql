-- ── Scripts system ──────────────────────────────────────────────────────────
-- Master script record, scenes, beats, character library, and script tags

-- ── Scripts ─────────────────────────────────────────────────────────────────
CREATE TABLE scripts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'locked')),
  version         INTEGER NOT NULL DEFAULT 1,
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scripts_project ON scripts (project_id);

-- ── Script scenes ───────────────────────────────────────────────────────────
-- Scene numbers are computed client-side from sort_order + location changes.
-- e.g. scenes at "INT. CAFE" → 101, 102; next location "EXT. STREET" → 201
CREATE TABLE script_scenes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id       UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  location_name   TEXT NOT NULL DEFAULT '',
  time_of_day     TEXT NOT NULL DEFAULT '',
  int_ext         TEXT NOT NULL DEFAULT 'INT'
    CHECK (int_ext IN ('INT', 'EXT', 'INT/EXT')),
  scene_notes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_script_scenes_script ON script_scenes (script_id, sort_order);

-- ── Script beats (aligned rows within a scene) ─────────────────────────────
-- Each beat has audio, visual, and notes columns.
-- Content stored as simple markdown (**bold**, @[Name](id), #[slug]).
CREATE TABLE script_beats (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id        UUID NOT NULL REFERENCES script_scenes(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  audio_content   TEXT NOT NULL DEFAULT '',
  visual_content  TEXT NOT NULL DEFAULT '',
  notes_content   TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_script_beats_scene ON script_beats (scene_id, sort_order);

-- ── Script characters (per-script character library) ────────────────────────
CREATE TABLE script_characters (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id       UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT NOT NULL DEFAULT '#a14dfd',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_script_characters_script ON script_characters (script_id);

-- ── Script tags (VFX, motion graphics, set dressing, etc.) ─────────────────
CREATE TABLE script_tags (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id       UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  color           TEXT NOT NULL DEFAULT '#38bdf8',
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (script_id, slug)
);

CREATE INDEX idx_script_tags_script ON script_tags (script_id, slug);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE scripts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_scenes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_beats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_tags       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_scripts"           ON scripts           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_script_scenes"     ON script_scenes     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_script_beats"      ON script_beats      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_script_characters" ON script_characters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_script_tags"       ON script_tags       FOR ALL TO authenticated USING (true) WITH CHECK (true);
