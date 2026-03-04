ALTER TABLE intake_submissions
ADD COLUMN IF NOT EXISTS budget_interacted boolean NOT NULL DEFAULT false;
