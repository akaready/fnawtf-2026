-- ============================================================
-- Update demo FNA quote with a realistic recommended package
-- Run against the demo proposal at /p/demo
-- ============================================================

DO $$
DECLARE
  demo_id uuid;
BEGIN

  SELECT id INTO demo_id FROM public.proposals WHERE slug = 'demo';
  IF demo_id IS NULL THEN
    RAISE NOTICE 'Demo proposal not found — skipping.';
    RETURN;
  END IF;

  UPDATE public.proposal_quotes
  SET
    selected_addons = '{
      "launch-production-days": 2,
      "launch-talent": 1,
      "launch-voiceover": 1,
      "launch-lighting-kit-premium": 1,
      "launch-gimbal": 1,
      "launch-additional-social": 3,
      "launch-bespoke-motion": 1
    }'::jsonb,
    slider_values = '{
      "launch-bespoke-motion": 3000
    }'::jsonb,
    tier_selections = '{}'::jsonb,
    location_days   = '{}'::jsonb,
    photo_count     = 0,
    friendly_discount_pct = 10,
    crowdfunding_enabled  = false,
    crowdfunding_tier     = 0,
    updated_at = now()
  WHERE proposal_id = demo_id
    AND is_fna_quote = true;

  RAISE NOTICE 'Demo FNA quote updated.';

END $$;
