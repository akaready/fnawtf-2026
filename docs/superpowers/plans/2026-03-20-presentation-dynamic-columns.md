# Presentation Dynamic Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the column toggle dots from the presentation share page and automatically show/hide Visual, Notes, and Reference sections based on whether the current beat has content in those fields.

**Architecture:** Replace `colConfig` state + `ScriptColumnToggle` with three booleans computed directly from the current slide's data. Animate section appearance/disappearance with Framer Motion `AnimatePresence` and a CSS grid transition on the Audio/Visual row.

**Tech Stack:** React, Framer Motion (`AnimatePresence`, `motion`), Tailwind CSS, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-presentation-dynamic-columns-design.md`

---

## File Map

| File | Change |
|------|--------|
| `src/app/s/[token]/ScriptPresentationView.tsx` | Remove `colConfig` state, `ScriptColumnToggle`, replace visibility logic, add animations |
| `src/app/s/[token]/ScriptShareClient.tsx` | Remove `columnConfig` prop passed to `ScriptPresentationView` |

---

### Task 1: Remove the toggle and colConfig state from ScriptPresentationView

**Files:**
- Modify: `src/app/s/[token]/ScriptPresentationView.tsx`

- [ ] **Step 1: Remove unused imports**

In `ScriptPresentationView.tsx`, remove `ScriptColumnToggle` from the import list:
```diff
- import { ScriptColumnToggle } from '@/app/admin/scripts/_components/ScriptColumnToggle';
```

Also remove `ScriptColumnConfig` from the types import (it will no longer be used):
```diff
- import type { ScriptColumnConfig, ScriptCharacterRow, ... } from '@/types/scripts';
+ import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow } from '@/types/scripts';
```

- [ ] **Step 2: Remove columnConfig from Props**

In the `Props` interface, remove:
```diff
- columnConfig: ScriptColumnConfig;
```

Note: `columnConfig` is NOT in the component's destructure — it was accepted as a prop but never used internally (the component used its own `colConfig` state). Remove it from the interface only.

- [ ] **Step 3: Remove colConfig state**

Remove the `useState` block (currently ~lines 113–119):
```diff
- const [colConfig, setColConfig] = useState<ScriptColumnConfig>({
-   audio: true,
-   visual: true,
-   notes: true,
-   reference: true,
-   storyboard: true,
- });
```

- [ ] **Step 4: Remove the ScriptColumnToggle render block**

Find and delete the toggle div (currently ~lines 337–344):
```diff
- {/* Column toggle dots — audio + storyboard always on */}
- <div className="flex justify-center mt-1 mb-2 md:mb-3 flex-shrink-0">
-   <ScriptColumnToggle
-     config={colConfig}
-     onChange={(c) => setColConfig({ ...c, audio: true, storyboard: true })}
-     compact
-   />
- </div>
```

- [ ] **Step 5: Replace colConfig-driven visibility with content checks**

Find the three lines that currently read something like:
```ts
const showVisual = colConfig.visual;
const showNotes = colConfig.notes;
const showReference = colConfig.reference;
```

Replace them with:
```ts
const showVisual = !!current.visualContent.trim();
const showNotes = !!current.notesContent.trim();
const showReference = current.referenceImageUrls.length > 0;
```

- [ ] **Step 6: TypeScript check**

```bash
cd "path/to/project" && npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: no errors. If `ScriptColumnConfig` still appears as an unused import error, remove it. If `columnConfig` still appears somewhere in `ScriptPresentationView`, remove it.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/s/[token]/ScriptPresentationView.tsx'
git commit -m "feat: remove column toggle, derive visibility from beat content"
```

---

### Task 2: Add animations to the presentation view

**Files:**
- Modify: `src/app/s/[token]/ScriptPresentationView.tsx`

- [ ] **Step 1: Add AnimatePresence to the import**

At the top of `ScriptPresentationView.tsx`, add `AnimatePresence` and `motion` to the framer-motion import. If there's no framer-motion import yet, add:
```ts
import { AnimatePresence, motion } from 'framer-motion';
```

- [ ] **Step 2: Add CSS grid transition to the Audio+Visual row**

Find the grid div for the Audio+Visual row (currently ~line 362):
```tsx
<div className={`grid gap-px border-b border-[#1a1a1a] ${showVisual ? 'grid-cols-3' : 'grid-cols-1'}`}>
```

Add the transition classes:
```tsx
<div className={`grid gap-px border-b border-[#1a1a1a] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${showVisual ? 'grid-cols-4' : 'grid-cols-1'}`}>
```

- [ ] **Step 3: Wrap the Visual cell in AnimatePresence**

Find the Visual cell render (currently `{showVisual && (<div className="border-l-2 border-l-[var(--admin-info)]...">`)).

Replace it with:
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
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Visual</p>
      <PresentationCell
        content={current.visualContent}
        characters={characters} tags={tags} locations={locations} products={products}
        mounted={mounted}
        className="text-sm text-[#999] leading-relaxed"
      />
    </motion.div>
  )}
</AnimatePresence>
```

Note: Visual gets opacity-only (no y-slide) since it's a grid column — a y-slide would look wrong inside a grid row.

- [ ] **Step 4: Wrap Notes in AnimatePresence**

Find the Notes block (currently `{showNotes && (<div className="border-l-2 border-l-[var(--admin-warning)]...">`)}.

Replace it with:
```tsx
<AnimatePresence>
  {showNotes && (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="border-l-2 border-l-[var(--admin-warning)] bg-[#0d0d0d] px-4 py-3 border-b border-[#1a1a1a]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Notes</p>
      <PresentationCell
        content={current.notesContent}
        characters={characters} tags={tags} locations={locations} products={products}
        mounted={mounted}
        className="text-sm text-[#999] leading-relaxed"
      />
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 5: Wrap Reference in AnimatePresence**

Find the Reference block (currently `{showReference && (<div className="border-l-2 border-l-[var(--admin-danger)]...">`)}.

Replace it with:
```tsx
<AnimatePresence>
  {showReference && (
    <motion.div
      key="reference"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="border-l-2 border-l-[var(--admin-danger)] bg-[#0d0d0d] px-4 py-3"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Reference</p>
      <div className="text-sm text-[#999] leading-relaxed">
        {current.referenceImageUrls.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {current.referenceImageUrls.map((url, i) => (
              <img key={i} src={url} alt="" className="h-12 md:h-16 rounded object-cover" />
            ))}
          </div>
        ) : (
          <span className="text-[#333]">&mdash;</span>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

Note: since `showReference = current.referenceImageUrls.length > 0`, the `&mdash;` fallback inside the Reference block is now unreachable — that's fine, leave it as a safe fallback.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/s/[token]/ScriptPresentationView.tsx'
git commit -m "feat: animate section visibility changes with Framer Motion"
```

---

### Task 3: Remove columnConfig prop from ScriptShareClient and verify

**Files:**
- Modify: `src/app/s/[token]/ScriptShareClient.tsx`

- [ ] **Step 1: Remove the columnConfig prop passed to ScriptPresentationView**

In `ScriptShareClient.tsx`, find the `<ScriptPresentationView ... />` render (in the `shareMode === 'presentation'` branch). Remove the `columnConfig` prop:
```diff
  <ScriptPresentationView
    slides={presentationSlides}
-   columnConfig={columnConfig}
    onClose={() => setShowIntro(true)}
    ...
  />
```

The `columnConfig` state variable itself stays — it's still used by `ReadOnlyCanvas` in the table-view branch. Do NOT remove it.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: clean.

- [ ] **Step 3: Manual verification**

Open a shared script link in the browser. Navigate between beats and verify:
- Beats with all fields show Visual (1/3 column), Notes, and Reference sections
- Audio-only beats show just the audio full-width — no empty sections
- Transitions between beats animate smoothly
- The colored dot toggle row is gone entirely
- Navigate to the table view (`?mode=table` or however it's accessed) — column toggles still work there

- [ ] **Step 4: Final commit**

```bash
git add 'src/app/s/[token]/ScriptShareClient.tsx'
git commit -m "feat: remove columnConfig prop from ScriptPresentationView (driven by content now)"
```
