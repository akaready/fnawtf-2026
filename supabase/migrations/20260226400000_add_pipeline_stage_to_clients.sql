ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS pipeline_stage text NOT NULL DEFAULT 'new'
  CHECK (pipeline_stage IN ('new', 'qualified', 'proposal', 'negotiating', 'closed'));
