-- Link proposals to their source intake submission
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS intake_id uuid REFERENCES public.intake_submissions(id) ON DELETE SET NULL;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS generated_by text;
