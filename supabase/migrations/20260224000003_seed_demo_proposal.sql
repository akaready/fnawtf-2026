-- ============================================================
-- DEMO PROPOSAL SEED
-- Accessible at /p/demo  password: demo2026
-- ============================================================

DO $$
DECLARE
  demo_id uuid;
  welcome_id uuid;
  approach_id uuid;
BEGIN

  -- ── Proposal ────────────────────────────────────────────────
  INSERT INTO public.proposals (
    title, slug, contact_name, contact_email, contact_company,
    proposal_password, proposal_type, subtitle, status,
    schedule_start_date, schedule_end_date
  ) VALUES (
    'Dream Big Creative Co.',
    'demo',
    'Alex Rivera',
    'alex@dreamcreativeco.com',
    'Dream Big Creative Co.',
    'demo2026',
    'launch',
    'A bespoke video campaign proposal prepared exclusively for you.',
    'sent',
    '2026-03-02',
    '2026-05-14'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    contact_name = EXCLUDED.contact_name,
    subtitle = EXCLUDED.subtitle,
    schedule_start_date = EXCLUDED.schedule_start_date,
    schedule_end_date = EXCLUDED.schedule_end_date,
    updated_at = now()
  RETURNING id INTO demo_id;

  -- ── Delete existing sections + milestones so re-running is idempotent ──
  DELETE FROM public.proposal_sections WHERE proposal_id = demo_id;
  DELETE FROM public.proposal_milestones WHERE proposal_id = demo_id;

  -- ── Welcome Section ─────────────────────────────────────────
  INSERT INTO public.proposal_sections (
    proposal_id, section_type, custom_title, custom_content, sort_order
  ) VALUES (
    demo_id,
    'custom_text',
    'A Note for You',
    E'We''ve been watching what you''re building — and we think it''s the kind of work that deserves to be seen.\n\nThis proposal is our best thinking on how to bring it to life on screen. The creative direction, the timeline, and what it costs to do this right. We''re not here to make content. We''re here to make something that earns real attention.\n\nLet''s build something worth watching.',
    0
  ) RETURNING id INTO welcome_id;

  -- ── Approach Section ────────────────────────────────────────
  INSERT INTO public.proposal_sections (
    proposal_id, section_type, custom_title, custom_content, sort_order
  ) VALUES (
    demo_id,
    'custom_text',
    'How We See It',
    E'Every brand has a story that isn''t being told properly yet. Too much jargon, not enough heart. Our job is to find the signal in the noise — then build a campaign around it.\n\nWe start with listening. We brainstorm, return with concepts, and workshop everything together before a single camera is ever pointed at anything. The result is video that doesn''t just look good — it works.\n\nWe''ve done this across B2B SaaS, DTC consumer goods, nonprofits, and founders who needed the world to finally understand what they built. The pattern is always the same: the best work comes from truly understanding who you''re talking to and what you need them to feel.',
    1
  ) RETURNING id INTO approach_id;

  -- ── Milestones ───────────────────────────────────────────────
  INSERT INTO public.proposal_milestones (proposal_id, label, description, start_date, end_date, sort_order) VALUES
    (demo_id, 'Kickoff',        'Alignment call with the full team. Review brief, finalize scope, and lock creative direction.',                              '2026-03-02', '2026-03-04', 0),
    (demo_id, 'Script Rev 1',   'First draft of script delivered for your review. Focus on tone, structure, and key messages.',                              '2026-03-09', '2026-03-11', 1),
    (demo_id, 'Script Rev 2',   'Revised script incorporating your feedback. Narrative tightened and call-to-action clarified.',                            '2026-03-16', '2026-03-18', 2),
    (demo_id, 'Final Script',   'Script locked — no further changes to narrative structure. All departments aligned.',                                       '2026-03-23', '2026-03-25', 3),
    (demo_id, 'Pre-Production', 'Location scouts, talent casting, wardrobe, props, and full crew briefing.',                                                '2026-03-26', '2026-03-31', 4),
    (demo_id, 'Production',     'Principal photography across all agreed-upon locations. Full crew, all gear, magic made.',                                 '2026-04-01', '2026-04-14', 5),
    (demo_id, 'Edit Rev 1',     'First rough cut with temp music and working graphics. We review pacing, structure, and story.',                            '2026-04-21', '2026-04-23', 6),
    (demo_id, 'Edit Rev 2',     'Refined cut with your feedback addressed. Final music selection, colour grade pass, and sound design.',                    '2026-04-28', '2026-04-30', 7),
    (demo_id, 'Edit Rev 3',     'Near-final cut. All graphics locked, voice-over recorded, and mix complete. One more review before delivery.',             '2026-05-05', '2026-05-07', 8),
    (demo_id, 'Final Delivery', 'Master files and all platform-specific exports delivered. We stay in touch to support your launch.',                       '2026-05-12', '2026-05-14', 9);

END $$;
