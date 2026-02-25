-- Replace demo proposal videos with 3 projects that have testimonials
DO $$
DECLARE
  demo_id uuid;
  section_id uuid;
BEGIN
  SELECT id INTO demo_id FROM public.proposals WHERE slug = 'demo';

  -- Get the video section id
  SELECT id INTO section_id FROM public.proposal_sections
    WHERE proposal_id = demo_id AND section_type = 'video';

  -- Delete existing proposal_videos for demo
  DELETE FROM public.proposal_videos WHERE proposal_id = demo_id;

  -- Insert 3 flagship videos from projects with testimonials
  -- 1. Catan ⤫ Tilt 5
  INSERT INTO public.proposal_videos (proposal_id, section_id, project_video_id, sort_order)
  VALUES (demo_id, section_id,
    (SELECT id FROM public.project_videos WHERE bunny_video_id = '9ff16675-2cdc-42c8-b817-58d286549a0c'), 0);

  -- 2. Vesper 2 Launch (Crave)
  INSERT INTO public.proposal_videos (proposal_id, section_id, project_video_id, sort_order)
  VALUES (demo_id, section_id,
    (SELECT id FROM public.project_videos WHERE bunny_video_id = '4b92d782-9303-4f56-9774-f5445926b67e'), 1);

  -- 3. Breadwinner
  INSERT INTO public.proposal_videos (proposal_id, section_id, project_video_id, sort_order)
  VALUES (demo_id, section_id,
    (SELECT id FROM public.project_videos WHERE bunny_video_id = 'dceaebcb-74de-4381-a009-3fe247ba293b'), 2);
END $$;
