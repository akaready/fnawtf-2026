-- Add logo_url to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add client_id FK to projects (nullable)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
