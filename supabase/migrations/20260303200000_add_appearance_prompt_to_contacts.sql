-- Move appearance_prompt to contacts table so it persists globally per cast member
-- (not regenerated each time they're assigned to a new character)
ALTER TABLE contacts ADD COLUMN appearance_prompt TEXT;
