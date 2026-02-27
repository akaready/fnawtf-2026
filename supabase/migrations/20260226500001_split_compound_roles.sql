-- Split compound roles with '+' into separate roles and credits
-- Create missing individual roles
INSERT INTO roles (name) VALUES
  ('Copywriter'), ('Creative Director'), ('Jib Operator'),
  ('Sound Mix'), ('GFX')
ON CONFLICT (name) DO NOTHING;

-- Split each compound credit into two separate credits (same person, both roles)
-- See migration script for full procedural logic
