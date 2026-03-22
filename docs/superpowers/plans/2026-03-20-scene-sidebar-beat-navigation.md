# Scene Sidebar Beat Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flush-right beat grid column to `SceneListItem` (and its drag-wrapper siblings) that shows A/B/C… cells only on multi-beat scenes, directly clickable to jump to any beat.

**Architecture:** Phase 1 adds tokens and updates the core `SceneListItem` component (sequential, others depend on it). Phase 2 updates all four call sites in parallel. Each call site derives beat nav items from its existing scene data and passes them down.

**Tech Stack:** Next.js 15, React, Tailwind CSS, dnd-kit (drag wrappers)

**Spec:** `docs/superpowers/specs/2026-03-20-scene-sidebar-beat-navigation-design.md`

---

## File Map

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `--admin-beat-selected-bg`, `--admin-beat-selected-text`, `--admin-beat-hover-bg` CSS vars |
| `tailwind.config.ts` | Map those vars to Tailwind color tokens |
| `src/app/admin/scripts/_components/SceneListItem.tsx` | Core component: flex layout, `w-[52px]` number, beat grid |
| `src/app/admin/scripts/_components/ScriptSceneSidebar.tsx` | Add beat grid to `SortableSceneItem`; scope to scratchpad (beats not used there — no-op for beat nav) |
| `src/app/admin/scripts/_components/SceneNav.tsx` | Add `beats?` to `SceneData`; add beat grid to `SortableSceneRow` and static `SceneListItem` branch |
| `src/app/s/[token]/ReadOnlyCanvas.tsx` | Add `id={`beat-${beat.id}`}` to beat wrapper div |
| `src/app/s/[token]/SceneBottomSheet.tsx` | Rename `onJumpToScene` → `onSelectScene`; add `activeBeatId` / `onSelectBeat` |
| `src/app/s/[token]/ScriptPresentationView.tsx` | Add `jumpToBeat`; pass active beat to nav and bottom sheet |
| `src/app/s/[token]/ScriptShareClient.tsx` | Add `sort_order` to `computedScenes` beats cast; pass beats + scroll handler to `SceneNav` |

### Key design decisions

- **`SortableSceneItem` / `SortableSceneRow`** are NOT refactored to wrap `SceneListItem` — their dnd-kit `{...listeners}` spread on the root element conflicts with nested interactive children. Beat grid markup is duplicated directly, matching `SceneListItem` exactly.
- **`SceneListItem` outer element** changes from `<button>` to `<div role="button" tabIndex={0}>` so that `<button>` beat cells are valid HTML children.
- **Number column alignment** — number `<span>` gets `w-[52px] flex-shrink-0` (fixed width per spec) so alignment is consistent across all rows regardless of digit count.
- **Beat label derivation** — done in each parent call site: sort beats by `sort_order` asc, then `String.fromCharCode(65 + index)`.
- **Odd beat counts** get an invisible `<span aria-hidden="true">` filler to complete the 2-row column.
- **`ScriptSceneSidebar` (scratchpad mode)** — scratchpad scenes have no beats. Beat grid is implemented in `SortableSceneItem` with the same API, but in practice will never render because `scene.beats.length` will always be < 2.
- **Admin editor beat navigation** — `SceneNav` is what the editor renders for script/table/presentation modes. `ScriptSceneSidebar` is scratchpad-only. The editor's active beat comes from wherever its beat focus state lives — check `ScriptEditorClient.tsx` for the `activeBeatId` state and wire it to the `SceneNav` call there.
- **`ScriptShareClient`** — no active beat state (canvas view has no current-beat concept). Beat cell click scrolls to `#beat-{beatId}` in the canvas DOM.
- **Hover token** — `hover:bg-white/[0.06]` violates design token rules. Use `hover:bg-admin-beat-hover-bg` (defined in Task 1).

---

## Beat Grid — shared markup pattern

Used identically in `SceneListItem`, `SortableSceneItem`, and `SortableSceneRow`. Copy exactly:

```tsx
{beats && beats.length >= 2 && (
  <div className="self-stretch border-l border-admin-border-subtle grid grid-rows-2 grid-flow-col auto-cols-[22px] gap-px bg-admin-border-subtle flex-shrink-0">
    {beats.map(beat => (
      <button
        key={beat.beatId}
        onClick={beat.onClick}
        className={`flex items-center justify-center font-bebas text-[12px] leading-none transition-colors ${
          beat.isActive
            ? 'bg-admin-beat-selected-bg text-admin-beat-selected-text'
            : 'bg-admin-bg-sidebar text-admin-text-faint hover:bg-admin-beat-hover-bg hover:text-admin-text-muted'
        }`}
      >
        {beat.label}
      </button>
    ))}
    {beats.length % 2 !== 0 && (
      <span aria-hidden="true" className="bg-admin-bg-sidebar" />
    )}
  </div>
)}
```

---

## Task 1: Design tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Add CSS vars to `globals.css`** in the dark mode `:root` block:
```css
--admin-beat-selected-bg:   #000000;
--admin-beat-selected-text: #d4d4d8;
--admin-beat-hover-bg:      rgba(255, 255, 255, 0.06);
```

And in the light mode `:root` block:
```css
--admin-beat-selected-bg:   #e5e5e5;
--admin-beat-selected-text: #404040;
--admin-beat-hover-bg:      rgba(0, 0, 0, 0.06);
```

- [ ] **Map to Tailwind in `tailwind.config.ts`** inside `colors.admin`:
```ts
'beat-selected-bg':   'var(--admin-beat-selected-bg)',
'beat-selected-text': 'var(--admin-beat-selected-text)',
'beat-hover-bg':      'var(--admin-beat-hover-bg)',
```

- [ ] **TypeScript check**
```bash
cd "/Users/Hobbes/Development/Friends n Allies/Website/2026 - React"
npx tsc --noEmit 2>&1 | head -20
```
Expected: same pre-existing errors only, none new.

- [ ] **Commit**
```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: add beat-selected and beat-hover design tokens"
```

---

## Task 2: Update `SceneListItem`

**Files:**
- Modify: `src/app/admin/scripts/_components/SceneListItem.tsx`

- [ ] **Update the `Props` interface** — add `BeatNav` type and `beats` prop:

```ts
interface BeatNav {
  beatId: string;
  label: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

interface Props {
  sceneNumber: number;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  beats?: BeatNav[];
}
```

- [ ] **Replace the entire return** with the new flex layout:

```tsx
return (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    className={`text-left col-span-2 flex items-stretch min-h-[45px] overflow-hidden border-b border-admin-border-subtle transition-colors cursor-pointer ${
      isActive
        ? 'bg-black/40 text-admin-text-primary'
        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
    } ${className}`}
  >
    {/* Scene number — fixed w-[52px] keeps alignment across all rows */}
    <span className="w-[52px] flex-shrink-0 font-bebas text-[44px] leading-none text-right pr-1 pl-3 translate-y-[2px] text-admin-border flex items-center justify-end">
      {sceneNumber}
    </span>

    {/* Info column — flex:1 pushes beat grid to the right */}
    <div className="flex-1 min-w-0 pr-3 flex flex-col justify-center py-2">
      {slug && (
        <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider whitespace-nowrap block leading-tight">
          {slug}
        </span>
      )}
      {description && (
        <span className="text-xs text-admin-text-muted font-normal uppercase tracking-wider whitespace-nowrap block leading-tight">
          {description}
        </span>
      )}
    </div>

    {/* Beat grid — only on 2+ beat scenes, always flush right */}
    {beats && beats.length >= 2 && (
      <div className="self-stretch border-l border-admin-border-subtle grid grid-rows-2 grid-flow-col auto-cols-[22px] gap-px bg-admin-border-subtle flex-shrink-0">
        {beats.map(beat => (
          <button
            key={beat.beatId}
            onClick={beat.onClick}
            className={`flex items-center justify-center font-bebas text-[12px] leading-none transition-colors ${
              beat.isActive
                ? 'bg-admin-beat-selected-bg text-admin-beat-selected-text'
                : 'bg-admin-bg-sidebar text-admin-text-faint hover:bg-admin-beat-hover-bg hover:text-admin-text-muted'
            }`}
          >
            {beat.label}
          </button>
        ))}
        {beats.length % 2 !== 0 && (
          <span aria-hidden="true" className="bg-admin-bg-sidebar" />
        )}
      </div>
    )}
  </div>
);
```

- [ ] **TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Commit**
```bash
git add src/app/admin/scripts/_components/SceneListItem.tsx
git commit -m "feat: add beat navigation grid to SceneListItem"
```

---

## Task 3: Update `SceneNav`

**Files:**
- Modify: `src/app/admin/scripts/_components/SceneNav.tsx`

This is the primary sidebar in admin script/table/presentation modes AND the share view desktop sidebar.

- [ ] **Add `beats?` field to the `SceneData` interface** (lines ~27–34):

```ts
interface SceneData {
  id: string;
  sceneNumber: number;
  int_ext: string;
  location_name: string;
  time_of_day: string;
  scene_description: string | null;
  beats?: { id: string; sort_order: number }[];  // ← add
}
```

- [ ] **Add `activeBeatId` and `onSelectBeat` to `SceneNav` props interface**:

```ts
activeBeatId?: string | null;
onSelectBeat?: (beatId: string) => void;
```

- [ ] **Add the same props to `SortableSceneRow`** and update the call in `SceneNav`:

In the `SortableContext` map:
```tsx
<SortableSceneRow
  key={scene.id}
  scene={scene}
  isActive={activeSceneId === scene.id}
  onSelect={() => onSelectScene(scene.id)}
  activeBeatId={activeBeatId ?? null}
  onSelectBeat={onSelectBeat ?? (() => {})}
/>
```

- [ ] **Add beat nav derivation inside `SortableSceneRow`** (before the return):

```ts
const beatNavItems = (scene.beats ?? []).length >= 2
  ? [...(scene.beats ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((beat, i) => ({
        beatId: beat.id,
        label: String.fromCharCode(65 + i),
        isActive: beat.id === activeBeatId,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          onSelectBeat(beat.id);
        },
      }))
  : [];
```

- [ ] **Change `SortableSceneRow` root to flex** — replace `col-span-2 grid grid-cols-subgrid items-center h-[45px]` with `col-span-2 flex items-stretch min-h-[45px]`:

```tsx
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className={`text-left col-span-2 flex items-stretch min-h-[45px] overflow-hidden border-b border-admin-border-subtle cursor-grab transition-colors ${
    isActive
      ? 'bg-black/40 text-admin-text-primary'
      : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
  }`}
  onClick={onSelect}
>
```

- [ ] **Update `SortableSceneRow` interior** — replace existing `<span>` and `<div>` with flex versions + beat grid:

```tsx
<span className="w-[52px] flex-shrink-0 font-bebas text-[44px] leading-none text-right pr-1 pl-3 translate-y-[2px] text-admin-border flex items-center justify-end">
  {scene.sceneNumber}
</span>
<div className="flex-1 min-w-0 pr-3 flex flex-col justify-center py-2">
  <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider whitespace-nowrap block leading-tight">
    {buildSlug(scene)}
  </span>
  {scene.scene_description && (
    <span className="text-xs text-admin-text-muted font-normal uppercase tracking-wider whitespace-nowrap block leading-tight">
      {scene.scene_description}
    </span>
  )}
</div>
{/* Beat grid */}
{beatNavItems.length >= 2 && (
  <div className="self-stretch border-l border-admin-border-subtle grid grid-rows-2 grid-flow-col auto-cols-[22px] gap-px bg-admin-border-subtle flex-shrink-0">
    {beatNavItems.map(beat => (
      <button
        key={beat.beatId}
        onClick={beat.onClick}
        className={`flex items-center justify-center font-bebas text-[12px] leading-none transition-colors ${
          beat.isActive
            ? 'bg-admin-beat-selected-bg text-admin-beat-selected-text'
            : 'bg-admin-bg-sidebar text-admin-text-faint hover:bg-admin-beat-hover-bg hover:text-admin-text-muted'
        }`}
      >
        {beat.label}
      </button>
    ))}
    {beatNavItems.length % 2 !== 0 && (
      <span aria-hidden="true" className="bg-admin-bg-sidebar" />
    )}
  </div>
)}
```

- [ ] **Pass beats to the static `SceneListItem` branch** (non-draggable mode). Find where `SceneListItem` is rendered inside `SceneNav` and pass beat nav items:

```tsx
<SceneListItem
  sceneNumber={scene.sceneNumber}
  slug={buildSlug(scene)}
  description={scene.scene_description}
  isActive={activeSceneId === scene.id}
  onClick={() => onSelectScene(scene.id)}
  beats={(scene.beats ?? []).length >= 2
    ? [...(scene.beats ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((beat, i) => ({
          beatId: beat.id,
          label: String.fromCharCode(65 + i),
          isActive: beat.id === (activeBeatId ?? null),
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectBeat?.(beat.id);
          },
        }))
    : undefined}
/>
```

- [ ] **Wire `SceneNav` in the admin editor** — find `ScriptEditorClient.tsx` where `SceneNav` is rendered (script/table/presentation modes). Check whether `activeBeatId` state exists there. If not, add it alongside `activeSceneId`, updated whenever the focused beat changes. Pass `activeBeatId` and `onSelectBeat` to `SceneNav`.

- [ ] **TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Commit**
```bash
git add src/app/admin/scripts/_components/SceneNav.tsx
git commit -m "feat: add beat navigation to SceneNav (admin + share sidebar)"
```

---

## Task 4: Update `ScriptSceneSidebar` (scratchpad mode)

**Files:**
- Modify: `src/app/admin/scripts/_components/ScriptSceneSidebar.tsx`

> **Context:** `ScriptSceneSidebar` is only used in scratchpad mode, where scenes have no beats. This task adds the beat grid API to `SortableSceneItem` for API completeness and forward-compatibility, but beat cells will not render in practice (beat count < 2). No `activeBeatId` wiring to `ScriptEditorClient` is needed.

- [ ] **Add `activeBeatId` / `onSelectBeat` to `ScriptSceneSidebar` and `SortableSceneItem` props** — optional, defaulting to null/no-op.

- [ ] **Change `SortableSceneItem` root to flex** — same pattern as `SortableSceneRow` in Task 3. Note: this component uses `text-[56px]` for the number (not 44px) — keep that. Set `w-[68px]` instead of `w-[52px]` to fit the larger font.

- [ ] **Add beat grid markup** to `SortableSceneItem` interior (same pattern — will simply never render for scratchpad scenes).

- [ ] **TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Commit**
```bash
git add src/app/admin/scripts/_components/ScriptSceneSidebar.tsx
git commit -m "feat: add beat grid API to ScriptSceneSidebar (scratchpad, no-op)"
```

---

## Task 5: `ReadOnlyCanvas` — add beat ids for scroll targeting

**Files:**
- Modify: `src/app/s/[token]/ReadOnlyCanvas.tsx`

- [ ] **Find the beat wrapper div** — look for `key={beat.id}` in the canvas render. Add `id`:

```tsx
<div key={beat.id} id={`beat-${beat.id}`} className="relative">
```

- [ ] **TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**
```bash
git add src/app/s/[token]/ReadOnlyCanvas.tsx
git commit -m "feat: add beat id attributes to ReadOnlyCanvas for scroll targeting"
```

---

## Task 6: `SceneBottomSheet` + `ScriptPresentationView`

**Files:**
- Modify: `src/app/s/[token]/SceneBottomSheet.tsx`
- Modify: `src/app/s/[token]/ScriptPresentationView.tsx`

### SceneBottomSheet

- [ ] **Rename `onJumpToScene` → `onSelectScene`** in the props interface and everywhere it's used internally. This aligns with the rest of the codebase naming.

- [ ] **Add `activeBeatId` and `onSelectBeat` to props**:
```ts
activeBeatId?: string | null;
onSelectBeat?: (beatId: string) => void;
```

- [ ] **Add beat nav derivation in the scenes map** and pass to `SceneListItem`:

```tsx
{scenes.map(scene => {
  const beatNavItems = (scene.beats ?? []).length >= 2
    ? [...(scene.beats ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((beat, i) => ({
          beatId: beat.id,
          label: String.fromCharCode(65 + i),
          isActive: beat.id === activeBeatId,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectBeat?.(beat.id);
            setOpen(false); // close sheet after navigation
          },
        }))
    : undefined;

  return (
    <SceneListItem
      key={scene.id}
      sceneNumber={scene.sceneNumber}
      slug={`${scene.int_ext}. ${scene.location_name || '—'}${scene.time_of_day ? ` — ${scene.time_of_day}` : ''}`}
      description={scene.scene_description}
      isActive={scene.id === activeSceneId}
      onClick={() => handleSelect(scene.id)}
      beats={beatNavItems}
    />
  );
})}
```

> **Note:** Check that `SceneData` type used by `SceneBottomSheet` includes `beats`. If not, extend it the same way as `SceneNav.tsx` in Task 3.

### ScriptPresentationView

- [ ] **Update `SceneBottomSheet` call** to use renamed prop and pass beat nav:
```tsx
<SceneBottomSheet
  scenes={scenes}
  activeSceneId={activeSceneId}
  onSelectScene={jumpToScene}    // renamed from onJumpToScene
  activeBeatId={current?.beatId ?? null}
  onSelectBeat={jumpToBeat}
/>
```

- [ ] **Add `jumpToBeat`** alongside `jumpToScene`:
```ts
const jumpToBeat = useCallback((beatId: string) => {
  const slideIdx = slides.findIndex(s => s.beatId === beatId);
  if (slideIdx >= 0) setIdx(slideIdx);
}, [slides]);
```

- [ ] **Pass to `SceneNav`** (left sidebar):
```tsx
<SceneNav
  scenes={scenes}
  activeSceneId={activeSceneId}
  onSelectScene={jumpToScene}
  activeBeatId={current?.beatId ?? null}
  onSelectBeat={jumpToBeat}
/>
```

- [ ] **TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Commit**
```bash
git add src/app/s/[token]/SceneBottomSheet.tsx src/app/s/[token]/ScriptPresentationView.tsx
git commit -m "feat: wire beat navigation in presentation view sidebar and mobile sheet"
```

---

## Task 7: `ScriptShareClient` — canvas sidebar beat nav

**Files:**
- Modify: `src/app/s/[token]/ScriptShareClient.tsx`

- [ ] **Fix the `computedScenes` cast** to include `sort_order` on beats (line ~100). Find the cast that defines the beats array type and add `sort_order: number`:

```ts
const computedScenes = (computed as unknown as {
  id: string;
  sceneNumber: number;
  int_ext: string;
  location_name: string;
  time_of_day: string;
  scene_description?: string | null;
  beats: { id: string; sort_order: number; audio_content: string; visual_content: string; notes_content: string }[]
}[]);
```

- [ ] **Add `handleBeatClick` scroll handler** inside `ScriptShareClient`:
```ts
const handleBeatClick = useCallback((beatId: string) => {
  const el = document.getElementById(`beat-${beatId}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, []);
```

- [ ] **Update the `SceneNav` call** to pass beats and handler:
```tsx
<SceneNav
  scenes={computedScenes.map(s => ({
    id: s.id,
    sceneNumber: s.sceneNumber,
    int_ext: s.int_ext,
    location_name: s.location_name,
    time_of_day: s.time_of_day,
    scene_description: s.scene_description ?? null,
    beats: s.beats.map(b => ({ id: b.id, sort_order: b.sort_order })),
  }))}
  activeSceneId={activeSceneId}
  onSelectScene={handleSceneClick}
  onSelectBeat={handleBeatClick}
/>
```

- [ ] **TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Commit**
```bash
git add src/app/s/[token]/ScriptShareClient.tsx
git commit -m "feat: add beat navigation to share canvas sidebar"
```

---

## Task 8: Final verification

- [ ] **Full TypeScript check — must be clean**
```bash
npx tsc --noEmit 2>&1
```
Expected: pre-existing errors only, zero new errors.

- [ ] **Admin editor — script mode** (`SceneNav` wired with `activeBeatId`):
  - Multi-beat scenes show beat cells flush right
  - Single-beat scenes unchanged
  - Clicking a beat cell navigates to that beat; cell highlights dark
  - Clicking a scene row navigates to beat A; A cell highlights

- [ ] **Share view — desktop sidebar** (`/s/[token]`):
  - Same beat cell behavior
  - Active beat tracks as you advance slides

- [ ] **Share canvas view** — clicking a beat cell in sidebar scrolls canvas to that beat

- [ ] **Mobile bottom sheet** — beat cells tappable; tapping closes sheet and navigates

- [ ] **Number alignment** — scene numbers visually aligned across all rows (multi-beat and single-beat)
