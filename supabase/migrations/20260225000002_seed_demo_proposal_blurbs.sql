-- Add "Selected because" blurbs to demo proposal videos
DO $$
DECLARE
  demo_id uuid;
BEGIN
  SELECT id INTO demo_id FROM public.proposals WHERE slug = 'demo';

  -- Catan x Tilt 5
  UPDATE public.proposal_videos
  SET proposal_blurb = 'A fully CG game trailer that shows our range beyond live-action. The VFX pipeline, 3D compositing, and motion design here mirror the kind of polish your brand video needs to stand out in a crowded feed.'
  WHERE proposal_id = demo_id AND sort_order = 0;

  -- Vesper 2 Launch (Crave)
  UPDATE public.proposal_videos
  SET proposal_blurb = 'A fashion-forward product launch that leans into bold art direction and pacing. The interview-driven narrative structure and founder-story angle is close to the tone we see working for your campaign.'
  WHERE proposal_id = demo_id AND sort_order = 1;

  -- Breadwinner
  UPDATE public.proposal_videos
  SET proposal_blurb = 'A scrappy, founder-led brand story with high production value on a lean budget. The humor, warmth, and clear product storytelling here is the blueprint for making every dollar count.'
  WHERE proposal_id = demo_id AND sort_order = 2;
END $$;
