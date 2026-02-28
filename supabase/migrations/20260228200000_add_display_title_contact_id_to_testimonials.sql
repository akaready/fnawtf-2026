-- Add missing columns to testimonials table
-- display_title: override for displayed title/role on homepage
-- contact_id: FK to contacts table for linking testimonials to known contacts
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS display_title TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
