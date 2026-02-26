-- Add description column for per-quote blurbs (admin sets on FNA quotes, clients edit on their own)
ALTER TABLE public.proposal_quotes ADD COLUMN IF NOT EXISTS description text;
