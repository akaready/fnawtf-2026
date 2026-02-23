-- Add client_id FK to testimonials for proper client attribution
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

-- Add display_order for homepage ordering
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
