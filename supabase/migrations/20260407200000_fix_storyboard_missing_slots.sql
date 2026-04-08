-- Fix storyboard frames that were copied between versions without their slot value.
-- Only assigns slot 1 to the MOST RECENT active frame per beat (where no slotted frame
-- already exists), avoiding unique constraint violations when multiple null-slot frames exist.
UPDATE script_storyboard_frames
SET slot = 1
WHERE id IN (
  SELECT DISTINCT ON (beat_id, script_id) id
  FROM script_storyboard_frames
  WHERE is_active = true
  AND slot IS NULL
  AND beat_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM script_storyboard_frames f2
    WHERE f2.beat_id = script_storyboard_frames.beat_id
    AND f2.script_id = script_storyboard_frames.script_id
    AND f2.is_active = true
    AND f2.slot IS NOT NULL
  )
  ORDER BY beat_id, script_id, created_at DESC
);
