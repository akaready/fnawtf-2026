-- Split contacts.name into first_name + last_name
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name text;

UPDATE contacts SET
  first_name = CASE
    WHEN position(' ' in coalesce(name, '')) > 0
    THEN left(name, position(' ' in name) - 1)
    ELSE coalesce(name, '')
  END,
  last_name = CASE
    WHEN position(' ' in coalesce(name, '')) > 0
    THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;

ALTER TABLE contacts ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE contacts ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE contacts DROP COLUMN IF EXISTS name;

-- Junction table: proposal ↔ contacts (approved access list)
CREATE TABLE IF NOT EXISTS proposal_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  contact_id   uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, contact_id)
);

ALTER TABLE proposal_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage proposal_contacts"
  ON proposal_contacts FOR ALL TO authenticated USING (true);

CREATE POLICY "Anon can read proposal_contacts"
  ON proposal_contacts FOR SELECT TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_proposal_contacts_proposal_id ON proposal_contacts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_contacts_contact_id ON proposal_contacts(contact_id);
