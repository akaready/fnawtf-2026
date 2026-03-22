# Script Comments Column — Design Spec

**Date:** 2026-03-20
**Status:** Approved

---

## Context

When scripts are shared with clients via the presentation/share system, reviewers leave comments on individual beats. Those comments currently live only in the share view — there's no way to see them while editing the script in the admin editor.

This feature adds a **Comments column** to the script editor, surfacing client feedback inline alongside the beats it refers to. It also fixes a foundational gap: share links currently always show the live script content, meaning clients could see in-progress edits. Share links must be locked to the version that existed when the link was created.

---

## Part 1: Version Snapshot System

### The Problem

`script_shares` only stores a `script_id`. The share page queries `script_beats` live, so any edits after a share is created are immediately visible to the client. There is no version pinning.

### The Solution — Script Duplication as Snapshot

When a share link is created:

1. **Duplicate the current script** via the existing `duplicateScriptCore()` function, creating a "published snapshot" with:
   - `major_version = nextMajorVersion` (next whole integer in the script group)
   - `minor_version = 0`
   - `is_published = true`
2. **Store the snapshot's script ID** in `script_shares.snapshot_script_id`
3. **Store the version number** in `script_shares.snapshot_major_version`
4. **Bump the working draft** to `v{nextMajor}.1` — editing continues there

The share page already reads beats by `script_id`. If `snapshot_script_id` is present, it reads from that instead. The return value of `getScriptShareData()` must include the resolved script ID (snapshot or live), and `page.tsx` passes it through to `ScriptShareClient` as it does today — no structural change to the data flow, only which ID is used.

**Editing the published version:** The snapshot is a real script record. An admin can navigate to it and make minor tweaks, which immediately flow through to the share link (no re-publish step required).

### Non-Interruption (existing shares)

Both new fields on `script_shares` are nullable. Existing shares have `snapshot_script_id = NULL` → the share page falls back to using `script_id` and reads live beats exactly as today. The c-rebro share and any other active links are completely unaffected.

### Version Number Convention

- **Whole numbers** (v1, v2, v3) = published/client-facing
- **Decimals** (v1.1, v1.2...) = working draft

When creating a share, the version bumps to the next whole number regardless of current minor version (e.g., v0.4 → v1, v1.3 → v2).

---

## Part 2: Comments Column

### Color

New design token: `--admin-cream` — warm off-white (`#f5f0e8`).

All 5 existing column semantic colors are taken (purple, blue, amber, red, green). Warm off-white is visually distinct from all of them and semantically appropriate: it reads as "external commentary" vs. the saturated colors of creative content columns.

Add to `globals.css` and map in `tailwind.config.ts` as `bg-admin-cream`, `text-admin-cream`, `border-admin-cream`.

### Column Definition

- **Key:** `'comments'`
- **Label:** `'Comments'`
- **Color dot:** `bg-admin-cream`
- **Position:** Rightmost — after storyboard in `KEYS` array
- **Default visibility:** `false` (opt-in, same as storyboard and reference)
- **Default width:** Wider than a text column (comments are multi-line)

### Column Header — Version Picker

The column header contains a version picker. Use **`AdminCombobox`** with `searchable={false}` and `nullable={false}` (per CLAUDE.md — all dropdowns use `AdminCombobox`). Position it left-aligned in the column header, consistent with how other column headers display their labels.

**Options format:** `{ id: share_id, label: 'v1 · Client Review Round 1' }` — version number + share label. If a major version has multiple shares, each share is its own option (allows viewing comments per-share within the same version).

**Default value:** The share (or first share) for the whole-number major version matching the current working draft. If editing v1.3 → default to the v1 share(s). If editing v3.2 → default to v3 share(s).

**Fallback when no share exists for current major:** Fall back to the most recent major version that has at least one share. If no shares exist at all, show the picker as disabled with label "No versions shared yet."

**Historical version indicator:** When the selected share belongs to a major version that does not match the current working draft's major version, the column header renders with a **cream background + dark text** (inverted from the normal dark header). This makes it unmistakably clear that historical comments are being viewed.

### Loading Share Data for the Picker

`script_shares` is currently queried by `script_id` only. The version picker needs shares across the **entire script group** (to show v1 comments while editing v3.2). Add a new server action `getScriptSharesByGroup(scriptGroupId: string)` that queries `script_shares` filtered by the group's script IDs (via a join or subquery on `scripts.script_group_id`). Return `id`, `label`, `snapshot_major_version`, `snapshot_script_id`, `is_active`.

`ScriptEditorClient` calls this action on mount (when the comments column is first enabled) and stores the share list in state.

### Comments Cell (per beat row)

- **Read-only** — no comment input in the editor. Commenting happens from the share link.
- Renders the flat comment thread for that beat: avatar, first name, PT timestamp, content — same layout as `CommentSidebar.tsx` in the share view.
- Empty beats show nothing (no placeholder clutter).

### Beat Position Matching

Comments reference snapshot beat IDs (the beats the reviewer saw). The working draft has different beat IDs (they were duplicated). To display comments in the correct row:

1. On picker selection, fetch the snapshot script's scenes + beats (a second script load by `snapshot_script_id`).
2. Build a position map: `Map<snapshotBeatId, { sceneIndex: number, beatIndex: number }>` using sort_order within each scene.
3. Each working draft beat row looks up its own position (`sceneIndex, beatIndex`) in the map and renders any comments whose snapshot beat maps to the same position.

**Fallback for mismatches:** If the draft has added or removed beats/scenes since the snapshot, some positions will not match. Unmatched comments (snapshot beat position has no corresponding draft beat) are silently dropped — they are not rendered. No error state. The reviewer's comment was on content that no longer exists at that position in the draft, so omitting it is the correct behavior. A developer should NOT attempt to show "orphaned" comments — this would add significant complexity for minimal value.

This position map must be recomputed whenever the selected share changes.

### `ScriptColumnToggle` Guard Update

The existing "prevent all columns off" guard hardcodes the 5 current column keys:

```ts
if (!next.audio && !next.visual && !next.notes && !next.reference && !next.storyboard) return;
```

This must be updated to include `comments`:

```ts
if (!next.audio && !next.visual && !next.notes && !next.reference && !next.storyboard && !next.comments) return;
```

---

## Data Model Changes

### `script_shares` table (Supabase migration)

```sql
ALTER TABLE script_shares
  ADD COLUMN snapshot_script_id UUID REFERENCES scripts(id) NULL,
  ADD COLUMN snapshot_major_version INT NULL;
```

Both columns nullable — existing rows are unaffected.

### `globals.css`

```css
--admin-cream: #f5f0e8;
```

### `tailwind.config.ts`

```ts
cream: 'var(--admin-cream)',
```

---

## Files to Modify

### Database / Actions
- `src/app/admin/actions.ts` — `createScriptShare()`: add snapshot duplication + version bump logic; add new `getScriptSharesByGroup(scriptGroupId)` action
- `src/app/s/[token]/actions.ts` — `getScriptShareData()`: if share has `snapshot_script_id`, use that as the script ID for all beat/scene queries
- `src/app/s/[token]/page.tsx` — update if `getScriptShareData()` return shape changes (passes resolved script ID to `ScriptShareClient`)

### Design Tokens
- `src/app/globals.css` — add `--admin-cream`
- `tailwind.config.ts` — map `cream` token

### Column System
- `src/app/admin/scripts/_components/gridUtils.ts` — add `'comments'` to `KEYS` array; add default fractional width for comments column
- `src/app/admin/scripts/_components/ScriptColumnToggle.tsx` — add cream dot; update "prevent all-off" guard to include `comments`
- `src/types/scripts.ts` — add `comments: boolean` to `ScriptColumnConfig`
- `src/app/admin/scripts/_components/ScriptEditorClient.tsx` — add `comments: false` to default config; fetch share list via `getScriptSharesByGroup` when column is enabled; manage selected share state
- `src/app/admin/scripts/_components/ScriptEditorCanvas.tsx` — add comments column header with version picker
- `src/app/admin/scripts/_components/ScriptBeatRow.tsx` — add comments cell; add cream left-border accent line

### New Components
- `src/app/admin/scripts/_components/ScriptCommentsCell.tsx` — read-only per-beat comment thread; accepts pre-resolved comments array as prop
- `src/app/admin/scripts/_components/ScriptCommentsVersionPicker.tsx` — `AdminCombobox`-based version picker with inverted-header state when viewing historical version

---

## Stage 2 (Out of Scope)

Clicking a commenter's name → opens their contact record in a side panel. The `viewer_email` on comments can be matched to `contacts.email`. Deferred to a future session.

---

## Verification

1. **TypeScript:** `npx tsc --noEmit` — must pass clean
2. **Create a share link** on a test script → confirm the working draft bumps to vN.1, a published snapshot exists in the script group at vN.0, `snapshot_script_id` and `snapshot_major_version` are set on the share record
3. **View the share link** → confirm it shows snapshot content, not the current draft
4. **Edit the published snapshot** → confirm changes appear on the share link immediately
5. **Existing share link (c-rebro)** → confirm it still works (live beat fallback, `snapshot_script_id` is NULL)
6. **Comments column toggle** → cream dot appears in column toggle strip; column shows/hides correctly; "prevent all-off" guard works
7. **Version picker** → lists shares across the script group; defaults to current major version's share; switching versions updates displayed comments; inverted header appears when viewing non-current major version; disabled state shown when no shares exist
8. **Comment thread display** → comments left on a share appear in the correct beat row in the editor; beats added to the draft after the snapshot show no comments (correct); no orphaned comment errors
