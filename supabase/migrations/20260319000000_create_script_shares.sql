-- Script share links: one row per public share URL
CREATE TABLE script_shares (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id     UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,
  access_code   TEXT NOT NULL,
  notes         TEXT,
  label         TEXT NOT NULL DEFAULT '',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Script share view tracking: one row per viewer check-in
CREATE TABLE script_share_views (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id         UUID NOT NULL REFERENCES script_shares(id) ON DELETE CASCADE,
  viewer_email     TEXT,
  viewer_name      TEXT,
  duration_seconds INTEGER,
  viewed_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_script_shares_token ON script_shares(token);
CREATE INDEX idx_script_shares_script ON script_shares(script_id);
CREATE INDEX idx_script_share_views_share ON script_share_views(share_id);

-- RLS
ALTER TABLE script_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_share_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth full" ON script_shares FOR ALL TO authenticated USING (true);
CREATE POLICY "anon read active" ON script_shares FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "auth full" ON script_share_views FOR ALL TO authenticated USING (true);
CREATE POLICY "anon insert" ON script_share_views FOR INSERT TO anon WITH CHECK (true);
