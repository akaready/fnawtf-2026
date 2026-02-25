-- Add proposal_blurb column to proposal_videos
-- Per-video "what to watch for" text shown on ProjectSlide
ALTER TABLE public.proposal_videos
  ADD COLUMN proposal_blurb text;
