# Script Share Page — Implementation Plan

## Context

Published script versions (v1, v2, etc.) need to be shareable with clients via public links. Currently there's no way for external stakeholders to view scripts — they only exist in the admin. This feature mirrors the existing proposal share system (`/p/[slug]/`) but for scripts, providing a read-only view with the familiar table layout, column toggles, sidebar, and sizing controls.

---

## Route: `/s/[token]/`

Random 8-char tokens (e.g., `fna.wtf/s/a3f9c2e1`) — not slugs. Each share link is a separate record pointing to a specific published script version.

---

## Step 1: Database Migration

**File:** `supabase/migrations/YYYYMMDD000000_create_script_shares.sql`

```sql
CREATE TABLE script_shares (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id     UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,
  access_code   TEXT NOT NULL,
  notes         TEXT,                          -- "what to look for" per share
  label         TEXT NOT NULL DEFAULT '',       -- admin-facing label
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE script_share_views (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id         UUID NOT NULL REFERENCES script_shares(id) ON DELETE CASCADE,
  viewer_email     TEXT,
  viewer_name      TEXT,
  duration_seconds INTEGER,
  viewed_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_script_shares_token ON script_shares(token);
CREATE INDEX idx_script_shares_script ON script_shares(script_id);
CREATE INDEX idx_script_share_views_share ON script_share_views(share_id);

-- RLS: authenticated full access, anon can read active shares + insert views
ALTER TABLE script_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_share_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth full" ON script_shares FOR ALL TO authenticated USING (true);
CREATE POLICY "anon read active" ON script_shares FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "auth full" ON script_share_views FOR ALL TO authenticated USING (true);
CREATE POLICY "anon insert" ON script_share_views FOR INSERT TO anon WITH CHECK (true);
```

**No anon policies needed on script tables** — the public page uses `createServiceClient()` (bypasses RLS) after validating the share cookie at the app layer.

---

## Step 2: Types

**File:** `src/types/scripts.ts` — append:

```ts
export interface ScriptShareRow {
  id: string;
  script_id: string;
  token: string;
  access_code: string;
  notes: string | null;
  label: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScriptShareViewRow {
  id: string;
  share_id: string;
  viewer_email: string | null;
  viewer_name: string | null;
  duration_seconds: number | null;
  viewed_at: string;
}
```

---

## Step 3: Shared Auth Library

**Refactor** `src/lib/proposal/auth.ts` into a generic `src/lib/share/auth.ts` that both proposals and script shares use.

```ts
type ShareType = 'proposal' | 'script';

const PREFIXES: Record<ShareType, { cookie: string; path: string }> = {
  proposal: { cookie: 'proposal_auth_', path: '/p/' },
  script:   { cookie: 'script_auth_',   path: '/s/' },
};

export async function setShareAuthCookie(type: ShareType, slug: string, email: string, name?: string)
export async function getShareAuthCookie(type: ShareType, slug: string): Promise<{ email: string; name: string | null } | null>
export async function clearShareAuthCookie(type: ShareType, slug: string)
export function verifySharePassword(input: string, stored: string): boolean
```

- Same cookie settings: httpOnly, secure in prod, sameSite strict, 30-day expiry
- Cookie scoped to `/${path}/${slug}`
- Update existing proposal imports (`src/app/p/[slug]/page.tsx`, `src/app/p/[slug]/actions.ts`, `src/app/p/[slug]/login/page.tsx`) to use the new shared lib with `type: 'proposal'`
- Script share pages use `type: 'script'`
- Delete `src/lib/proposal/auth.ts` after migration (or re-export from shared for backwards compat)

---

## Step 4: Slack Notification

**File:** `src/lib/slack/notify.ts` — add `script_viewed` event type

- Header: "Script Viewed"
- Fields: script title, version label, viewer name/email, project name
- Routing: client slack channel (via scripts -> projects -> clients) or fallback to alerts

---

## Step 5: Admin Server Actions (CRUD)

**File:** `src/app/admin/actions.ts` — add:

- `getScriptShares(scriptId)` — list shares with view count
- `createScriptShare(scriptId)` — generate 8-char token + random access code
- `updateScriptShare(shareId, { label, notes, access_code, is_active })`
- `deleteScriptShare(shareId)` — hard delete

Token generation: `crypto.randomUUID().slice(0, 8)`

---

## Step 6: Admin Share Panel

**File:** `src/app/admin/scripts/_components/ScriptSharePanel.tsx`

PanelDrawer following existing panel patterns (ScriptSettingsPanel, ScriptStylePanel):
- List existing shares: token, label, view count, created date, active toggle
- "Create Share Link" button (only when script `is_published`)
- Per-share: editable label, access code, "What to Look For" notes textarea
- Copy link button (copies `fna.wtf/s/{token}`)
- Two-state delete (TwoStateDeleteButton)
- Active/inactive toggle

**Wire into `ScriptEditorClient.tsx`:**
- Add `showShare` state + panel render
- Add `Share2` icon toolbar button in right zone (next to existing panel buttons)
- Disable/hide when `!is_published`

---

## Step 7: Public Route — Login

**Files:**
- `src/app/s/[token]/login/page.tsx` — server component
- `src/app/s/[token]/login/ScriptLoginForm.tsx` — client component

Copy pattern from `src/app/p/[slug]/login/`:
- Fetch share metadata (join to scripts -> projects -> clients for title/client display)
- Login form: first name, last name, email, access code
- Call `verifyScriptShareAccess()` on submit
- Navigate to `/s/${token}` on success (synthetic link click)
- Header shows: "Script for {clientName}" + project title

---

## Step 8: Public Route — Server Actions

**File:** `src/app/s/[token]/actions.ts`

- `verifyScriptShareAccess(token, email, password, firstName?, lastName?)` — validates password, sets cookie (via shared auth lib with `type: 'script'`), inserts view, sends Slack notification
- `getScriptShareData(token)` — uses `createServiceClient()` to fetch script + scenes + beats + references + storyboard frames + characters + tags + locations + share notes
- `startScriptViewSession(shareId, viewerEmail)` — returns view ID
- `updateScriptViewDuration(viewId, seconds)` — heartbeat updates

---

## Step 9: Read-Only Script Components

New read-only versions of existing editor components — **no editing, no DnD, no CRUD**.

**Files under `src/app/s/[token]/`:**

1. **`ReadOnlyCanvas.tsx`** — simplified `ScriptEditorCanvas`:
   - Sticky column headers (no resize handles, no select-all)
   - Iterates scenes -> beats
   - Uses grid template from `gridUtils.ts` (imported from admin)
   - Collapsible scenes (click to toggle)

2. **`ReadOnlySceneHeader.tsx`** — scene number, INT/EXT, location, time of day (static)

3. **`ReadOnlyBeatRow.tsx`** — renders beat cells in grid:
   - Audio/visual/notes: render via `markdownToHtml` from `parseContent.ts` (already sanitized via DOMPurify)
   - Reference: display images in grid (no upload/delete)
   - Storyboard: display frame image (no generate/upload controls)

**Reuse directly (import from admin):**
- `ScriptColumnToggle` — works as-is
- `gridUtils.ts` — `getGridTemplate`, `getVisibleColumnKeys`, `getVisibleColumns`
- `parseContent.ts` — `markdownToHtml` for beat content rendering (uses DOMPurify)

**Modify existing:**
- `ScriptSceneSidebar` — add `readOnly?: boolean` prop. When true: no DnD, no delete buttons, no "New Scene" footer. Just clickable scene list. (Already has a `scratchpadMode` branch that's close to this.)

---

## Step 10: Main Share Viewer

**File:** `src/app/s/[token]/ScriptShareClient.tsx`

Layout:
```
+---------------------------------------------+
|           Title Header (centered)           |
|   Client Name . Project Title . v1          |
|       Project #1234                         |
|   +-------------------------------------+   |
|   |   "What to look for" notes          |   |
|   +-------------------------------------+   |
+---------------------------------------------+
| [sidebar] [width] .. * * * * * ..           |  <- toolbar
+------+--------------------------------------+
|Scene |                                      |
| 1    |   Read-only table canvas             |
| 2    |   (column toggles, sizing work)      |
| 3    |                                      |
| 4    |                                      |
+------+--------------------------------------+
```

- Dark theme (website tokens: `bg-black`, `text-foreground`, `border-border`)
- Column toggles persist in component state (not localStorage — each viewer independent)
- Container width toggle: same 4 states as editor
- Sidebar toggle: same as editor
- View duration heartbeat: 30s interval, pause on tab hidden

---

## Step 11: Main Page Server Component

**File:** `src/app/s/[token]/page.tsx`

- Check `getShareAuthCookie('script', token)` -> redirect to `/s/${token}/login` if missing
- Call `getScriptShareData(token)` -> redirect to login if null
- Generate metadata: `FNA.wtf . {scriptTitle}`
- Render `ScriptShareClient` with all data + viewer info

---

## Key Reuse Points

| Existing Code | Reuse For |
|---|---|
| `src/lib/proposal/auth.ts` | Refactor into shared `src/lib/share/auth.ts` |
| `src/app/p/[slug]/login/ProposalLoginForm.tsx` | Template for `ScriptLoginForm.tsx` |
| `src/app/p/[slug]/actions.ts` | Template for share actions (verify, view tracking) |
| `src/lib/supabase/service.ts` | `createServiceClient()` for public data fetch |
| `admin/scripts/_components/ScriptColumnToggle.tsx` | Import directly |
| `admin/scripts/_components/gridUtils.ts` | Import directly |
| `admin/scripts/_components/ScriptSceneSidebar.tsx` | Add `readOnly` prop |
| `src/lib/scripts/parseContent.ts` | `markdownToHtml` for read-only cells |
| `src/lib/slack/notify.ts` | Add `script_viewed` event |

---

## Verification

1. **TypeScript:** `npx tsc --noEmit` must pass clean
2. **Proposal regression:** Verify existing proposal login/viewing still works after auth refactor
3. **Migration:** Apply migration — verify tables created
4. **Admin flow:** Create share from published script -> copy link -> verify URL
5. **Login flow:** Visit `/s/{token}` -> redirected to login -> enter credentials -> view script
6. **Read-only view:** Column toggles, sidebar toggle, width toggle all work; no edit capabilities exposed
7. **View tracking:** Check `script_share_views` table for viewer entry + duration updates
8. **Slack:** Verify notification fires on first view
9. **Cookie scoping:** Verify different share tokens have independent cookies
