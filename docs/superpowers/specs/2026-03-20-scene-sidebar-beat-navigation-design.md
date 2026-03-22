# Scene Sidebar Beat Navigation — Design Spec

**Date:** 2026-03-20
**Status:** Approved for implementation

---

## Problem

The scene sidebar lists scenes by number (101, 201, etc.) but gives no indication that some scenes contain multiple beats (A, B, C, D, E). In the presentation view, navigating to a specific beat requires clicking the scene row and then cycling forward/backward through beats. There is no single-click path to any beat other than A.

## Solution

Add a beat column to `SceneListItem` — the shared component used everywhere — that appears only on scenes with 2+ beats. Individual beat cells are directly clickable, jumping to that beat immediately.

---

## Visual Design

### Layout

`SceneListItem` becomes a **three-section flex row**:

```
[ scene number ] [ location info — flex:1 ] [ beat grid — flush right ]
```

The beat grid only renders when `beats.length >= 2`. Single-beat scenes are visually unchanged.

### Maintaining cross-row number alignment

`SceneListItem` currently uses `col-span-2 grid grid-cols-subgrid` to participate in the parent's `grid grid-cols-[auto_1fr]`, sharing the number column width across all rows. Switching to internal flexbox breaks this.

**Resolution:** Keep `col-span-2` on the root element (so it still spans both parent columns), switch the internal layout to `flex`, and give the scene number `<span>` a **fixed width of `w-[52px]`**. This preserves the visual alignment of numbers across rows without requiring subgrid. The beat grid's variable width does not affect number alignment.

### Beat Grid

- **Structure:** CSS grid, always 2 rows tall (`grid-template-rows: repeat(2, 1fr)`), growing horizontally via `grid-auto-flow: column` and `grid-auto-columns: 22px`
- **Flow:** A fills row 1 col 1, B fills row 2 col 1, C fills row 1 col 2, D fills row 2 col 2, E fills row 1 col 3 — beats stack vertically, max 2 per column, then a new column starts
- **Odd beat counts** get an invisible filler `<span>` to complete the 2-row column
- **Cell size:** 22px wide × 50% of row height (equal rows via `1fr`). Fixed width means letter glyph width has no effect on layout
- **Dividers:** `gap: 1px` + `bg-admin-border-subtle` on the grid creates crisp 1px lines between cells
- **Separator:** `border-l border-admin-border-subtle` on the grid, full row height via `self-stretch`
- **Flush right:** because `.si` has `flex-1`, the beat grid is naturally pushed to the right edge on every row regardless of column count

### Beat Cell States

Use design tokens — no raw hex values. Add these two CSS variables to `globals.css` and map in `tailwind.config.ts` before implementation:

| Variable | Dark mode value | Light mode value | Usage |
|---|---|---|---|
| `--admin-beat-selected-bg` | `#000000` | `#e5e5e5` | Active beat cell background (darker than sidebar) |
| `--admin-beat-selected-text` | `#d4d4d8` | `#404040` | Active beat cell text |

| State    | Background token | Text token |
|----------|-----------------|------------|
| Default  | `bg-admin-bg-sidebar` (via inheritance) | `text-admin-text-faint` |
| Hover    | `hover:bg-white/[0.06]` | `hover:text-admin-text-muted` |
| Selected | `bg-admin-beat-selected-bg` | `text-admin-beat-selected-text` |

### Row Width

Parent containers must not have a fixed width — the sidebar should expand to fit content naturally.

---

## Interaction

1. **Clicking a scene row** (not a beat cell) navigates to that scene's beat A, and highlights the A cell as active
2. **Clicking a beat cell** directly navigates to that specific beat, highlights that cell. The click handler calls `e.stopPropagation()` to prevent also triggering the row click
3. **Active beat** is determined by the `activeBeatId` prop passed from the parent

---

## Beat Label Derivation

`ScriptBeatRow` has no `beat_label` field — labels are derived by the parent before passing into `SceneListItem`. Sort beats by `sort_order` ascending, then:

```ts
const label = String.fromCharCode(65 + index); // index is 0-based position in sorted array
// → 0 = "A", 1 = "B", 2 = "C", etc.
```

This derivation happens in each parent call site, not inside `SceneListItem`.

---

## Component API Changes

### `SceneListItem` props additions

```typescript
interface BeatNav {
  beatId: string;
  label: string;       // "A", "B", "C" — derived by parent from sort_order
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void; // must call e.stopPropagation()
}

// New optional prop:
beats?: BeatNav[];     // omit or pass [] for single-beat scenes (no column rendered)
```

---

## Files to Modify

### 1. Design tokens (do first)
- **`src/app/globals.css`** — add `--admin-beat-selected-bg` and `--admin-beat-selected-text` for both dark and light `:root`
- **`tailwind.config.ts`** — map to `colors.admin.beat-selected-bg` and `colors.admin.beat-selected-text`

### 2. Core component
- **`src/app/admin/scripts/_components/SceneListItem.tsx`** — switch to flex, fix number width, add beat grid

### 3. Call sites — all four must be updated

| Component | File | Notes |
|-----------|------|-------|
| `ScriptSceneSidebar` | `src/app/admin/scripts/_components/ScriptSceneSidebar.tsx` | Uses a local `SortableSceneItem` wrapper that **duplicates** `SceneListItem` markup — must add beat grid there too, or refactor to render `SceneListItem` internally |
| `SceneNav` | `src/app/admin/scripts/_components/SceneNav.tsx` | Has a local `SortableSceneRow` that also duplicates the markup — same situation |
| `SceneBottomSheet` | `src/app/s/[token]/SceneBottomSheet.tsx` | Uses `SceneListItem` directly — pass `beats` + `activeBeatId` |
| `ScriptShareClient` | `src/app/s/[token]/ScriptShareClient.tsx` | Renders `SceneNav` — `computedScenes` already carries `beats` arrays, pass through |

> **Recommended refactor:** Update `SortableSceneItem` (in `ScriptSceneSidebar`) and `SortableSceneRow` (in `SceneNav`) to render `SceneListItem` internally rather than duplicating markup. This eliminates the drift risk.

---

## Verification

- **Admin script editor:** open a script with multi-beat scenes — beat cells appear, clicking a cell jumps to that beat, A is highlighted when clicking the scene row
- **Share view — desktop sidebar:** same behavior
- **Share view — canvas/table view (`ScriptShareClient`):** same behavior
- **Mobile bottom sheet:** confirm cells are tappable at phone viewport width
- **Single-beat scenes:** no beat column appears in any context
- **Number alignment:** scene numbers (101, 201, 301…) remain vertically aligned across rows
- **TypeScript:** `npx tsc --noEmit` passes clean
