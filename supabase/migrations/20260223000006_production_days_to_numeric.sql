-- Allow decimal production days (e.g., 2.5 days, 4.5 days)
ALTER TABLE projects
  ALTER COLUMN production_days TYPE numeric USING production_days::numeric;
