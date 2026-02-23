-- Store the selected thumbnail frame time (in seconds) so hover previews
-- can start at the same frame as the thumbnail instead of the video midpoint.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_time real;
