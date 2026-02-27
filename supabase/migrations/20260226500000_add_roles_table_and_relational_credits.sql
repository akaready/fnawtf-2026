-- Create roles table
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add type column to contacts
ALTER TABLE contacts ADD COLUMN type TEXT NOT NULL DEFAULT 'contact';

-- Create contact_roles junction table
CREATE TABLE contact_roles (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, role_id)
);

-- Add FK columns to project_credits
ALTER TABLE project_credits
  ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Populate roles from existing credits
INSERT INTO roles (name)
SELECT DISTINCT role FROM project_credits
WHERE role IS NOT NULL AND role != ''
ORDER BY role;

-- Insert unique people from credits into contacts
INSERT INTO contacts (name, type)
SELECT DISTINCT ON (pc.name)
  pc.name,
  CASE
    WHEN LOWER(pc.role) IN ('cast', 'narrator', 'vocalist') THEN 'cast'
    ELSE 'crew'
  END as type
FROM project_credits pc
WHERE pc.name IS NOT NULL AND pc.name != ''
ORDER BY pc.name,
  CASE WHEN LOWER(pc.role) IN ('cast', 'narrator', 'vocalist') THEN 1 ELSE 0 END;

-- Backfill role_id on project_credits
UPDATE project_credits pc
SET role_id = r.id
FROM roles r
WHERE pc.role = r.name;

-- Backfill contact_id on project_credits
UPDATE project_credits pc
SET contact_id = c.id
FROM contacts c
WHERE pc.name = c.name AND c.type IN ('crew', 'cast');

-- Populate contact_roles from project_credits relationships
INSERT INTO contact_roles (contact_id, role_id)
SELECT DISTINCT pc.contact_id, pc.role_id
FROM project_credits pc
WHERE pc.contact_id IS NOT NULL AND pc.role_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles
CREATE POLICY "Allow authenticated read roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert roles" ON roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update roles" ON roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete roles" ON roles FOR DELETE TO authenticated USING (true);

-- RLS policies for contact_roles
CREATE POLICY "Allow authenticated read contact_roles" ON contact_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert contact_roles" ON contact_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete contact_roles" ON contact_roles FOR DELETE TO authenticated USING (true);

-- Anon read policies
CREATE POLICY "Allow anon read roles" ON roles FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read contact_roles" ON contact_roles FOR SELECT TO anon USING (true);
