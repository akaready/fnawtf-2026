-- Add category field to projects table for project types (Kickstarter Launch, Brand Film, etc.)
ALTER TABLE projects ADD COLUMN category TEXT;

-- Add index for better query performance
CREATE INDEX idx_projects_category ON projects(category);
