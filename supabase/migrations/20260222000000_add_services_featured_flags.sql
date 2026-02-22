-- Add featured services boolean flags to projects table
-- These control which projects appear in each section of the Services page

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS featured_services_build       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_services_launch      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_services_scale       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_services_crowdfunding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_services_fundraising  boolean DEFAULT false;

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_projects_featured_services_build        ON projects(featured_services_build)        WHERE featured_services_build = true;
CREATE INDEX IF NOT EXISTS idx_projects_featured_services_launch       ON projects(featured_services_launch)       WHERE featured_services_launch = true;
CREATE INDEX IF NOT EXISTS idx_projects_featured_services_scale        ON projects(featured_services_scale)        WHERE featured_services_scale = true;
CREATE INDEX IF NOT EXISTS idx_projects_featured_services_crowdfunding ON projects(featured_services_crowdfunding) WHERE featured_services_crowdfunding = true;
CREATE INDEX IF NOT EXISTS idx_projects_featured_services_fundraising  ON projects(featured_services_fundraising)  WHERE featured_services_fundraising = true;
