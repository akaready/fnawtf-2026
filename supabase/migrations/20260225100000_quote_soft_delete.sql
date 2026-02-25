-- Add soft-delete support for proposal quotes
ALTER TABLE public.proposal_quotes ADD COLUMN deleted_at timestamptz;
