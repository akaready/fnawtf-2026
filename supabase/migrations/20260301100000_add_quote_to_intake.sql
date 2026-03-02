-- Store the client's self-built quote as JSONB on intake_submissions
ALTER TABLE public.intake_submissions ADD COLUMN quote_data jsonb;
