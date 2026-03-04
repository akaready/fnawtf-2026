-- Add prepared_date column to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS prepared_date date;
