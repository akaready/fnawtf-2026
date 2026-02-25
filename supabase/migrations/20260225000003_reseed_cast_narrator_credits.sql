-- Re-seed Cast and Narrator credits from seed-projects.json
-- This migration deletes existing Cast/Narrator rows and re-inserts them per project.

DO $$
DECLARE
  pid uuid;
BEGIN

  -- Project: tilt-5-five
  SELECT id INTO pid FROM projects WHERE slug = 'tilt-5-five';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Baily Hopkins', 3),
      (pid, 'Cast', 'Jeri Ellsworth', 4);
  END IF;

  -- Project: tidbyt-gen2
  SELECT id INTO pid FROM projects WHERE slug = 'tidbyt-gen2';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Narrator', 'Ol'' Richie', 7),
      (pid, 'Cast', 'Kot Takahashi', 8),
      (pid, 'Cast', 'Natalia Dominguez', 9),
      (pid, 'Cast', 'Danny Scott', 10);
  END IF;

  -- Project: lumen
  SELECT id INTO pid FROM projects WHERE slug = 'lumen';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Narrator', 'Kimberly Adams', 12),
      (pid, 'Cast', 'Marisa Thatcher', 13),
      (pid, 'Cast', 'Kot Takahashi', 14),
      (pid, 'Cast', 'Valerie Quade', 15),
      (pid, 'Cast', 'Jackson Audant', 16),
      (pid, 'Cast', 'Vasilisa Badecka', 17);
  END IF;

  -- Project: daybreak
  SELECT id INTO pid FROM projects WHERE slug = 'daybreak';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Kai Liu', 4),
      (pid, 'Cast', 'Lauren Lewis', 5),
      (pid, 'Cast', 'Rahul Vohra', 6),
      (pid, 'Cast', 'Danny Scott', 7);
  END IF;

  -- Project: bread
  SELECT id INTO pid FROM projects WHERE slug = 'bread';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Jataun Gilbert', 8),
      (pid, 'Cast', 'Alex Phillips', 9);
  END IF;

  -- Project: talobrush
  SELECT id INTO pid FROM projects WHERE slug = 'talobrush';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Baily Hopkins', 12),
      (pid, 'Cast', 'Dawn Livingston', 13),
      (pid, 'Cast', 'Moon Tomaszewski', 14),
      (pid, 'Cast', 'Pancho Morris', 15),
      (pid, 'Cast', 'Mariana Aroxa', 16);
  END IF;

  -- Project: tilt-5
  SELECT id INTO pid FROM projects WHERE slug = 'tilt-5';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Narrator', 'Kimberly Adams', 13),
      (pid, 'Cast', 'Kai Liu', 14),
      (pid, 'Cast', 'Pancho Morris', 15),
      (pid, 'Cast', 'Baily Hopkins', 16),
      (pid, 'Cast', 'Drew Watkins', 17),
      (pid, 'Cast', 'James Carr-Nelson', 18),
      (pid, 'Cast', 'Dawn Livingston', 19);
  END IF;

  -- Project: erie
  SELECT id INTO pid FROM projects WHERE slug = 'erie';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Baily Hopkins', 11),
      (pid, 'Cast', 'Kai Liu', 12),
      (pid, 'Cast', 'Saisha Teagues', 13);
  END IF;

  -- Project: nine-arches
  SELECT id INTO pid FROM projects WHERE slug = 'nine-arches';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Narrator', 'Sam Mowry', 10),
      (pid, 'Cast', 'Laura Altair', 11),
      (pid, 'Cast', 'Moon Tomaszewski', 12),
      (pid, 'Cast', 'Dawn Livingston', 13);
  END IF;

  -- Project: keyboardio
  SELECT id INTO pid FROM projects WHERE slug = 'keyboardio';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Narrator', 'Mike Vaugh', 7);
  END IF;

  -- Project: otherlab
  SELECT id INTO pid FROM projects WHERE slug = 'otherlab';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Adrianne Recidoro', 9),
      (pid, 'Cast', 'Derrick Virassammy', 10);
  END IF;

  -- Project: seismic
  SELECT id INTO pid FROM projects WHERE slug = 'seismic';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Bob Copani', 12),
      (pid, 'Narrator', 'Nathan Emley', 13);
  END IF;

  -- Project: crave
  SELECT id INTO pid FROM projects WHERE slug = 'crave';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Ti Chang', 8),
      (pid, 'Cast', 'Claudia Lorraine', 9),
      (pid, 'Cast', 'Kathryn Herrerias', 10),
      (pid, 'Cast', 'Valarie Algee', 11);
  END IF;

  -- Project: tidbyt
  SELECT id INTO pid FROM projects WHERE slug = 'tidbyt';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Narrator', 'Andy Loud', 11),
      (pid, 'Cast', 'Mariana Aroxa', 12),
      (pid, 'Cast', 'James Carr-Nelson', 13);
  END IF;

  -- Project: lumos
  SELECT id INTO pid FROM projects WHERE slug = 'lumos';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Adam Long', 9);
  END IF;

  -- Project: etcherlaser
  SELECT id INTO pid FROM projects WHERE slug = 'etcherlaser';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Val Garrahan', 13);
  END IF;

  -- Project: tilt5-og
  SELECT id INTO pid FROM projects WHERE slug = 'tilt5-og';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Daniel Kypuros', 15),
      (pid, 'Cast', 'Marisa Darabi', 16),
      (pid, 'Cast', 'James Carr-Nelson', 17),
      (pid, 'Cast', 'Mariana Aroxa', 18);
  END IF;

  -- Project: light-pong
  SELECT id INTO pid FROM projects WHERE slug = 'light-pong';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Narrator', 'Sam Mowry', 7),
      (pid, 'Cast', 'Wynton Odd', 8),
      (pid, 'Cast', 'Lauren Taylor', 9);
  END IF;

  -- Project: idem
  SELECT id INTO pid FROM projects WHERE slug = 'idem';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Joe Estlack', 9);
  END IF;

  -- Project: dabby
  SELECT id INTO pid FROM projects WHERE slug = 'dabby';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Mariana Aroxa', 10);
  END IF;

  -- Project: lumos2
  SELECT id INTO pid FROM projects WHERE slug = 'lumos2';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Kseniya Yumasheva', 9),
      (pid, 'Cast', 'Josh Phillips', 10);
  END IF;

  -- Project: negative
  SELECT id INTO pid FROM projects WHERE slug = 'negative';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Moon Tomaszewski', 6),
      (pid, 'Cast', 'Baily Hopkins', 7),
      (pid, 'Cast', 'Pancho Morris', 8),
      (pid, 'Cast', 'Elena Chavez', 9),
      (pid, 'Cast', 'Timothy Huls', 10);
  END IF;

  -- Project: lumen-og
  SELECT id INTO pid FROM projects WHERE slug = 'lumen-og';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Grace Ng', 9),
      (pid, 'Cast', 'Drew Watkins', 10),
      (pid, 'Cast', 'Katie Meinholt', 11);
  END IF;

  -- Project: crave-og
  SELECT id INTO pid FROM projects WHERE slug = 'crave-og';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid AND role IN ('Cast', 'Narrator');
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Cast', 'Baily Hopkins', 3),
      (pid, 'Cast', 'Kayla Madix', 4);
  END IF;

END $$;
