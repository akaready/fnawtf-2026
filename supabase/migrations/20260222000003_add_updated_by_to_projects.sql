-- Add updated_by to track which admin user last modified a project
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
