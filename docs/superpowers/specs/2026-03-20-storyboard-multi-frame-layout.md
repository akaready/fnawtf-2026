# Storyboard Multi-Frame Layout Design

**Date:** 2026-03-20
**Status:** Approved for implementation
**Branch:** feature/storyboard-multi-frame

---

## Overview

The storyboard system currently supports one active image per beat. This redesign extends it to support **up to 4 images per beat**, each with a reframeable crop, arranged using a library of **comic-book-inspired layout templates**. A new **Frames tab** in the existing `StoryboardGenerateModal` becomes the primary control surface. The cell display and presentation pages are updated to render multi-frame layouts.

---

## 1. Data Model

### `script_storyboard_frames` — two new columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `slot` | `integer` CHECK (slot BETWEEN 1 AND 4) | yes | Active slot position. `null` = history only. Replaces `is_active`. |
| `crop_config` | `jsonb` | yes | Per-slot reframe: `{ x: number, y: number, scale: number }` |

**DB constraint:** `ALTER TABLE script_storyboard_frames ADD CONSTRAINT slot_range CHECK (slot BETWEEN 1 AND 4);`

**Index:** Add `CREATE INDEX ON script_storyboard_frames (beat_id, slot) WHERE slot IS NOT NULL;` for fast active-frame lookups.

**Migration:**
- Existing `is_active = true` frames → `slot = 1`
- Existing `is_active = false` frames → `slot = null`
- `is_active` column stays in schema but is ignored by all new code. Existing server actions that write `is_active` (`setActiveFrame`) are updated to write `slot` instead and set `slot = null` on previously active frames for that beat.

### `script_beats` — one new column

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `storyboard_layout` | `varchar` | yes | `"single"` (null treated as `"single"`) |

---

## 2. TypeScript Types

### Updated `ScriptStoryboardFrameRow` (in `src/types/scripts.ts`)

```typescript
// Add to existing ScriptStoryboardFrameRow:
slot: number | null;       // 1–4 or null (history only)
crop_config: CropConfig | null;
```

### New types (add to `src/types/scripts.ts`)

```typescript
export interface CropConfig {
  x: number;      // 0.0–1.0, horizontal origin (0 = left edge, 1 = right edge)
  y: number;      // 0.0–1.0, vertical origin (0 = top, 1 = bottom)
  scale: number;  // ≥ 1.0 (1.0 = no zoom, 1.5 = 50% zoomed in)
}

// Alias — StoryboardSlotFrame is ScriptStoryboardFrameRow with slot guaranteed non-null
export type StoryboardSlotFrame = ScriptStoryboardFrameRow & { slot: number };
```

---

## 3. Layout Library (18 templates)

All layouts are CSS grid based. All panel slots use `rounded-admin-lg` everywhere. Layout definitions live in a single `STORYBOARD_LAYOUTS` constant in a new file `src/app/admin/scripts/_components/storyboardLayouts.ts`, imported by the renderer, modal, and cell.

```typescript
export interface LayoutDefinition {
  id: string;
  label: string;
  slotCount: number;          // 1–4
  gridTemplate: string;       // CSS grid-template value
  gridAreas: string[];        // one per slot, e.g. ["a", "b", "c"]
  aspectRatio: '16/9';        // always 16:9 outer container
}
```

### 1-frame
| ID | Description |
|----|-------------|
| `single` | Full panel |

### 2-frame
| ID | Description |
|----|-------------|
| `two-equal` | 50/50 side by side |
| `two-wide-left` | 67/33 split |
| `two-wide-right` | 33/67 split |

### 3-frame
| ID | Description |
|----|-------------|
| `three-equal-row` | Three equal horizontal strips |
| `three-big-left` | Large left (67%) + two stacked right |
| `three-big-right` | Large right (67%) + two stacked left |
| `three-big-top` | Large top (67%) + two side-by-side below |
| `three-big-bottom` | Two side-by-side top + large bottom (67%) |
| `three-comic-stagger` | Top row: 67%/33% · Bottom row: 33%/67% |

### 4-frame
| ID | Description |
|----|-------------|
| `four-grid` | 2×2 equal grid |
| `four-big-left` | Large left + three stacked right |
| `four-big-right` | Large right + three stacked left |
| `four-banner-top` | Wide banner top + three equal below |
| `four-banner-bottom` | Three equal top + wide banner below |
| `four-L-top-left` | Large top-left spanning 2 rows + small top-right + two bottom |
| `four-comic-stagger` | Top: 67%/33% · Bottom: 33%/67% (opposite stagger) |
| `four-feature` | Dominant top-left (proportional 2×2) + column of three right |

**Grid geometry for ambiguous layouts** — implementer defines the exact CSS `grid-template` values. Acceptance criteria: proportions must visually match the description above; the outer container always maintains 16:9 aspect ratio; all slots maintain whole-pixel alignment. For reference: stagger rows are equal height (50/50 vertical split); `four-feature`'s right column is 33% width; `four-L-top-left`'s main panel is 67% width and full height.

---

## 4. Shared Renderer: `StoryboardLayoutRenderer`

New file: `src/app/admin/scripts/_components/StoryboardLayoutRenderer.tsx`

Used by: `ScriptStoryboardCell`, `StoryboardGenerateModal` (Frames tab), and presentation pages.

```typescript
interface StoryboardLayoutRendererProps {
  layout: string;                  // layout template ID; defaults to "single" if not found
  frames: StoryboardSlotFrame[];   // only slot-assigned frames (slot IS NOT NULL), sorted by slot
  size: 'cell' | 'stage' | 'full';
  interactive?: boolean;           // true = stage mode with reframe drag; default false
  onReframe?: (frameId: string, crop: CropConfig) => void; // called during drag (local only, saved on modal Save)
  onSlotClick?: (slot: number) => void; // stage: clicking empty slot
}
```

### `crop_config` rendering technique

**Do not use `object-position` or `transform: scale()` on `<img>`.** Instead, use a **wrapper div** approach:

```tsx
// Each slot renders:
<div className="overflow-hidden rounded-admin-lg relative w-full h-full">
  <div
    style={{
      position: 'absolute',
      inset: 0,
      transform: `scale(${crop.scale}) translate(${(0.5 - crop.x) * 100}%, ${(0.5 - crop.y) * 100}%)`,
      transformOrigin: 'center center',
    }}
  >
    <img
      src={frame.image_url}
      className="w-full h-full object-cover"
    />
  </div>
</div>
```

- `crop.x / crop.y` at 0.5/0.5 = centered (default, no shift)
- `crop.scale` at 1.0 = no zoom; 1.5 = 50% zoomed in
- The outer `overflow-hidden` clips to the slot boundary
- Default `crop_config` when null: `{ x: 0.5, y: 0.5, scale: 1.0 }`

### Snapping (stage mode only)

Snap points for x and y: `[0.33, 0.5, 0.67]` — center and rule-of-thirds. Snap threshold: 0.03. Applied during drag, not on release.

### Empty slot rendering

Slots with no assigned frame render a placeholder: dashed border, `rounded-admin-lg`, centered `+` icon. In `cell` size, empty slots render as a dimmed grey panel.

---

## 5. Cell UI (`ScriptStoryboardCell`)

### Prop changes

```typescript
// OLD:
frame: ScriptStoryboardFrameRow | null;

// NEW:
frames: ScriptStoryboardFrameRow[];   // all frames for this beat (active + history)
layout: string | null;                // beat's storyboard_layout value
```

**Callsites to update:** `ScriptBeatRow` (primary), any other component passing `frame` to the cell.

`ScriptBeatRow` derives `frames` from the beat's full frame list (passed from parent or fetched via context). The existing `onFrameChange` callback changes to:

```typescript
// OLD:
onFrameChange?: (frame: ScriptStoryboardFrameRow | null) => void;

// NEW:
onFramesChange?: (frames: ScriptStoryboardFrameRow[]) => void;
```

Parent components (`ScriptBeatRow` and up) update to manage an array of frames instead of a single frame.

### With images (1–4 active frames)
- Filters `frames` to `activeFrames = frames.filter(f => f.slot !== null).sort((a,b) => a.slot - b.slot)`
- Renders `<StoryboardLayoutRenderer size="cell" layout={layout} frames={activeFrames} />`
- **Hover:** single Expand button (fullscreen lightbox) appears over the cell
- **Click:** opens `StoryboardGenerateModal` defaulting to Frames tab
- **Whole-layout drag:** GripVertical on beat row gutter — moves all `slot`-assigned frames + `storyboard_layout` as a unit (existing drag mechanism, expanded to pass multi-frame data)

### Lightbox
Updated to display active slot frames **one at a time** (individual frame navigation, not the full layout grid), sorted by slot number, with left/right arrow navigation. The lightbox retains its current full-screen single-image presentation; slot ordering determines the navigation sequence.

---

## 6. `StoryboardGenerateModal` — Tab Restructure

**New tab order:** Generate (Sparkles) | Modify (Wand2) | Frames (LayoutGrid)

**Default landing tab:**
- `frames.some(f => f.slot !== null)` → Frames tab
- No active frames → Generate tab
- "Generate with editor" from empty cell → Generate tab (passed as `defaultTab` prop)

### Modal state additions

```typescript
// Local draft state — NOT persisted until Save is clicked
draftLayout: string;           // initialized from beat.storyboard_layout
draftSlots: Map<number, string>; // slot → frameId, initialized from frames with slot != null
draftCrops: Map<string, CropConfig>; // frameId → crop, initialized from frames
```

The stage's `onReframe` callback updates `draftCrops` in modal local state — no server call is made during drag.

**Layout switching behavior:** Selecting a layout in the carousel updates `draftLayout` and `draftSlots` immediately in local state. Frames displaced by switching to fewer slots have their slot removed from `draftSlots` only (they remain in history). No server calls until Save. On Cancel/Close, all draft state is discarded.

### Frames Tab: drag-to-slot interaction

**Sidebar → Stage:**
- Each sidebar frame thumbnail has a drag handle (GripVertical, same pattern as existing)
- Dragging a frame from the sidebar and dropping onto a stage slot assigns it: updates `draftSlots.set(slot, frameId)` and removes the frame from any previous slot assignment in `draftSlots`
- Dropping onto an already-occupied slot replaces it (occupied frame moves back to history in draft)
- Clicking an empty slot in the stage (no drag): selects the most recently generated unslotted frame if any, otherwise no-op

**Within stage:**
- Slots in the stage are drop targets (visual highlight on dragover)
- Reordering between slots: drag a slot's frame to another slot — swaps in draft state

### Sidebar frame actions (via `ImageActionButton` row on hover)

- **Duplicate** — server action `duplicateFrame(frameId)` immediately (not draft); new frame appears in sidebar with `slot = null`
- **Move to beat…** — opens beat-picker popover (see §7); immediate server action
- **Download** — browser download, immediate
- **Delete** — two-state confirmation, immediate server action

### Beat-picker popover ("Move to beat…")

- Rendered as a small absolute-positioned popover anchored to the Move button
- Lists all beats in the current script, grouped by scene
- Format: `Scene label — Beat letter` (e.g. "Scene 1 — A")
- Beats with 4 active frames already are shown but disabled with a tooltip: "Beat full (4/4)"
- Selecting a beat calls `moveFrameToBeat(frameId, targetBeatId)`:
  - Frame's `beat_id` updated to target
  - Frame assigned to next available slot on target beat (lowest slot number not in use)
  - Frame removed from its current slot on source beat (set `slot = null`)

### Save behavior

On Save: flush all draft state to server in a single batch:
1. `setBeatLayout(beatId, draftLayout)` if changed
2. For each slot 1–4: `setFrameSlot(frameId, slot)` for newly assigned or moved frames; `setFrameSlot(frameId, null)` for displaced frames
3. `updateFrameCrop(frameId, crop)` for any changed crops

---

## 7. Server Actions

Location: `src/app/admin/scripts/_components/actions.ts` (or adjacent file)

| Action | Signature | Description |
|--------|-----------|-------------|
| `setFrameSlot` | `(frameId: string, slot: number \| null) => Promise<void>` | Set or clear a frame's slot. Also clears `is_active` for compat. |
| `setBeatLayout` | `(beatId: string, layout: string) => Promise<void>` | Update `storyboard_layout` on a beat. |
| `updateFrameCrop` | `(frameId: string, crop: CropConfig \| null) => Promise<void>` | Save reframe settings. |
| `duplicateFrame` | `(frameId: string) => Promise<ScriptStoryboardFrameRow>` | Insert copy with `slot = null`, same `beat_id`. Returns new frame. |
| `moveFrameToBeat` | `(frameId: string, targetBeatId: string) => Promise<void>` | Move frame: update `beat_id`, assign next available slot on target. Server validates target has < 4 active frames; throws if full. |
| *(updated)* `setActiveFrame` | — | Updated to write `slot = 1` and clear other slots for beat, instead of `is_active`. |
| *(existing)* `deleteStoryboardFrame` | — | Unchanged. |
| *(existing)* `uploadStoryboardFrame` | — | Unchanged; new uploads get `slot = null` initially (user assigns via drag). Or `slot = next available` if beat has open slots — **decision: `slot = null`, user assigns manually** to avoid accidental overwrites. |

---

## 8. Presentation Pages

**Affected files:**
- `src/app/s/[token]/ScriptPresentationView.tsx`
- `src/app/s/[token]/ReadOnlyCanvas.tsx`
- `src/app/s/[token]/ScriptShareClient.tsx`

**Change:** Replace current single-image storyboard rendering with `<StoryboardLayoutRenderer size="full" layout={beat.storyboard_layout} frames={activeFrames} />`. `crop_config` applied via the wrapper-div technique (§4).

**Graceful fallback:** Null/missing `storyboard_layout` → renders as `"single"`, identical to current behavior.

**Cross-version persistence:** Frame `beat_id` references are stable across script versions. No additional work needed.

---

## 9. Verification

- `npx tsc --noEmit` passes clean
- Empty cell: Upload / Generate with editor / Quick generate unchanged
- After generating first frame: modal defaults to Generate tab
- After frame exists with `slot IS NOT NULL`: modal defaults to Frames tab
- Layout carousel: selecting each of 18 layouts updates stage + cell mini-grid; Cancel reverts to saved layout
- Drag frame from sidebar → drop onto stage slot → frame appears in slot, removed from previous slot if any
- Duplicate: creates copy in sidebar history with `slot = null`
- Move to beat: frame removed from source beat, appears in target sidebar at next available slot; target beats with 4 active frames shown as disabled
- Reframe: drag to pan, scroll to zoom in stage → saved on Save → renders in cell and presentation pages
- `crop_config` null → defaults to `{ x: 0.5, y: 0.5, scale: 1.0 }` (centered, no zoom)
- All 18 layouts render with correct proportions and `rounded-admin-lg` corners
- Legacy single-frame beats render identically to current behavior
- Whole-layout beat drag: all slot-assigned frames + layout move together
- DB: `slot = 5` insert rejected by check constraint
- Presentation pages: multi-frame layouts render correctly with crop applied
