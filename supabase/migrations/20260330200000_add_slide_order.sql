ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS slide_order text[] NOT NULL DEFAULT ARRAY['welcome','process','approach','timeline','pricing','samples'];
