# Presentation View — Dynamic Columns Design

**Date:** 2026-03-20
**Status:** Approved

## Context

The script presentation share page (`/s/[token]`) shows each beat's content in up to four sections: Audio, Visual, Notes, and Reference. Previously, a row of colored toggle dots (`ScriptColumnToggle`) let the viewer manually show or hide each section. The problem: many beats have no visual, no notes, or no reference content, yet empty `—` placeholders were shown anyway, and the toggle was an unnecessary UI burden for external viewers.

The goal is to remove the toggle entirely and have the layout adapt automatically — only rendering sections that have actual content for the current beat.

## Approach

Per-slide computed visibility. No state, no toggle. Derive what's visible directly from the current slide's data on each render.

## Design

### Actual DOM Structure (current)

```
[Bordered content block]
  [Scene heading]
  [Audio (col-span-2) | Visual (1/3)]  ← single CSS grid row
  [Notes]                               ← separate full-width block below grid
  [Reference]                           ← separate full-width block below Notes
```

Visual is a grid column alongside Audio — not a sibling of Notes. When `showVisual` is false, the grid switches from `grid-cols-3` to `grid-cols-1` and Audio expands to full width.

### Visibility Logic

Replace the three `colConfig`-driven booleans with direct content checks:

```ts
const showVisual = !!current.visualContent.trim()
const showNotes = !!current.notesContent.trim()
const showReference = current.referenceImageUrls.length > 0
```

`visualContent` and `notesContent` are non-nullable strings (default `''`).

### Animation

**Audio+Visual grid row:**
The grid div already has `grid-cols-4` / `grid-cols-1` toggling based on `showVisual` (Audio is `col-span-3`, Visual is 1 column — a 75/25 split). Add a CSS grid transition so Audio expands/contracts smoothly instead of snapping:
```tsx
<div className={`grid gap-px border-b border-[#1a1a1a] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${showVisual ? 'grid-cols-4' : 'grid-cols-1'}`}>
```

Wrap the Visual cell in `AnimatePresence` + `motion.div` for a fade in/out:
```tsx
<AnimatePresence>
  {showVisual && (
    <motion.div
      key="visual"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="border-l-2 border-l-[var(--admin-info)] bg-[#0d0d0d] px-4 py-3"
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

**Notes and Reference** — independently animated with `AnimatePresence` + `motion.div`, fade + slight vertical slide:
```tsx
<AnimatePresence>
  {showNotes && (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showReference && (
    <motion.div
      key="reference"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

**Key rule:** All keys (`"visual"`, `"notes"`, `"reference"`) are static strings. Do NOT include slide index — animation fires only when section visibility changes, not on every navigation.

### Removals from `ScriptPresentationView.tsx`

- `colConfig` useState
- `ScriptColumnToggle` import and its rendered `<div>` (lines 337–344 in current file)
- `columnConfig` from Props interface
- Unused `ScriptColumnConfig` type import
- The three `colConfig`-driven `showVisual`/`showNotes`/`showReference` lines (replaced by content checks above)

**What stays in `ScriptShareClient.tsx`:** The `columnConfig` state and the `ScriptColumnToggle` in the table-view branch are retained — they drive `ReadOnlyCanvas`. Only the `columnConfig={columnConfig}` prop passed to `ScriptPresentationView` is removed.

## Files Changed

| File | Change |
|------|--------|
| `src/app/s/[token]/ScriptPresentationView.tsx` | Remove toggle + colConfig, replace visibility logic, add AnimatePresence + CSS grid transition |
| `src/app/s/[token]/ScriptShareClient.tsx` | Remove `columnConfig` prop passed to `ScriptPresentationView` only |

## Verification

1. `npx tsc --noEmit` — clean
2. Navigate between beats — sections with content appear, empty sections absent (no `—` placeholders for hidden sections)
3. Beat with all sections → audio-only beat: Visual fades out while Audio smoothly expands to full width; Notes and Reference slide+fade out
4. Navigate back: sections animate in
5. Confirm colored dot row is gone entirely
6. Table view (`shareMode === 'table'`) still works — `ReadOnlyCanvas` receives `columnConfig` unchanged
7. No regression in admin script editor (separate `ScriptPresentation.tsx`, untouched)
