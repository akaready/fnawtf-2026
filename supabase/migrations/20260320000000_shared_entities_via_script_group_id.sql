-- ============================================================================
-- Migration: Share script entities across versions via script_group_id
-- ============================================================================
-- Characters, locations, products, and tags move from per-version (script_id)
-- to per-group (script_group_id) so they're shared across all versions.
-- This eliminates cloning on new versions and keeps @-mention IDs stable.
-- ============================================================================

BEGIN;

-- ─── Step 1: Add script_group_id to all 4 entity tables ─────────────────────

ALTER TABLE script_characters ADD COLUMN script_group_id UUID;
ALTER TABLE script_tags       ADD COLUMN script_group_id UUID;
ALTER TABLE script_locations  ADD COLUMN script_group_id UUID;
ALTER TABLE script_products   ADD COLUMN script_group_id UUID;

-- ─── Step 2: Backfill from parent script ────────────────────────────────────

UPDATE script_characters sc
  SET script_group_id = s.script_group_id
  FROM scripts s WHERE sc.script_id = s.id;

UPDATE script_tags st
  SET script_group_id = s.script_group_id
  FROM scripts s WHERE st.script_id = s.id;

UPDATE script_locations sl
  SET script_group_id = s.script_group_id
  FROM scripts s WHERE sl.script_id = s.id;

UPDATE script_products sp
  SET script_group_id = s.script_group_id
  FROM scripts s WHERE sp.script_id = s.id;

-- ─── Step 3: Deduplicate entities within each group ─────────────────────────
-- For each (group, name) with duplicates, keep the entity from the newest
-- script version and rewrite @-mention references in beat content.

CREATE OR REPLACE FUNCTION _dedup_script_entities() RETURNS void AS $$
DECLARE
  rec RECORD;
  winner_id UUID;
  loser_id UUID;
  loser_ids UUID[];
BEGIN
  -- ── Characters: dedup by (script_group_id, lower(name)) ──
  FOR rec IN
    SELECT sc.script_group_id AS gid, lower(sc.name) AS lname,
           array_agg(sc.id ORDER BY s.major_version DESC, s.minor_version DESC, s.created_at DESC) AS ids
    FROM script_characters sc
    JOIN scripts s ON sc.script_id = s.id
    WHERE sc.script_group_id IS NOT NULL
    GROUP BY sc.script_group_id, lower(sc.name)
    HAVING count(*) > 1
  LOOP
    winner_id := rec.ids[1];
    loser_ids := rec.ids[2:];

    FOREACH loser_id IN ARRAY loser_ids LOOP
      -- Rewrite @-mentions in beat content: @[AnyName](loser) -> @[AnyName](winner)
      UPDATE script_beats SET
        audio_content  = regexp_replace(audio_content,  '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g'),
        visual_content = regexp_replace(visual_content, '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g'),
        notes_content  = regexp_replace(notes_content,  '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g')
      WHERE scene_id IN (
        SELECT ss.id FROM script_scenes ss
        JOIN scripts s ON ss.script_id = s.id
        WHERE s.script_group_id = rec.gid
      )
      AND (
        audio_content  LIKE '%' || loser_id::text || '%' OR
        visual_content LIKE '%' || loser_id::text || '%' OR
        notes_content  LIKE '%' || loser_id::text || '%'
      );

      -- Merge cast (skip conflicts)
      UPDATE script_character_cast SET character_id = winner_id
        WHERE character_id = loser_id
        AND contact_id NOT IN (SELECT contact_id FROM script_character_cast WHERE character_id = winner_id);
      DELETE FROM script_character_cast WHERE character_id = loser_id;

      -- Move reference images
      UPDATE script_character_references SET character_id = winner_id
        WHERE character_id = loser_id;

      -- Delete loser
      DELETE FROM script_characters WHERE id = loser_id;
    END LOOP;
  END LOOP;

  -- ── Locations: dedup by (script_group_id, lower(name)) ──
  FOR rec IN
    SELECT sl.script_group_id AS gid, lower(sl.name) AS lname,
           array_agg(sl.id ORDER BY s.major_version DESC, s.minor_version DESC, s.created_at DESC) AS ids
    FROM script_locations sl
    JOIN scripts s ON sl.script_id = s.id
    WHERE sl.script_group_id IS NOT NULL
    GROUP BY sl.script_group_id, lower(sl.name)
    HAVING count(*) > 1
  LOOP
    winner_id := rec.ids[1];
    loser_ids := rec.ids[2:];

    FOREACH loser_id IN ARRAY loser_ids LOOP
      -- Remap scene location_id references
      UPDATE script_scenes SET location_id = winner_id WHERE location_id = loser_id;

      -- Rewrite @-mentions
      UPDATE script_beats SET
        audio_content  = regexp_replace(audio_content,  '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g'),
        visual_content = regexp_replace(visual_content, '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g'),
        notes_content  = regexp_replace(notes_content,  '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g')
      WHERE scene_id IN (
        SELECT ss.id FROM script_scenes ss
        JOIN scripts s ON ss.script_id = s.id
        WHERE s.script_group_id = rec.gid
      )
      AND (
        audio_content  LIKE '%' || loser_id::text || '%' OR
        visual_content LIKE '%' || loser_id::text || '%' OR
        notes_content  LIKE '%' || loser_id::text || '%'
      );

      -- Move location options
      UPDATE script_location_options SET script_location_id = winner_id
        WHERE script_location_id = loser_id
        AND scene_id NOT IN (SELECT scene_id FROM script_location_options WHERE script_location_id = winner_id);
      DELETE FROM script_location_options WHERE script_location_id = loser_id;

      -- Move reference images
      UPDATE location_references SET location_id = winner_id
        WHERE location_id = loser_id;

      DELETE FROM script_locations WHERE id = loser_id;
    END LOOP;
  END LOOP;

  -- ── Products: dedup by (script_group_id, lower(name)) ──
  FOR rec IN
    SELECT sp.script_group_id AS gid, lower(sp.name) AS lname,
           array_agg(sp.id ORDER BY s.major_version DESC, s.minor_version DESC, s.created_at DESC) AS ids
    FROM script_products sp
    JOIN scripts s ON sp.script_id = s.id
    WHERE sp.script_group_id IS NOT NULL
    GROUP BY sp.script_group_id, lower(sp.name)
    HAVING count(*) > 1
  LOOP
    winner_id := rec.ids[1];
    loser_ids := rec.ids[2:];

    FOREACH loser_id IN ARRAY loser_ids LOOP
      -- Rewrite @-mentions
      UPDATE script_beats SET
        audio_content  = regexp_replace(audio_content,  '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g'),
        visual_content = regexp_replace(visual_content, '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g'),
        notes_content  = regexp_replace(notes_content,  '@\[([^\]]+)\]\(' || loser_id::text || '\)', '@[\1](' || winner_id::text || ')', 'g')
      WHERE scene_id IN (
        SELECT ss.id FROM script_scenes ss
        JOIN scripts s ON ss.script_id = s.id
        WHERE s.script_group_id = rec.gid
      )
      AND (
        audio_content  LIKE '%' || loser_id::text || '%' OR
        visual_content LIKE '%' || loser_id::text || '%' OR
        notes_content  LIKE '%' || loser_id::text || '%'
      );

      -- Move product references
      UPDATE product_references SET product_id = winner_id
        WHERE product_id = loser_id;

      DELETE FROM script_products WHERE id = loser_id;
    END LOOP;
  END LOOP;

  -- ── Tags: dedup by (script_group_id, slug) ──
  FOR rec IN
    SELECT st.script_group_id AS gid, st.slug,
           array_agg(st.id ORDER BY s.major_version DESC, s.minor_version DESC, s.created_at DESC) AS ids
    FROM script_tags st
    JOIN scripts s ON st.script_id = s.id
    WHERE st.script_group_id IS NOT NULL
    GROUP BY st.script_group_id, st.slug
    HAVING count(*) > 1
  LOOP
    winner_id := rec.ids[1];
    loser_ids := rec.ids[2:];

    FOREACH loser_id IN ARRAY loser_ids LOOP
      DELETE FROM script_tags WHERE id = loser_id;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT _dedup_script_entities();
DROP FUNCTION _dedup_script_entities();

-- ─── Step 4: Finalize schema ────────────────────────────────────────────────

-- Make NOT NULL
ALTER TABLE script_characters ALTER COLUMN script_group_id SET NOT NULL;
ALTER TABLE script_tags       ALTER COLUMN script_group_id SET NOT NULL;
ALTER TABLE script_locations  ALTER COLUMN script_group_id SET NOT NULL;
ALTER TABLE script_products   ALTER COLUMN script_group_id SET NOT NULL;

-- Add indexes
CREATE INDEX idx_script_characters_group ON script_characters(script_group_id);
CREATE INDEX idx_script_tags_group       ON script_tags(script_group_id);
CREATE INDEX idx_script_locations_group  ON script_locations(script_group_id);
CREATE INDEX idx_script_products_group   ON script_products(script_group_id);

-- Update unique constraint on tags
ALTER TABLE script_tags DROP CONSTRAINT script_tags_script_id_slug_key;
ALTER TABLE script_tags ADD CONSTRAINT script_tags_group_slug_key UNIQUE (script_group_id, slug);

-- Drop old FK constraints
ALTER TABLE script_characters DROP CONSTRAINT script_characters_script_id_fkey;
ALTER TABLE script_tags       DROP CONSTRAINT script_tags_script_id_fkey;
ALTER TABLE script_locations  DROP CONSTRAINT script_locations_script_id_fkey;
ALTER TABLE script_products   DROP CONSTRAINT script_products_script_id_fkey;

-- Drop old indexes
DROP INDEX IF EXISTS idx_script_characters_script;
DROP INDEX IF EXISTS idx_script_tags_script;

-- Drop old columns
ALTER TABLE script_characters DROP COLUMN script_id;
ALTER TABLE script_tags       DROP COLUMN script_id;
ALTER TABLE script_locations  DROP COLUMN script_id;
ALTER TABLE script_products   DROP COLUMN script_id;

COMMIT;
