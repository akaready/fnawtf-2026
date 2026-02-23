-- SEO settings: one row per page (plus a _global row for site-wide defaults)
CREATE TABLE IF NOT EXISTS seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,   -- '_global', '/', '/work', '/services', '/pricing', '/about'
  meta_title text,
  meta_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  no_index boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Seed with current hardcoded values
INSERT INTO seo_settings (page_slug, meta_title, meta_description) VALUES
  ('_global', 'FNA.WTF', 'Friends n Allies - Video Production & Digital Storytelling'),
  ('/', 'FNA.WTF - Video Production & Digital Storytelling', 'Friends n Allies is a boutique creative agency crafting visual stories for ambitious brands.'),
  ('/work', 'Work - FNA.WTF', 'Video production portfolio - Browse our featured projects'),
  ('/services', 'Services — FNA.WTF', 'What we do. Three phases, one direction: yours.'),
  ('/pricing', 'Pricing - FNA.WTF', 'Transparent pricing for video production services. Build, Launch, and Scale packages with interactive add-on calculator.'),
  ('/about', 'About Us - FNA.WTF', 'Small team, vast network. Friends ''n Allies is a creative marketing partner helping brands become the brand they long to be.')
ON CONFLICT (page_slug) DO NOTHING;

-- RLS
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read seo_settings"
  ON seo_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update seo_settings"
  ON seo_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert seo_settings"
  ON seo_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Allow anonymous reads so public pages can fetch SEO data
CREATE POLICY "Anonymous can read seo_settings"
  ON seo_settings FOR SELECT TO anon USING (true);
