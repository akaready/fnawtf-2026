-- Update demo proposal sections to use rich markdown text
-- IMPORTANT: proposal_sections has NO updated_at column
DO $$
DECLARE
  demo_id uuid;
BEGIN
  SELECT id INTO demo_id FROM public.proposals WHERE slug = 'demo';
  IF demo_id IS NULL THEN
    RAISE NOTICE 'Demo proposal not found — skipping.';
    RETURN;
  END IF;

  -- Welcome section (sort_order = 0)
  UPDATE public.proposal_sections
  SET
    custom_title   = 'We''ve been watching.',
    custom_content = E'We''ve been watching what you''re building — and we think it''s the kind of work that deserves to be **seen**.\n\nThis proposal is our best thinking on how to bring it to life on screen:\n\n- The creative direction\n- The timeline\n- What it costs to *do this right*\n\n> We''re not here to make content. We''re here to make something that earns real attention.\n\nLet''s build something worth watching.'
  WHERE
    proposal_id = demo_id
    AND sort_order = 0
    AND section_type = 'custom_text';

  -- Approach section (sort_order = 1)
  UPDATE public.proposal_sections
  SET
    custom_title   = 'Every brand has a story that isn''t being told properly yet.',
    custom_content = E'Too much jargon, not enough heart. Our job is to find the **signal in the noise** — then build a campaign around it.\n\nWe start with listening. Then we:\n\n- Brainstorm internally\n- Return with *three distinct concepts*\n- Workshop everything together before a single camera is pointed at anything\n\n> The result is video that doesn''t just look good — it **works**.\n\nWe''ve done this across **B2B SaaS**, DTC consumer goods, nonprofits, and founders who needed the world to finally understand what they built.'
  WHERE
    proposal_id = demo_id
    AND sort_order = 1
    AND section_type = 'custom_text';

END $$;
