-- Add company_types array to clients table
-- Allows companies to be tagged as client, lead, and/or partner
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_types text[] NOT NULL DEFAULT '{}';
