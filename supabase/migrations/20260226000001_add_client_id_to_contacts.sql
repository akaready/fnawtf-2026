-- Link contacts to company records
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
