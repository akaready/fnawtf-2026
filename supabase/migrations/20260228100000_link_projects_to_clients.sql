-- Link projects to client records by matching client_name → clients.name.
-- For projects whose client_name has no matching client record, create one.

-- Step 1: Create client records for any client_name values that don't exist yet
INSERT INTO clients (id, name, email, company_types, status, pipeline_stage, created_at)
SELECT
  gen_random_uuid(),
  p.client_name,
  '',
  ARRAY['client']::text[],
  'active',
  'closed',
  now()
FROM (
  SELECT DISTINCT client_name
  FROM projects
  WHERE client_name IS NOT NULL
    AND client_name != ''
    AND client_id IS NULL
) p
WHERE NOT EXISTS (
  SELECT 1 FROM clients c WHERE lower(c.name) = lower(p.client_name)
);

-- Step 2: Link all unlinked projects to their client record (case-insensitive match)
UPDATE projects p
SET client_id = c.id
FROM clients c
WHERE lower(p.client_name) = lower(c.name)
  AND p.client_id IS NULL
  AND p.client_name IS NOT NULL
  AND p.client_name != '';

