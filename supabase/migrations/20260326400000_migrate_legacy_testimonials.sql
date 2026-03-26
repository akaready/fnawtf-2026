-- Migrate 8 projects that have client_quote but no testimonial record.
-- 4 need new contacts created; 4 already have contacts.

BEGIN;

-- 1. Create contacts for projects that don't have one

-- Kevin Chou — AGIGA (EchoVision)
INSERT INTO contacts (id, first_name, last_name, role, client_id)
VALUES (
  gen_random_uuid(),
  'Kevin', 'Chou', 'Chief Visionary',
  'b78953e2-49a1-4858-b584-e6eab74c22c5'
);

-- Michael Weiss-Malik — Groove Thing
INSERT INTO contacts (id, first_name, last_name, role, client_id)
VALUES (
  gen_random_uuid(),
  'Michael', 'Weiss-Malik', 'Co-Founder',
  '554f08a0-26c9-4cef-9426-5ace813ddc77'
);

-- Jackson Hung — Brezi Coffee
INSERT INTO contacts (id, first_name, last_name, role, client_id)
VALUES (
  gen_random_uuid(),
  'Jackson', 'Hung', 'Founder',
  '40a3d75d-41f4-497a-8d5c-17422ea44adf'
);

-- Miles Pepper — Woof
INSERT INTO contacts (id, first_name, last_name, role, client_id)
VALUES (
  gen_random_uuid(),
  'Miles', 'Pepper', 'Director of Brand Marketing',
  'a34a44a8-326e-45fd-b180-2196c9baeee9'
);

-- 2. Create testimonial records for all 8 projects

-- Breadwinner (existing contact: Fred Benenson)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  '014aa07e-512d-45d0-b789-61225b2f0d76',
  '4ccf1f74-33a4-4752-957a-ddc919943f4a',
  'c6ef56e1-babb-4bf2-ad4b-dcda1ea06668',
  'Thoughtfully crafted our story into something entertaining, smart, honest, and important for our brand''s future.',
  'Fred Benenson', 'CEO';

-- Duet Pro Launch / Crave OG (existing contact: Ti Chang)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  'c331d4c8-0fbf-48e0-867f-921c3b9a71f4',
  '2faf9c90-9271-427c-b7c9-4720d57a9738',
  '2ce369a5-3349-49ed-8a84-e84208a0a2e4',
  'True to their name, they really are friends and allies — fun to work with and they get shit done.',
  'Ti Chang', 'Co-founder';

-- EchoVision / AGIGA (new contact: Kevin Chou)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  '18a0d159-d808-48e1-8ac8-26bd2d0583b6',
  'b78953e2-49a1-4858-b584-e6eab74c22c5',
  c.id,
  'Wow! This is brilliant! Perfect! I was particularly impressed with the flow and the audio description felt very natural at the right times. It is very clear and obvious that this was made by, with, and for blind.',
  'Kevin Chou', 'Chief Visionary'
FROM contacts c WHERE c.first_name = 'Kevin' AND c.last_name = 'Chou' AND c.client_id = 'b78953e2-49a1-4858-b584-e6eab74c22c5' LIMIT 1;

-- Groove Thing (new contact: Michael Weiss-Malik)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  '219877de-b0ad-4a6d-a378-1b8fc357c81e',
  '554f08a0-26c9-4cef-9426-5ace813ddc77',
  c.id,
  'Six thumbs way up from team GrooveThing',
  'Michael Weiss-Malik', 'Co-Founder'
FROM contacts c WHERE c.first_name = 'Michael' AND c.last_name = 'Weiss-Malik' AND c.client_id = '554f08a0-26c9-4cef-9426-5ace813ddc77' LIMIT 1;

-- Brezi (new contact: Jackson Hung)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  '4de9f8ec-642b-4262-9448-66289be06161',
  '40a3d75d-41f4-497a-8d5c-17422ea44adf',
  c.id,
  'Great',
  'Jackson Hung', 'Founder'
FROM contacts c WHERE c.first_name = 'Jackson' AND c.last_name = 'Hung' AND c.client_id = '40a3d75d-41f4-497a-8d5c-17422ea44adf' LIMIT 1;

-- Lumen OG (existing contact: Dror Cedar)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  '729d0fdb-e0dd-4ff9-9a6a-3ef7be67d31f',
  '1915733b-9087-44e6-af49-e16dff18ecd7',
  'eb6f55db-527e-4cb9-b5b3-33d33347b7d5',
  'One of the most talented and creative teams I''ve ever met.',
  'Dror Cedar', 'CEO';

-- Lumos (lumos2) (existing contact: Eu-wen Ding)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  '5d07d20c-595d-4e1d-a8e6-b54ca19751d2',
  '388a2d0d-7eb6-4511-abec-172ac3f70620',
  'e717527c-a071-4042-afe2-7d99a861ebd5',
  '11/10 happy.',
  'Eu-wen Ding', 'Founder and CEO';

-- Woof (new contact: Miles Pepper)
INSERT INTO testimonials (id, project_id, client_id, contact_id, quote, person_name, person_title)
SELECT gen_random_uuid(),
  'f6c7f696-7815-4583-9835-48bd3d9ea0fb',
  'a34a44a8-326e-45fd-b180-2196c9baeee9',
  c.id,
  'ooohwee! DUUUUDE!!!!!! YEEES',
  'Miles Pepper', 'Director of Brand Marketing'
FROM contacts c WHERE c.first_name = 'Miles' AND c.last_name = 'Pepper' AND c.client_id = 'a34a44a8-326e-45fd-b180-2196c9baeee9' LIMIT 1;

-- 3. Clear client_quote on all 8 projects
UPDATE projects SET client_quote = NULL WHERE id IN (
  '014aa07e-512d-45d0-b789-61225b2f0d76',
  'c331d4c8-0fbf-48e0-867f-921c3b9a71f4',
  '18a0d159-d808-48e1-8ac8-26bd2d0583b6',
  '219877de-b0ad-4a6d-a378-1b8fc357c81e',
  '4de9f8ec-642b-4262-9448-66289be06161',
  '729d0fdb-e0dd-4ff9-9a6a-3ef7be67d31f',
  '5d07d20c-595d-4e1d-a8e6-b54ca19751d2',
  'f6c7f696-7815-4583-9835-48bd3d9ea0fb'
);

COMMIT;
