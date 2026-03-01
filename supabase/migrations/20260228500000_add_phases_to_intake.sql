-- Add phases column to intake_submissions
-- Stores selected service phases: build, launch, scale, crowdfunding, fundraising
ALTER TABLE public.intake_submissions ADD COLUMN phases text[] not null default '{}';
