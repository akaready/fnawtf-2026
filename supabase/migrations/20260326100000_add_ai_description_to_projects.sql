-- Add AI-generated semantic description for project matching
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_description text;
