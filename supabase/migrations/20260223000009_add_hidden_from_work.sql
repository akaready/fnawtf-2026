ALTER TABLE projects ADD COLUMN IF NOT EXISTS hidden_from_work boolean NOT NULL DEFAULT false;
