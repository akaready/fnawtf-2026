-- Add blurb field to proposal_projects for "what to look for" text per sample project
ALTER TABLE public.proposal_projects
  ADD COLUMN blurb text;
