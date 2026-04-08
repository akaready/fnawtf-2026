-- Fix storyboard frames that were copied between versions without their slot value.
-- Assign slot 1 to active frames that have no slot, where no other active slotted
-- frame exists for the same beat+script combination.
UPDATE script_storyboard_frames f
SET slot = 1
WHERE f.is_active = true
AND f.slot IS NULL
AND f.beat_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM script_storyboard_frames f2
  WHERE f2.beat_id = f.beat_id
  AND f2.script_id = f.script_id
  AND f2.is_active = true
  AND f2.slot IS NOT NULL
);
