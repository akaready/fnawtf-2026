-- Add detail page title/description templates to seo_settings
-- Used by /work to define a formula for all project detail pages
-- Variables: {title}, {client}, {description}
ALTER TABLE seo_settings
  ADD COLUMN IF NOT EXISTS detail_title_template text,
  ADD COLUMN IF NOT EXISTS detail_description_template text;

-- Set default template for /work
UPDATE seo_settings
  SET detail_title_template = 'FNA.wtf • {client} — {title}'
  WHERE page_slug = '/work' AND detail_title_template IS NULL;
