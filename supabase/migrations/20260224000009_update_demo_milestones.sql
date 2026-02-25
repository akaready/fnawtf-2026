-- Update demo proposal milestones:
-- - Remove Pre-Production and Edit Rev 3
-- - Add "Due" suffix to script/edit revisions and finals
-- - Fix Final Script dates (was corrupted by a drag bug)
-- - Fix sort_order after deletions
-- - Add Go Live as the final milestone

-- Rename labels to add "Due" + fix Final Script dates
UPDATE public.proposal_milestones SET label = 'Script Rev 1 Due'   WHERE id = '90a86778-7109-4e12-acb2-656700583276';
UPDATE public.proposal_milestones SET label = 'Script Rev 2 Due'   WHERE id = '799b00f2-b61f-41b7-8a5f-5245bcaf7981';
UPDATE public.proposal_milestones SET label = 'Final Script Due', start_date = '2026-03-23', end_date = '2026-03-25' WHERE id = '52f5dbf9-1795-455b-b811-8ea7f6310de8';
UPDATE public.proposal_milestones SET label = 'Edit Rev 1 Due', sort_order = 5 WHERE id = '80e7465c-3774-48be-841e-2217ebf9b9dd';
UPDATE public.proposal_milestones SET label = 'Edit Rev 2 Due', sort_order = 6 WHERE id = '5f2b7d37-575f-4cd1-a821-cf7233cfb9ae';
UPDATE public.proposal_milestones SET label = 'Final Delivery Due', sort_order = 7 WHERE id = '21bb6996-ddd2-46d6-99b0-b257fbd3f406';
UPDATE public.proposal_milestones SET sort_order = 4 WHERE id = 'dccc52ce-518c-4362-9910-ec520c018ffb';

-- Delete Pre-Production and Edit Rev 3
DELETE FROM public.proposal_milestones WHERE id IN ('e0f2dcaf-8654-4a2e-bd46-86c9ba14cb87', '7ec06872-1633-4d7a-a895-f5e377c5e357');

-- Insert Go Live as the final milestone
INSERT INTO public.proposal_milestones (proposal_id, label, description, start_date, end_date, sort_order)
VALUES ('21eb9e91-c737-4675-a88d-3b9dff39aed9', 'Go Live', 'Your project launches to the world.', '2026-05-19', '2026-05-19', 8);
