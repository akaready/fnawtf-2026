# Script Share Flow — Complete Redesign

## Context

Meeting between founders defined a comprehensive redesign of the script share experience. The presentation view becomes the default share mode (not the table). New features include per-beat commenting, scene descriptions, an intro page, and a redesigned presentation layout. The table view remains as an option per share link.

---

## Phase 1: Database Schema Changes

### 1A. Scene description field
```sql
ALTER TABLE script_scenes ADD COLUMN scene_description TEXT;
```
Short 1-3 word descriptor (e.g., "intro hook", "features reveal"). Shown in square brackets in presentation and sidebar.

### 1B. Share link mode toggle
```sql
ALTER TABLE script_shares ADD COLUMN share_mode TEXT NOT NULL DEFAULT 'presentation';
-- Values: 'presentation' | 'table'
```

### 1C. Comments table
```sql
CREATE TABLE script_share_comments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id      UUID NOT NULL REFERENCES script_shares(id) ON DELETE CASCADE,
  beat_id       TEXT NOT NULL,
  viewer_email  TEXT NOT NULL,
  viewer_name   TEXT,
  content       TEXT NOT NULL,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  deleted_at    TIMESTAMPTZ,              -- soft delete
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_script_comments_share_beat ON script_share_comments(share_id, beat_id);
```
- `deleted_at` = soft delete (removed from UI, stored in DB)
- `is_admin` = whether comment was from an admin (for avatar display later)
- RLS: anon can INSERT + SELECT (where `deleted_at IS NULL`), authenticated full access

### 1D. Avatars via email matching
No new profiles table needed. When rendering comments, look up the commenter's email in the `contacts` table to find `headshot_url`. Works for admins (who have contact records) and clients (if they have records). Fallback: Lucide `User` icon in a circle (simple default avatar).

**Files:**
- `supabase/migrations/YYYYMMDD_script_share_v2.sql`
- `src/types/scripts.ts` — update `ScriptSceneRow` + add `ScriptShareCommentRow` + update `ScriptShareRow`

---

## Phase 2: Intro/Start Page

Before any content (both presentation and table mode), show an intro page modeled after the proposal welcome flow.

### Layout:
```
┌─────────────────────────────────────┐
│                                     │
│       [FNA logo]  /  [Client logo]  │
│                                     │
│          PROJECT NAME               │  (eyebrow)
│        Script Title                 │  (display font, large)
│             v1                      │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   What to Look For          │   │
│   │   notes from admin...       │   │
│   └─────────────────────────────┘   │
│                                     │
│          [ Begin ]                  │
│                                     │
└─────────────────────────────────────┘
```

- Reuses the existing login page dark aesthetic
- After clicking "Begin", transitions to presentation or table view based on `share_mode`
- Remove "what to look for" from the table-style share header (now on intro page)

**Files:**
- `src/app/s/[token]/ScriptShareIntro.tsx` — new client component
- `src/app/s/[token]/ScriptShareClient.tsx` — add intro state gate
- `src/app/s/[token]/page.tsx` — pass share mode to client

---

## Phase 3: Presentation Mode Redesign

The presentation becomes the primary share experience. Major layout changes:

### 3A. Three-zone layout
```
┌──────┬──────────────────────────┬──────────┐
│Scene │                          │ Comments │
│Nav   │   Storyboard Image       │ History  │
│      │   (with nav arrows       │          │
│101   │    overlaid on image)    │ Name 3pm │
│ Hook │                          │ "looks   │
│201   │                          │  great"  │
│ Feat │──────────────────────────│          │
│      │ AUDIO (full width, big)  │          │
│      │──────────────────────────│          │
│      │ VISUAL  │ NOTES │ REF   │          │
│      │──────────────────────────│          │
│      │  [ Write your comment ]  │          │
│      │              [Submit]    │          │
└──────┴──────────────────────────┴──────────┘
```

### 3B. Beat content layout changes
- **Audio**: full width, larger text — most important field for client review
- **Visual, Notes, Reference**: three equal columns below audio
- **Reference images**: small thumbnails, click to open lightbox
- **Column toggle dots**: default ALL ON, keep dots for discovery but don't encourage toggling
- If a field is empty, show empty space (don't collapse — layout stays consistent between beats)

### 3C. Scrolling spotlight effect (FOLLOW-UP — not initial pass)
Ship the three-zone layout first with standard one-beat-at-a-time navigation (arrows/timeline/keyboard). Add the scrolling spotlight (gradient peek at prev/next beats) as a follow-up once comments and layout are working.

Future spec:
- Current beat fully visible and highlighted
- Peek at previous/next beats with gradient mask fading to black
- Scrolling moves spotlight up/down
- Timeline bar still shows horizontal position

### 3D. Navigation arrows
- Move from beside sidebars to overlay ON the storyboard image
- Left/right sides, vertical middle of image
- Semi-transparent, appear on hover (same chrome auto-hide pattern)

### 3E. Left sidebar — Scene navigation (collapsible)
- Matches admin editor sidebar pattern
- Shows: scene number (101), location slug, scene description in brackets
- Toggle between showing slug vs description (or show both since there's room)
- Day/night tag on separate line
- Click to jump to scene
- Collapse/expand button

### 3F. Right sidebar — Comment history (collapsible)
- Shows comments for the CURRENT beat only
- Each comment: avatar (headshot via email match to contacts, fallback to initials), first name, Pacific Time timestamp (always PT, not viewer's local TZ — use `toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })`), colon, comment text
- Newest comments at top
- Own comments (matched by email): pencil (inline edit — replaces text with textarea + save/cancel) + trash (two-state delete) on hover
- Deleted comments: `deleted_at` set, removed from UI, stored in DB
- Collapse/expand button

### 3G. Bottom — Comment input
- Centered below beat content
- Large, inviting textarea placeholder: "Share your feedback on this frame..."
- Submit button
- Comments are per-beat (tied to `beat_id`)
- Uses logged-in viewer's name/email from cookie

### 3H. Scene heading improvements
- Fix extra period bug: `INT. BEDROOM. — DAY` should be `INT. BEDROOM — DAY`
- Scene descriptions in square brackets: `101  INT. BEDROOM — DAY  [intro hook]`
- Slightly larger scene headings for clarity

**Files:**
- `src/app/s/[token]/ScriptPresentationView.tsx` — new component (redesigned presentation for share pages)
- `src/app/s/[token]/CommentSidebar.tsx` — right sidebar
- `src/app/s/[token]/CommentInput.tsx` — bottom input
- `src/app/s/[token]/actions.ts` — add comment CRUD actions
- `src/app/admin/scripts/_components/ScriptPresentation.tsx` — fix scene heading period bug
- `src/app/admin/scripts/_components/ScriptSceneHeader.tsx` — add scene_description display + edit field
- `src/app/admin/scripts/_components/presentationUtils.ts` — add scene_description to PresentationSlide

---

## Phase 4: Share Panel Updates

### 4A. Share mode toggle
Add a mode selector per share link in the detail pane:
- "Presentation" (default) — shows storyboard presentation
- "Script Table" — shows current table view
- Stored as `share_mode` on `script_shares`

### 4B. Scene description editing
Add `scene_description` field to `ScriptSceneHeader.tsx` edit mode:
- Text input, short, shown below the main slug line
- Placeholder: "Scene description (1-3 words)"

**Files:**
- `src/app/admin/scripts/_components/ScriptSharePanel.tsx` — add mode toggle
- `src/app/admin/scripts/_components/ScriptSceneHeader.tsx` — add description field
- `src/app/admin/actions.ts` — add scene description to updateScene

---

## Phase 5: Comment Server Actions

```ts
// In src/app/s/[token]/actions.ts
export async function addComment(shareId, beatId, viewerEmail, viewerName, content)
export async function updateComment(commentId, viewerEmail, content)
export async function deleteComment(commentId, viewerEmail) // soft-delete
export async function getComments(shareId, beatId) // excludes deleted
```

All comments are scoped to a share + beat combination. Viewer can only edit/delete their own (matched by email).

**Files:**
- `src/app/s/[token]/actions.ts` — comment CRUD
- `src/types/scripts.ts` — `ScriptShareCommentRow` type

---

## Phase 6: Wire It All Together

### 6A. Share page routing
`src/app/s/[token]/page.tsx` flow:
1. Check cookie → redirect to login if missing
2. Fetch share data (includes `share_mode`)
3. Show intro page (ScriptShareIntro)
4. On "Begin" → render presentation view or table view based on mode

### 6B. Data flow
- `getScriptShareData()` needs to also return `share_mode` and scene descriptions
- Comments fetched per-beat as user navigates (not all at once)

---

## Implementation Order

### Pass 1: Foundation
1. **Migration** — scene_description, share_mode, comments table
2. **Types** — update ScriptSceneRow, ScriptShareRow, add ScriptShareCommentRow
3. **Scene description** — admin edit field in ScriptSceneHeader + updateScene action
4. **Scene heading bug fix** — remove extra period in presentation + scene header
5. **Share mode toggle** — admin panel field + pass through to share page

### Pass 2: Intro + Presentation Layout
6. **Intro page** — ScriptShareIntro component with logos, title, notes, Begin button
7. **Presentation redesign** — ScriptPresentationView with three-zone layout (audio full-width, visual/notes/ref three columns, nav arrows on image)
8. **Scene sidebar (left)** — collapsible, scene numbers + slugs + descriptions
9. **Remove "what to look for"** from table-style header (now on intro page)

### Pass 3: Comments
10. **Comment server actions** — addComment, updateComment, deleteComment, getComments + avatar lookup via email→contacts
11. **Comment input (bottom)** — textarea + submit, tied to current beat
12. **Comment sidebar (right)** — collapsible history, per-beat, with edit/delete/avatars

### Follow-up (separate session)
13. **Scrolling spotlight** — gradient masks + focused beat highlighting + continuous scroll

## Verification

- `npx tsc --noEmit` passes
- Admin: edit scene descriptions in scene header
- Admin: toggle share mode in share panel
- Share page: intro screen with logos, title, notes, Begin button
- Presentation: left sidebar (scenes), right sidebar (comments), bottom input
- Comments: add, edit, delete (soft), newest first
- Audio full width, visual/notes/ref three columns below
- Gradient peek at prev/next beats
- Navigation arrows overlay on image
- Scene headings: no extra period, description in brackets
