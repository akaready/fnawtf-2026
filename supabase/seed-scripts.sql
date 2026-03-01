-- Seed realistic scripts for FNA admin
-- Run this in the Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════
-- SCRIPT 1: Brand Launch Video — "Rise & Grind Coffee Co."
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  s1_id UUID := gen_random_uuid();
  s1_group UUID := gen_random_uuid();
  -- scenes
  sc1_id UUID := gen_random_uuid();
  sc2_id UUID := gen_random_uuid();
  sc3_id UUID := gen_random_uuid();
  sc4_id UUID := gen_random_uuid();
  sc5_id UUID := gen_random_uuid();
  -- locations
  loc_roastery UUID := gen_random_uuid();
  loc_cafe UUID := gen_random_uuid();
  loc_farm UUID := gen_random_uuid();
  loc_studio UUID := gen_random_uuid();
  -- characters
  char_owner UUID := gen_random_uuid();
  char_barista UUID := gen_random_uuid();
  char_narrator UUID := gen_random_uuid();
BEGIN

INSERT INTO scripts (id, title, project_id, script_group_id, status, version, notes, created_at, updated_at)
VALUES (
  s1_id,
  'Rise & Grind — Brand Launch',
  NULL,
  s1_group,
  'review',
  2,
  'Brand launch video for Rise & Grind Coffee Co. 60-second hero cut + 30-second social edit. Client wants warm, authentic feel — no stock footage. V2 adds the farm origin sequence.',
  now() - interval '3 days',
  now() - interval '1 hour'
);

-- Locations
INSERT INTO script_locations (id, script_id, name, description, sort_order) VALUES
  (loc_roastery, s1_id, 'ROASTERY', 'Main roasting facility — industrial brick, copper pipes, warm overhead lighting. Shoot during morning roast for steam/atmosphere.', 0),
  (loc_cafe, s1_id, 'CAFÉ FLOOR', 'Front of house — customers, espresso bar, natural light from storefront windows. Best light 8-10am.', 1),
  (loc_farm, s1_id, 'COFFEE FARM', 'Origin footage — Colombian highlands. Will composite with drone footage from stock if we can''t travel. Client prefers real footage.', 2),
  (loc_studio, s1_id, 'STUDIO', 'Product hero shots — white cyc or dark moody setup. Need both for social vs. website.', 3);

-- Characters
INSERT INTO script_characters (id, script_id, name, description, color, sort_order) VALUES
  (char_owner, s1_id, 'MARCUS', 'Founder/owner of Rise & Grind. Late 30s, passionate, speaks with hands. Wardrobe: dark apron over henley.', '#f97316', 0),
  (char_barista, s1_id, 'ELENA', 'Head barista. Early 20s, confident, tattooed forearms. The face of the brand on social.', '#f472b6', 1),
  (char_narrator, s1_id, 'VO', 'Voiceover — warm male voice, conversational not corporate. Think Anthony Bourdain energy.', '#60a5fa', 2);

-- Tags
INSERT INTO script_tags (id, script_id, name, slug, category, color) VALUES
  (gen_random_uuid(), s1_id, 'Interview', 'interview', 'general', '#f97316'),
  (gen_random_uuid(), s1_id, 'B-Roll', 'broll', 'general', '#3b82f6'),
  (gen_random_uuid(), s1_id, 'Graphics', 'gfx', 'general', '#22c55e'),
  (gen_random_uuid(), s1_id, 'Stock', 'stock', 'general', '#38bdf8'),
  (gen_random_uuid(), s1_id, 'VFX', 'vfx', 'general', '#8b5cf6'),
  (gen_random_uuid(), s1_id, 'Transition', 'transition', 'general', '#14b8a6');

-- Scenes
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc1_id, s1_id, 0, 'ROASTERY', loc_roastery, 'DAWN', 'INT', 'Open cold — no logos, no titles. Just atmosphere. Let the viewer feel the space before they know what it is.'),
  (sc2_id, s1_id, 1, 'CAFÉ FLOOR', loc_cafe, 'DAY', 'INT', 'Transition from roastery steam to espresso steam — match cut opportunity.'),
  (sc3_id, s1_id, 2, 'COFFEE FARM', loc_farm, 'DAY', 'EXT', 'Origin sequence — added in V2. Marcus talks about sourcing. If we can''t get real farm footage, we composite with aerials.'),
  (sc4_id, s1_id, 3, 'STUDIO', loc_studio, 'CONTINUOUS', 'INT', 'Product hero moment. Slow pour, latte art, bag reveal.'),
  (sc5_id, s1_id, 4, 'CAFÉ FLOOR', loc_cafe, 'DAY', 'INT', 'End on the human moment — customers, community, warmth. Logo resolve over final shot.');

-- Beats for Scene 1: ROASTERY / DAWN
INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc1_id, 0,
   'Natural sound — roaster spinning, beans cracking. No music yet.',
   'Extreme CU: green coffee beans tumbling in roaster drum. Warm amber light catches the oils.',
   'Shoot at 120fps for slow-mo option. Need macro lens.'),
  (gen_random_uuid(), sc1_id, 1,
   'Low ambient drone fades in — something analog, vinyl-warm.',
   'Pull back to reveal **Marcus** standing at the roaster, checking temperature. Steam rises around him.',
   'This is our first character reveal. Don''t rush it — let him exist in the frame for a beat before he moves.'),
  (gen_random_uuid(), sc1_id, 2,
   '**VO**: "Every morning starts the same way. Before the doors open. Before the first order."',
   'Handheld follow — Marcus moves to the cupping table. Pours water over grounds. Close-up of the bloom.',
   'Voiceover should feel like internal monologue, not narration. Record with proximity — we want breath.'),
  (gen_random_uuid(), sc1_id, 3,
   'Sound of ceramic — cup set down on wood.',
   'CU: Marcus cups the coffee. Eyes closed. A small nod — today''s roast is right.',
   'This beat is the emotional anchor of the opening. If we nail this, the whole piece works.');

-- Beats for Scene 2: CAFÉ FLOOR / DAY
INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc2_id, 0,
   'Music builds — still gentle. Espresso machine hiss blends with roastery ambience.',
   'Match cut: steam from roaster → steam from espresso machine. We''re in the café now.',
   'This transition is critical — storyboard it. May need VFX morph if practical match cut doesn''t land.'),
  (gen_random_uuid(), sc2_id, 1,
   '**VO**: "It''s not about the coffee. I mean — it is. But it''s about what the coffee makes possible."',
   '**Elena** pulls a shot with practiced confidence. Latte art pour — overhead angle. Hands the cup to a regular.',
   'Elena should feel like she owns this space. No performative smiling — just competence and flow.'),
  (gen_random_uuid(), sc2_id, 2,
   'Ambient café sounds — murmur of conversation, milk frothing, register beep.',
   'Montage: hands wrapping around warm mugs, laptop screens reflected in glasses, two friends laughing, a journal open beside a cortado.',
   'B-roll montage — 3-4 shots, quick cuts. Each should feel specific and real, not staged. Shoot observational.'),
  (gen_random_uuid(), sc2_id, 3,
   'Music dips — breath of silence.',
   'Slow push on Marcus watching from behind the counter. Soft focus on the room behind him.',
   'The "why" beat — Marcus seeing the result of his work. Hold this shot longer than feels comfortable.');

-- Beats for Scene 3: COFFEE FARM / DAY
INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc3_id, 0,
   'Hard cut to natural sound — birds, wind through coffee plants.',
   'Wide aerial: green hillsides of coffee plantation. Morning mist. Altitude title card: "Huila, Colombia — 1,800m"',
   'If using stock aerials, color grade to match our footage. Title card uses brand typeface — motion design.'),
  (gen_random_uuid(), sc3_id, 1,
   '**Marcus** (on camera): "I flew down there three years ago thinking I''d find a supplier. I found a partner."',
   'Handheld: Marcus walks between coffee rows, touching the cherry. Interview framing — natural light, shallow DOF.',
   'Interview is handheld, NOT locked off. We want energy and intimacy. Shoot in available light.'),
  (gen_random_uuid(), sc3_id, 2,
   '**VO**: "Every bag traces back to a specific hillside. A specific family."',
   'CU: Hands picking ripe cherry. Workers sorting beans. Sun through translucent coffee cherry.',
   'These shots sell the traceability angle. Client wants to emphasize direct trade — make it tangible.');

-- Beats for Scene 4: STUDIO
INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc4_id, 0,
   'Music swells — fuller arrangement. Bass comes in.',
   'Product hero: slow-motion pour of espresso into clear glass. Rich crema. Shot on dark background, edge-lit.',
   'Phantom or similar high-speed camera. This is the "money shot" for social cutdowns.'),
  (gen_random_uuid(), sc4_id, 1,
   'Sound design: satisfying ''thud'' of bag hitting surface.',
   '**Rise & Grind** bag slides into frame. Rotate to reveal label. Focus pull to logo.',
   'Two versions: dark moody (brand film) and white clean (e-commerce). Shoot both setups.');

-- Beats for Scene 5: CAFÉ FLOOR (end)
INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc5_id, 0,
   '**VO**: "This is what we wake up for."',
   'Back in the café — golden hour light. Elena hands a to-go cup to a customer. Genuine smile.',
   'Bookend with the opening — we started in solitude (Marcus alone at dawn), we end in community.'),
  (gen_random_uuid(), sc5_id, 1,
   'Music resolves — warm final chord. Room tone underneath.',
   'Slow push on the storefront from outside. Through the glass: warm light, people, life. Logo fades in over the image.',
   'Logo resolve should feel earned, not slapped on. Animate it subtle — opacity only, no scale.'),
  (gen_random_uuid(), sc5_id, 2,
   'Silence. Then: sound of a cup being set down.',
   'End card: **riseandgrind.co** / tagline: "Start here." Black card, clean type.',
   'Hold for 3 seconds. Needs to work as final frame in social shares — make sure type is large enough.');

END $$;


-- ═══════════════════════════════════════════════════════════
-- SCRIPT 2: Documentary Short — "The Last Darkroom"
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  s2_id UUID := gen_random_uuid();
  s2_group UUID := gen_random_uuid();
  -- scenes
  sc1_id UUID := gen_random_uuid();
  sc2_id UUID := gen_random_uuid();
  sc3_id UUID := gen_random_uuid();
  sc4_id UUID := gen_random_uuid();
  -- locations
  loc_darkroom UUID := gen_random_uuid();
  loc_gallery UUID := gen_random_uuid();
  loc_street UUID := gen_random_uuid();
  -- characters
  char_harold UUID := gen_random_uuid();
  char_student UUID := gen_random_uuid();
BEGIN

INSERT INTO scripts (id, title, project_id, script_group_id, status, version, notes, created_at, updated_at)
VALUES (
  s2_id,
  'The Last Darkroom',
  NULL,
  s2_group,
  'draft',
  1,
  'Short documentary about Harold Itō, 74, who runs the last public darkroom in Portland. 8-12 minute runtime. Festival submission target: SXSW, Tribeca Shorts. Funded through Oregon Media Arts grant.',
  now() - interval '1 day',
  now() - interval '2 hours'
);

-- Locations
INSERT INTO script_locations (id, script_id, name, description, sort_order) VALUES
  (loc_darkroom, s2_id, 'DARKROOM', 'Harold''s darkroom — basement of a converted Victorian. Red safelight. Enlarger stations, chemical trays, drying lines. The space itself is a character.', 0),
  (loc_gallery, s2_id, 'GALLERY', 'Small gallery space upstairs from the darkroom. Harold''s prints and student work on the walls. Natural light from skylight.', 1),
  (loc_street, s2_id, 'HAWTHORNE DISTRICT', 'Portland street exteriors — Harold''s neighborhood. The building''s facade with hand-painted sign: "Itō Darkroom — est. 1981"', 2);

-- Characters
INSERT INTO script_characters (id, script_id, name, description, color, sort_order) VALUES
  (char_harold, s2_id, 'HAROLD', 'Harold Itō, 74. Japanese-American. Quiet intensity. Moves slowly, deliberately. Hands tell his story — stained with decades of silver gelatin. Always wears a dark apron.', '#c084fc', 0),
  (char_student, s2_id, 'MAYA', 'Maya Chen, 22. One of Harold''s last students. Gen Z photographer who came to film, stayed for silver. The bridge between Harold''s world and ours.', '#34d399', 1);

-- Tags
INSERT INTO script_tags (id, script_id, name, slug, category, color) VALUES
  (gen_random_uuid(), s2_id, 'Interview', 'interview', 'general', '#f97316'),
  (gen_random_uuid(), s2_id, 'B-Roll', 'broll', 'general', '#3b82f6'),
  (gen_random_uuid(), s2_id, 'Graphics', 'gfx', 'general', '#22c55e'),
  (gen_random_uuid(), s2_id, 'VFX', 'vfx', 'general', '#8b5cf6'),
  (gen_random_uuid(), s2_id, 'Transition', 'transition', 'general', '#14b8a6');

-- Scene 1: DARKROOM — opening
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc1_id, s2_id, 0, 'DARKROOM', loc_darkroom, 'NIGHT', 'INT', 'Cold open in darkness. Literally. The audience should feel disoriented before the safelight comes on.');

INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc1_id, 0,
   'Black. Then: the click of a switch. Hum of the safelight warming up.',
   'Total darkness for 3 seconds. Then: red safelight blooms. We see hands — **Harold''s** hands — lifting a sheet of paper from a chemical tray.',
   'Sound design is everything here. Record the actual safelight switch, the chemical tray sounds. No foley — all practical.'),
  (gen_random_uuid(), sc1_id, 1,
   'Dripping. The gentle slosh of developer in the tray.',
   'CU: An image slowly appears on the paper. A face emerges from nothing. The magic of analog photography.',
   'Shoot this for real — submerge paper in developer and capture the image appearing. This IS the hook. Time-lapse at 2x speed if needed.'),
  (gen_random_uuid(), sc1_id, 2,
   '**Harold**: "People ask me why I don''t just... scan it. Upload it. And I say — would you ask a painter to describe their painting over the phone?"',
   'Harold pins the wet print to the drying line with wooden clothespins. We see a wall of prints behind him — decades of work.',
   'First time we hear Harold''s voice. It should land like a thesis statement. Let the quote breathe — no music under it.'),
  (gen_random_uuid(), sc1_id, 3,
   'Quiet. Ventilation fan. Harold''s footsteps on concrete.',
   'Wide shot of the darkroom — Harold small in the frame, surrounded by his equipment. Enlargers, timers, trays. A cathedral of analog.',
   'This wide establishes the space as sacred. Shoot low angle to give the room grandeur. Safelight only — no additional lighting.');

-- Scene 2: GALLERY
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc2_id, s2_id, 1, 'GALLERY', loc_gallery, 'DAY', 'INT', 'Context: who Harold is beyond the darkroom. His art, his legacy on the walls.');

INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc2_id, 0,
   '**Harold**: "My father had a camera in the internment camp. A contraband Leica. That''s where this started — with something you weren''t supposed to have."',
   'Slow pan across Harold''s gallery wall. Black and white prints: Portland in the 70s, Japanese gardens, portraits of his community.',
   'This is the emotional core. Harold''s family history, the internment, the camera as resistance. Handle with care. Let him tell it.'),
  (gen_random_uuid(), sc2_id, 1,
   'Natural room sound. Skylight rain if we''re lucky.',
   'Harold adjusts a frame on the wall. Steps back. Considers it. The way he looks at his own work tells you everything.',
   'B-roll moment but feels like cinema. Don''t direct him — just let him be in his space and observe.'),
  (gen_random_uuid(), sc2_id, 2,
   '**Maya**: "I came in here to learn darkroom for a class assignment. That was two years ago."',
   '**Maya** appears for the first time, looking at prints on the wall. She traces the edge of a frame without touching it.',
   'Maya''s introduction — she should feel like she belongs here. Her reverence for the space mirrors the audience''s.');

-- Scene 3: DARKROOM — teaching
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc3_id, s2_id, 2, 'DARKROOM', loc_darkroom, 'NIGHT', 'INT', 'Harold and Maya working together. The passing of knowledge.');

INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc3_id, 0,
   '**Harold** (to Maya): "You''re dodging too long. Trust the paper. It knows what it wants to be."',
   'Two-shot under safelight: Harold stands behind Maya at the enlarger. She''s making a print. He watches her hands, not the print.',
   'This dynamic — master and student — is the structural engine of the film. Shoot coverage: two-shot, OTS both directions, CU hands.'),
  (gen_random_uuid(), sc3_id, 1,
   '**Maya**: "He never says ''good job.'' He says ''that''s closer.'' And somehow that means more."',
   'Maya pulls a print from the wash. Holds it up to the safelight. Harold leans in. Neither speaks. He nods, barely.',
   'Interview audio over observational footage. Maya''s VO gives us her perspective while we watch the dynamic play out.'),
  (gen_random_uuid(), sc3_id, 2,
   '**Harold**: "The darkroom is the last place where you have to be patient. Where you can''t skip ahead. Where the process is the point."',
   'Montage: chemicals being mixed, paper being cut, the timer ticking, Harold''s hands in the developer. Rhythm builds.',
   'This is our "process montage" — should feel meditative, not MTV. Cut to the rhythm of Harold''s speech. Let it breathe.');

-- Scene 4: STREET — ending
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc4_id, s2_id, 3, 'HAWTHORNE DISTRICT', loc_street, 'DUSK', 'EXT', 'The outside world — context for what''s at stake. The sign, the neighborhood, the question of how long.');

INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc4_id, 0,
   'Street sounds. Traffic. The world outside the darkroom.',
   'Exterior: the building on Hawthorne. Hand-painted sign. People walk past without looking up. A phone repair shop next door.',
   'Contrast: the analog haven surrounded by the digital world. The sign should feel like a relic — because it is.'),
  (gen_random_uuid(), sc4_id, 1,
   '**Harold**: "The lease is up in April. The landlord wants to put in a... what did he call it... a ''wellness space.''"',
   'Harold locks the front door from inside. Through the glass, we see the street at dusk. His reflection overlaps with the outside world.',
   'This is the stakes reveal. Don''t editorialize — Harold''s understatement says everything. The pause before "wellness space" is devastating.'),
  (gen_random_uuid(), sc4_id, 2,
   'Silence. Then the click of the safelight.',
   'Final shot: Harold''s hand reaching for the safelight switch. Red light fills the frame. Cut to black.',
   'Mirror the opening. We began with the safelight turning on. We end with it too. The question is: for how much longer?');

END $$;


-- ═══════════════════════════════════════════════════════════
-- SCRIPT 3: Product Launch — "Lumina Smart Mirror"
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  s3_id UUID := gen_random_uuid();
  s3_group UUID := gen_random_uuid();
  -- scenes
  sc1_id UUID := gen_random_uuid();
  sc2_id UUID := gen_random_uuid();
  sc3_id UUID := gen_random_uuid();
  -- locations
  loc_bathroom UUID := gen_random_uuid();
  loc_studio UUID := gen_random_uuid();
  -- characters
  char_model UUID := gen_random_uuid();
  char_vo UUID := gen_random_uuid();
BEGIN

INSERT INTO scripts (id, title, project_id, script_group_id, status, version, notes, created_at, updated_at)
VALUES (
  s3_id,
  'Lumina Smart Mirror — Launch Film',
  NULL,
  s3_group,
  'locked',
  3,
  'Product launch film for Lumina''s first smart mirror. Approved by client 02/25. Going to final color and sound mix. 45-second cutdown for paid social also needed.',
  now() - interval '7 days',
  now() - interval '4 hours'
);

-- Locations
INSERT INTO script_locations (id, script_id, name, description, sort_order) VALUES
  (loc_bathroom, s3_id, 'BATHROOM SET', 'Designed bathroom set — modern minimalist. White marble, brass fixtures. The mirror is the centerpiece. Needs to feel aspirational but achievable.', 0),
  (loc_studio, s3_id, 'PRODUCT STAGE', 'Dark void product stage with programmable LED edge lighting. For isolated product beauty shots.', 1);

-- Characters
INSERT INTO script_characters (id, script_id, name, description, color, sort_order) VALUES
  (char_model, s3_id, 'TALENT', 'Lifestyle talent — woman, 30s. Natural beauty, minimal makeup. Should feel like the product enhances rather than creates. NOT a model look — real and relatable.', '#fbbf24', 0),
  (char_vo, s3_id, 'VO', 'Female voiceover — calm, confident, warm. Think Scarlett Johansson in Her but less breathy. Intelligent, not seductive.', '#38bdf8', 1);

-- Tags
INSERT INTO script_tags (id, script_id, name, slug, category, color) VALUES
  (gen_random_uuid(), s3_id, 'B-Roll', 'broll', 'general', '#3b82f6'),
  (gen_random_uuid(), s3_id, 'Graphics', 'gfx', 'general', '#22c55e'),
  (gen_random_uuid(), s3_id, 'VFX', 'vfx', 'general', '#8b5cf6'),
  (gen_random_uuid(), s3_id, 'Overlay Graphics', 'gfx-overlay', 'general', '#84cc16');

-- Scene 1: BATHROOM — morning routine
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc1_id, s3_id, 0, 'BATHROOM SET', loc_bathroom, 'DAY', 'INT', 'The "before and after" — morning routine without the mirror, then with it. The mirror should feel like it wakes up WITH her.');

INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc1_id, 0,
   'Alarm tone — soft, melodic. Bare feet on tile.',
   '**Talent** walks into the bathroom, still waking up. Mirror is off — just a regular mirror. She looks at herself, squints at the light.',
   'Play the "before" straight — this is every morning for everyone. Relatable, slightly groggy, honest.'),
  (gen_random_uuid(), sc1_id, 1,
   '**VO**: "Good morning. You have a 9am with the design team. It''s 54 degrees outside."',
   'She touches the mirror — it comes alive. Soft ambient UI appears: time, weather, calendar. The glass itself seems to glow. Her face is beautifully lit.',
   'VFX: Mirror UI overlay. Tracked to the glass surface. Should feel embedded, not projected. Reference: Minority Report meets Apple aesthetics.'),
  (gen_random_uuid(), sc1_id, 2,
   'Gentle electronic score — minimal, tasteful. Think Ólafur Arnalds.',
   'She swipes through her morning: skincare routine guide on screen, today''s UV index, a lighting preset that adjusts the bathroom lights warmer.',
   'UI animation should be designed and tracked in post. Shoot clean passes with and without talent for compositing flexibility.'),
  (gen_random_uuid(), sc1_id, 3,
   '**VO**: "Your skin is 12% more hydrated than last week."',
   'CU: the mirror''s skin analysis overlay — clean, medical-grade but friendly. She smiles. It''s working.',
   'This feature is the key differentiator. The UI here needs to feel trustworthy — not gimmicky. Show real data visualization.');

-- Scene 2: PRODUCT STAGE
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc2_id, s3_id, 1, 'PRODUCT STAGE', loc_studio, 'CONTINUOUS', 'INT', 'Product beauty shots — the mirror floating in space. Hero angles for the product itself.');

INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc2_id, 0,
   'Score hits a beat — single piano note, reverb.',
   'The Lumina mirror alone on black void. Edge lighting reveals the form factor. Slow rotation. The screen shows a living wallpaper — northern lights.',
   'This is the "breathe" moment between narrative and product. 3 seconds max. Shot on turntable with programmatic lighting.'),
  (gen_random_uuid(), sc2_id, 1,
   'Sound design: glass ''ting'' — premium material sound.',
   'Detail shots: the thin profile from the side, the brushed aluminum frame, the capacitive touch surface responding to a finger.',
   'These are for the website hero section too — shoot extra angles and output as cinemagraphs. Client wants looping crops for PDP.');

-- Scene 3: BATHROOM — end
INSERT INTO script_scenes (id, script_id, sort_order, location_name, location_id, time_of_day, int_ext, scene_notes) VALUES
  (sc3_id, s3_id, 2, 'BATHROOM SET', loc_bathroom, 'DAY', 'INT', 'Return to the narrative. She''s ready. The mirror says goodbye.');

INSERT INTO script_beats (id, scene_id, sort_order, audio_content, visual_content, notes_content) VALUES
  (gen_random_uuid(), sc3_id, 0,
   '**VO**: "See yourself. Clearly."',
   'Talent is ready — dressed, confident. She gives herself one last look. The mirror subtly adjusts its lighting to be flattering. She smirks — she notices.',
   'The smirk is key — she''s in on it. The mirror is smart and she appreciates that. Not magic, just good technology.'),
  (gen_random_uuid(), sc3_id, 1,
   'Score resolves. Silence.',
   'She walks out. The mirror gracefully dims to standby — a soft clock remains. End card: **LUMINA** logo. "See clearly." Pre-order date.',
   'Logo animation matches the mirror UI aesthetic — same typeface, same motion language. End card needs pre-order URL and QR code for social version.');

END $$;
