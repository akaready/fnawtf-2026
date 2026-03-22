# Script Share — Comment Presence Indicators

**Date:** 2026-03-20
**Branch:** fix/script-share-comments
**Scope:** Share view only (`/src/app/s/[token]/`)

---

## Context

In the script share/presentation view, comments exist per-beat but there's no way to tell at a glance which scenes or beats have comments waiting — other than the count shown inside the paranotes section of the beat itself. Reviewers (and admins) need a way to scan the whole script and quickly spot where feedback has been left.

This spec adds three complementary amber indicators, all driven by a single pre-fetched comment count map.

---

## Data Layer

### New server action: `getCommentCounts`

**File:** `src/app/s/[token]/actions.ts`

```ts
export async function getCommentCounts(shareId: string): Promise<Record<string, number>>
```

- Queries `script_share_comments` grouped by `beat_id`, filtered by `share_id` and `deleted_at IS NULL`
- Returns `{ [beatId]: count }` — zero entries omitted (absence = no comments)
- One DB call at page load; replaces nothing (the per-beat `getComments` for the sidebar is unchanged)

### Loading in the view

**File:** `src/app/s/[token]/ScriptPresentationView.tsx`

- New state: `const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});`
- Fetch on mount via `useEffect(() => { getCommentCounts(shareId).then(setCommentCounts); }, [shareId]);`
- After a comment is added: optimistically increment `commentCounts[beatId]` rather than re-fetching. This is triggered via a new `onCommentAdded` prop on `CommentSidebar`.

---

## Indicator 1 — Scene Sidebar

**Files:** `SceneNav.tsx`, `SceneListItem.tsx`

Both receive an optional `commentCounts?: Record<string, number>` prop (optional so admin usages are unaffected).

### SceneNav → SceneListItem pass-through

`SceneNav` passes `commentCounts` through when mapping scenes to `SceneListItem`.

### SceneListItem changes

**Scene-level dot** — shown when any beat in the scene has comments:

```tsx
const hasComments = beats?.some(b => (commentCounts?.[b.beatId] ?? 0) > 0) ?? false;
```

Rendered as a small amber dot (`w-2 h-2 rounded-full bg-amber-400`) to the right of the info column, inside the scene row container.

**Beat-pill dot** — shown on individual beat pills:

Each `BeatNav` item gains `hasComment: boolean`. Rendered as a `w-1.5 h-1.5 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 border border-admin-bg-sidebar` overlay on the beat pill button.

`BeatNav` interface gains:
```ts
hasComment?: boolean;
```

---

## Indicator 2 — Timeline

**File:** `src/app/admin/scripts/_components/ScriptPresentationTimeline.tsx`

Receives optional `commentCounts?: Record<string, number>` prop.

In the beat-mark render, add a condition:

```tsx
const hasComment = (commentCounts?.[slide.beatId] ?? 0) > 0;
```

- Regular beat (no comment): `w-1 h-1 rounded-full bg-[#444]` (unchanged)
- Beat with comment: `w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.6)]`
- Current beat takes priority over amber (white dot as today)

---

## Indicator 3 — Scene Header Row

**File:** `src/app/s/[token]/ScriptPresentationView.tsx`

Inside the existing scene header `<div>` (the `bg-[#141414] h-[44px]` row), add to the right side:

```tsx
{(commentCounts[current.beatId] ?? 0) > 0 && (
  <div className="flex items-center gap-1.5 flex-shrink-0 mr-3">
    <div className="w-2 h-2 rounded-full bg-amber-400" />
    <span className="text-admin-sm text-admin-text-muted">
      {commentCounts[current.beatId]} {commentCounts[current.beatId] === 1 ? 'comment' : 'comments'}
    </span>
  </div>
)}
```

Placed between the scene heading text and the right edge of the header row (before `flex-1` truncation). Disappears when the current beat has no comments.

---

## Component Change Summary

| File | Change |
|------|--------|
| `src/app/s/[token]/actions.ts` | Add `getCommentCounts(shareId)` |
| `src/app/s/[token]/ScriptPresentationView.tsx` | Fetch counts on mount; pass to SceneNav, Timeline, header row; optimistically increment count in existing `handleCommentSubmit` |
| `src/app/admin/scripts/_components/SceneNav.tsx` | Accept + pass through optional `commentCounts` |
| `src/app/admin/scripts/_components/SceneListItem.tsx` | Accept `commentCounts`; add scene-level dot; add `hasComment` flag to `BeatNav`; render beat-pill dot |
| `src/app/admin/scripts/_components/ScriptPresentationTimeline.tsx` | Accept `commentCounts`; color beats with comments amber |

All new props are optional — no breaking changes to admin usages.

---

## Verification

1. Load a share URL that has comments on some beats
2. **Sidebar**: Scene rows with commented beats show an amber dot; beat pills for those specific beats show a small overlay dot
3. **Timeline**: Beats with comments show amber marks; hovering still shows tooltip
4. **Header**: When navigating to a beat with comments, amber dot + count appears in the scene header; disappears on beats with no comments
5. **Live update**: Post a new comment → header count increments immediately; counts refresh on navigating back
6. **No regressions**: Admin script editor (`/admin/scripts`) — SceneNav and ScriptPresentationTimeline unchanged (no `commentCounts` passed)
7. `npx tsc --noEmit` passes clean
