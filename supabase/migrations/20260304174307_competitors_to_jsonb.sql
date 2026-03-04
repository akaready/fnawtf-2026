ALTER TABLE intake_submissions
ADD COLUMN competitors_new jsonb;

UPDATE intake_submissions
SET competitors_new = (
  SELECT jsonb_agg(jsonb_build_object('url', trim(line)))
  FROM unnest(string_to_array(competitors, E'\n')) AS line
  WHERE trim(line) <> ''
)
WHERE competitors IS NOT NULL AND trim(competitors) <> '';

ALTER TABLE intake_submissions
DROP COLUMN competitors;

ALTER TABLE intake_submissions
RENAME COLUMN competitors_new TO competitors;
