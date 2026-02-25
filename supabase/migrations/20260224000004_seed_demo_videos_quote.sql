-- ============================================================
-- DEMO PROPOSAL: Add quotes + videos
-- Run after 20260224000003_seed_demo_proposal.sql
-- ============================================================

DO $$
DECLARE
  demo_id uuid;
BEGIN

  -- Resolve demo proposal id
  SELECT id INTO demo_id FROM public.proposals WHERE slug = 'demo';
  IF demo_id IS NULL THEN
    RAISE NOTICE 'Demo proposal not found — skipping.';
    RETURN;
  END IF;

  -- ── Idempotent cleanup ────────────────────────────────────
  DELETE FROM public.proposal_quotes  WHERE proposal_id = demo_id AND is_fna_quote = true;
  DELETE FROM public.proposal_videos  WHERE proposal_id = demo_id;

  -- ── FnA Quote (our recommended package) ─────────────────
  INSERT INTO public.proposal_quotes (
    proposal_id,
    label,
    is_fna_quote,
    is_locked,
    quote_type,
    selected_addons,
    slider_values,
    tier_selections,
    location_days,
    photo_count,
    crowdfunding_enabled,
    crowdfunding_tier,
    fundraising_enabled,
    defer_payment,
    friendly_discount_pct,
    total_amount,
    down_amount
  ) VALUES (
    demo_id,
    'Our Recommended Package',
    true,
    false,
    'launch',
    '{}',
    '{}',
    '{}',
    '{}',
    0,
    false,
    0,
    false,
    false,
    0,
    28500,
    9500
  );

  -- ── Videos: pick up to 6 project_videos that belong to projects with style_tags ──
  -- We insert them ordered by the project's updated_at so the most recent work shows first
  INSERT INTO public.proposal_videos (proposal_id, project_video_id, sort_order)
  SELECT
    demo_id,
    pv.id,
    ROW_NUMBER() OVER (ORDER BY p.updated_at DESC) - 1
  FROM public.project_videos pv
  JOIN public.projects p ON p.id = pv.project_id
  WHERE
    p.style_tags IS NOT NULL
    AND array_length(p.style_tags, 1) > 0
    AND pv.bunny_video_id IS NOT NULL
    AND pv.bunny_video_id <> ''
  ORDER BY p.updated_at DESC
  LIMIT 6;

END $$;
