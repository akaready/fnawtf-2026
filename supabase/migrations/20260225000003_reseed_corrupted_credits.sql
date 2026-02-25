-- Reseed ALL credits for projects with corrupted/merged data
DO $$
DECLARE
  pid uuid;
BEGIN

  SELECT id INTO pid FROM projects WHERE slug = 'tilt-5-five';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Cast', 'Baily Hopkins', 3),
      (pid, 'Cast', 'Jeri Ellsworth', 4);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'tidbyt-gen2';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Steve Griggs', 3),
      (pid, 'Key Grip', 'Nicholas Yee', 4),
      (pid, 'Production Assistant', 'Brian Satterwhite', 5),
      (pid, 'Jingle Mix', 'Matt Crawford', 6),
      (pid, 'Narrator', 'Ol'' Richie', 7),
      (pid, 'Cast', 'Kot Takahashi', 8),
      (pid, 'Cast', 'Natalia Dominguez', 9),
      (pid, 'Cast', 'Danny Scott', 10);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'lumen';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Producer', 'Aiyana Donske', 3),
      (pid, 'Still Photographer', 'Zachariah Epperson', 4),
      (pid, 'Gaffer', 'Clay Kerri', 5),
      (pid, 'Hair + Makeup', 'Antoinette Yoka', 6),
      (pid, 'Food Stylist', 'Huxley McCorkle', 7),
      (pid, 'Studio Teacher', 'Dawn Maurer', 8),
      (pid, 'Production Assistant', 'Noelle McHenry', 9),
      (pid, 'VFX / GFX', 'Spencer Siebert', 10),
      (pid, 'Color Correction', 'Cory Berendzen', 11),
      (pid, 'Narrator', 'Kimberly Adams', 12),
      (pid, 'Cast', 'Marisa Thatcher', 13),
      (pid, 'Cast', 'Kot Takahashi', 14),
      (pid, 'Cast', 'Valerie Quade', 15),
      (pid, 'Cast', 'Jackson Audant', 16),
      (pid, 'Cast', 'Vasilisa Badecka', 17);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'bread';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Flemming Laursen', 3),
      (pid, 'Key Grip', 'Lance Gegner', 4),
      (pid, 'Second Unit D.P.', 'Colin Trenbeath', 5),
      (pid, 'Food Stylist', 'Laura Hoang', 6),
      (pid, 'Color Correction', 'Cory Berendzen', 7),
      (pid, 'Cast', 'Jataun Gilbert', 8),
      (pid, 'Cast', 'Alex Phillips', 9);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'talobrush';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Clay Kerri', 3),
      (pid, 'Key Grip', 'Nicholas Gomez', 4),
      (pid, 'Location Sound', 'Grant Goodrich', 5),
      (pid, 'Assistant Camera', 'Rikuto Sekiguchi', 6),
      (pid, 'Still Photographer', 'Nathan Weyland', 7),
      (pid, 'Production Assistant', 'Chelsea Smith', 8),
      (pid, 'Editor', 'Frazier Phillips', 9),
      (pid, 'Color Correction', 'Sean Wells', 10),
      (pid, 'Sound Design + Mix', 'Matt Tammariello', 11),
      (pid, 'Cast', 'Baily Hopkins', 12),
      (pid, 'Cast', 'Dawn Livingston', 13),
      (pid, 'Cast', 'Moon Tomaszewski', 14),
      (pid, 'Cast', 'Pancho Morris', 15),
      (pid, 'Cast', 'Mariana Aroxa', 16);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'tilt-5';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Producer', 'Aiyana Donske', 3),
      (pid, 'Drone Operator', 'Zubeyir Mentese', 4),
      (pid, 'Still Photographer', 'Whitney Freedman', 5),
      (pid, 'Photo Assistant', 'James Williamson', 6),
      (pid, 'Gaffer / Jib Operator', 'Clay Kerri', 7),
      (pid, 'Hair + Makeup', 'Antoinette Yoka', 8),
      (pid, 'VFX', 'John Filipkowski', 9),
      (pid, 'Sound Design', 'Adam Myatt', 10),
      (pid, 'Color', 'Cory Berendzen', 11),
      (pid, 'Color', 'Brandon Thomas', 12),
      (pid, 'Narrator', 'Kimberly Adams', 13),
      (pid, 'Cast', 'Kai Liu', 14),
      (pid, 'Cast', 'Pancho Morris', 15),
      (pid, 'Cast', 'Baily Hopkins', 16),
      (pid, 'Cast', 'Drew Watkins', 17),
      (pid, 'Cast', 'James Carr-Nelson', 18),
      (pid, 'Cast', 'Dawn Livingston', 19);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'erie';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Production Manager', 'Nizhoni Ellenwood', 3),
      (pid, 'Gaffer', 'Clay Kerri', 4),
      (pid, 'Key Grip', 'Aiyana Donske', 5),
      (pid, 'Location Sound', 'Brandon Reaper', 6),
      (pid, 'Hair + Makeup', 'Antoinette Yoka', 7),
      (pid, 'Production Assistant', 'Noelle McHenry', 8),
      (pid, 'VFX / GFX', 'Spencer Siebert', 9),
      (pid, 'Color Correction', 'Dan Edwards', 10),
      (pid, 'Cast', 'Baily Hopkins', 11),
      (pid, 'Cast', 'Kai Liu', 12),
      (pid, 'Cast', 'Saisha Teagues', 13);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'otherlab';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Still Photographer', 'Zachariah Epperson', 3),
      (pid, 'Gaffer', 'Ryan Nelson', 4),
      (pid, 'Pedicab Operator', 'Jorge Olascoaga', 5),
      (pid, 'Pedicab Provider', 'Shadrach Close', 6),
      (pid, 'Production Assistant', 'Logan Murray', 7),
      (pid, 'Production Assistant', 'Bryce Myrah', 8),
      (pid, 'Cast', 'Adrianne Recidoro', 9),
      (pid, 'Cast', 'Derrick Virassammy', 10);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'seismic';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Producer + Editor', 'Frazier Phillips', 3),
      (pid, 'Gaffer', 'Clay Kerri', 4),
      (pid, 'Key Grip', 'Nick Vaughn', 5),
      (pid, 'Assistant Camera', 'Rikuto Sekiguchi', 6),
      (pid, 'Production Assistant', 'Raz Swimmer', 7),
      (pid, 'Production Assistant', 'Ryan Reichert', 8),
      (pid, 'Color Correction', 'Sean Wells', 9),
      (pid, 'Sound Design + Mix', 'Matt Tammariello', 10),
      (pid, 'Visual FX', 'Trever Stewart', 11),
      (pid, 'Cast', 'Bob Copani', 12),
      (pid, 'Narrator', 'Nathan Emley', 13);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'crave';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Ryan Moore', 3),
      (pid, 'Key Grip', 'Aiyana Donske', 4),
      (pid, 'Still Photographer', 'Whitney Freedman', 5),
      (pid, 'Photo Assistant', 'James Williamson', 6),
      (pid, 'Hair + Makeup', 'Antoinette Yoka', 7),
      (pid, 'Cast', 'Ti Chang', 8),
      (pid, 'Cast', 'Claudia Lorraine', 9),
      (pid, 'Cast', 'Kathryn Herrerias', 10),
      (pid, 'Cast', 'Valarie Algee', 11);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'tidbyt';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Clay Kerri', 3),
      (pid, 'Production Assistant', 'Logan Murray', 4),
      (pid, 'Jingle Composer', 'Brian Satterwhite', 5),
      (pid, 'Jingle Mix', 'Matt Crawford', 6),
      (pid, 'Vocalist', 'Hahns Shin', 7),
      (pid, 'Vocalist', 'Wenley Tong', 8),
      (pid, 'Vocalist', 'Selina Sun', 9),
      (pid, 'Vocalist', 'Michael Khor', 10),
      (pid, 'Narrator', 'Andy Loud', 11),
      (pid, 'Cast', 'Mariana Aroxa', 12),
      (pid, 'Cast', 'James Carr-Nelson', 13);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'lumos';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Still Photographer', 'Whitney Freedman', 3),
      (pid, 'Assistant Camera', 'Rikuto Sekiguchi', 4),
      (pid, 'Production Assistant', 'Chelsea Smith', 5),
      (pid, 'Production Assistant', 'Tony Belmontes', 6),
      (pid, 'Color Correction', 'Sean Wells', 7),
      (pid, 'Sound Design + Original Music', 'Matt Tammariello', 8),
      (pid, 'Cast', 'Adam Long', 9);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'tilt5-og';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Ryan Nelson', 3),
      (pid, 'Key Grip', 'Nicholas Gomez', 4),
      (pid, 'Location Sound', 'Grant Goodrich', 5),
      (pid, 'Assistant Camera', 'Michael Jarrett', 6),
      (pid, 'Still Photographer', 'Kaitlyn Miller', 7),
      (pid, 'Production Assistant', 'Frank Padilla', 8),
      (pid, 'Editor', 'Frazier Phillips', 9),
      (pid, 'VFX', 'John Filipkowski', 10),
      (pid, 'Color Correction', 'Sean Wells', 11),
      (pid, 'Sound Design + Mix', 'Matt Tammariello', 12),
      (pid, 'Original Music', 'Brian Satterwhite', 13),
      (pid, 'Score Mixed By', 'Matt Crawford', 14),
      (pid, 'Cast', 'Daniel Kypuros', 15),
      (pid, 'Cast', 'Marisa Darabi', 16),
      (pid, 'Cast', 'James Carr-Nelson', 17),
      (pid, 'Cast', 'Mariana Aroxa', 18);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'light-pong';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Andy Haney', 3),
      (pid, 'Production Assistant', 'Carla Pineda', 4),
      (pid, 'Color Correction', 'Dan Edwards', 5),
      (pid, 'Sound Design + Mix', 'Courtney Grace', 6),
      (pid, 'Narrator', 'Sam Mowry', 7),
      (pid, 'Cast', 'Wynton Odd', 8),
      (pid, 'Cast', 'Lauren Taylor', 9);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'lumos2';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Still Photographer', 'Whitney Freedman', 3),
      (pid, 'Assistant Camera', 'Michael Jarrett', 4),
      (pid, 'Production Assistant', 'Chelsea Smith', 5),
      (pid, 'Production Assistant', 'Frank Padilla', 6),
      (pid, 'Color Correction', 'Sean Wells', 7),
      (pid, 'Sound Design + Mix', 'Matt Tammariello', 8),
      (pid, 'Cast', 'Kseniya Yumasheva', 9),
      (pid, 'Cast', 'Josh Phillips', 10);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'negative';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Gaffer', 'Ryan Nelson', 3),
      (pid, 'Visual FX', 'John Christofferson', 4),
      (pid, 'Production Assistant', 'Christopher Olson', 5),
      (pid, 'Cast', 'Moon Tomaszewski', 6),
      (pid, 'Cast', 'Baily Hopkins', 7),
      (pid, 'Cast', 'Pancho Morris', 8),
      (pid, 'Cast', 'Elena Chavez', 9),
      (pid, 'Cast', 'Timothy Huls', 10);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'chip';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'David Blue Garcia', 2),
      (pid, 'Gaffer', 'Clay Kerri', 3),
      (pid, 'Location Sound + Mix', 'Shawn Doyle', 4),
      (pid, 'Production Assistant', 'Chelsea Smith', 5),
      (pid, 'VFX', 'John Christofferson', 6),
      (pid, 'VFX', 'Caeghan Meager', 7);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'lumen-og';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Location Sound', 'Matt Tammariello', 3),
      (pid, 'Assistant Camera', 'Rikuto Sekiguchi', 4),
      (pid, 'Production Assistant', 'Chelsea Smith', 5),
      (pid, 'Graphics', 'Miguel Rodrick & Eli Levine (Glass+Marker)', 6),
      (pid, 'Color Correction', 'Sean Wells', 7),
      (pid, 'Sound Design + Mix', 'Matt Tammariello', 8),
      (pid, 'Cast', 'Grace Ng', 9),
      (pid, 'Cast', 'Drew Watkins', 10),
      (pid, 'Cast', 'Katie Meinholt', 11);
  END IF;

  SELECT id INTO pid FROM projects WHERE slug = 'crave-og';
  IF pid IS NOT NULL THEN
    DELETE FROM project_credits WHERE project_id = pid;
    INSERT INTO project_credits (project_id, role, name, sort_order) VALUES
      (pid, 'Director', 'Ol'' Richie', 1),
      (pid, 'Director of Photography', 'Ready', 2),
      (pid, 'Cast', 'Baily Hopkins', 3),
      (pid, 'Cast', 'Kayla Madix', 4);
  END IF;

END $$;
