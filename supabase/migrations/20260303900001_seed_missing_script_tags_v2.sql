-- Seed default tags for ALL scripts, skipping where tag name already exists on that script
INSERT INTO script_tags (script_id, name, slug, color)
SELECT s.id, t.name, 'tag-' || substr(gen_random_uuid()::text, 1, 8), t.color
FROM scripts s
CROSS JOIN (VALUES
  ('Interview',        '#f97316'),
  ('B-Roll',           '#3b82f6'),
  ('Graphics',         '#22c55e'),
  ('Overlay Graphics', '#84cc16'),
  ('Stock',            '#38bdf8'),
  ('Transition',       '#14b8a6'),
  ('VFX',              '#8b5cf6')
) AS t(name, color)
WHERE NOT EXISTS (
  SELECT 1 FROM script_tags st WHERE st.script_id = s.id AND st.name = t.name
);
