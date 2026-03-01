# FNA Admin Dashboard — Development Guidelines

## Admin Design Tokens

All admin UI colors and typography MUST use the design token system defined in `globals.css` and `tailwind.config.ts`. Never use hardcoded hex colors in admin files.

### Color Classes

| Category | Prefix | Examples |
|----------|--------|----------|
| Backgrounds | `bg-admin-bg-*` | `bg-admin-bg-base`, `bg-admin-bg-overlay`, `bg-admin-bg-hover` |
| Borders | `border-admin-border-*` | `border-admin-border`, `border-admin-border-subtle` |
| Text | `text-admin-text-*` | `text-admin-text-primary`, `text-admin-text-muted`, `text-admin-text-faint` |
| Status | `text-admin-danger`, `bg-admin-success-bg` | See full token list in globals.css |
| Hover | `hover:bg-admin-bg-hover` | Standard hover state |
| Active | `bg-admin-bg-active` | Selected/active state |
| Toolbar ROYGBIV | `text-admin-toolbar-*` | `red`, `orange`, `yellow`, `green`, `blue`, `indigo`, `violet` |

### Typography Classes

| Category | Prefix | Examples |
|----------|--------|----------|
| Font family | `font-admin-*` | `font-admin-display`, `font-admin-body`, `font-admin-mono` |
| Font size | `text-admin-*` | `text-admin-xs`, `text-admin-sm`, `text-admin-base`, `text-admin-lg` |

### Border Radius Tokens

All buttons, inputs, and containers use CSS variable-based radius via `var(--admin-radius-*)`:

| Token | Default | Tailwind |
|-------|---------|----------|
| `--admin-radius-sm` | 0.375rem | `rounded-admin-sm` |
| `--admin-radius-md` | 0.5rem | `rounded-admin-md` |
| `--admin-radius-lg` | 0.75rem | `rounded-admin-lg` |
| `--admin-radius-xl` | 1rem | `rounded-admin-xl` |
| `--admin-radius-full` | 9999px | `rounded-admin-full` |

`.btn-primary`, `.btn-secondary`, `.btn-danger`, and `.admin-input` already use `var(--admin-radius-md)`.

### Rules

1. **Never** use `bg-[#hex]`, `text-[#hex]`, or `border-[#hex]` in admin files
2. **Never** use `bg-white/N` or `bg-black/N` for backgrounds — use `bg-admin-bg-hover`, `bg-admin-bg-active`, etc.
3. **Always** use the semantic token closest to your intent
4. For new colors, add a CSS variable to `globals.css` first, then map it in `tailwind.config.ts`
5. Component utility classes (`btn-primary`, `btn-secondary`, `btn-danger`, `admin-input`) already use tokens
6. The interactive style guide at `/admin/styleguide` shows all available tokens with live previews

### Status Color Families (standardized)

- **Danger**: `admin-danger` (red) — errors, deletions, overdue
- **Success**: `admin-success` (emerald) — active, completed, approved
- **Warning**: `admin-warning` (amber) — prospects, pending, caution
- **Info**: `admin-info` (sky) — in-progress, informational

Do not mix color families (e.g., don't use `green-400` when `admin-success` exists).

---

## Button Classes

### Solid Buttons
- `.btn-primary` — Main action (Save, Create). Always last/rightmost in action groups.
- `.btn-secondary` — Secondary actions (Cancel, Export, Reset).
- `.btn-danger` — Destructive actions. Always `inline-flex items-center gap-2` (icon beside text, never stacked).

### Ghost / Icon Buttons
- `.btn-ghost` — Default grey hover for standard actions (approve, edit, settings).
- `.btn-ghost-danger` — Red hover for destructive actions (delete, remove, trash).
- `.btn-ghost-add` — Inverted (white bg + black icon) for add/new/plus actions.

### Button Sizing Convention
- Header actions: `px-4 py-2.5 text-sm` (secondary), `px-5 py-2.5 text-sm` (primary)
- Inline/compact: `px-3 py-2 text-xs`
- Icon-only: `w-10 h-10` (ghost variants)
- Mobile actions: `p-2.5` (icon-only)

---

## Page Layout Pattern

Every admin page follows this structure:

```
<div className="flex flex-col h-full overflow-hidden">
  <AdminPageHeader title="..." subtitle="..." search={...} actions={...} />
  <div className="... h-[3rem] bg-admin-bg-inset border-b ...">  {/* Toolbar */}
  <div className="flex-1 overflow-y-auto admin-scrollbar">       {/* Content */}
</div>
```

### AdminPageHeader (`_components/AdminPageHeader.tsx`)
- Fixed `h-[7rem]` header with title, subtitle, search, and action buttons
- Actions go right-to-left: secondary actions first, primary action last (far-right)
- Uses `@container` queries for responsive stacking

### Toolbar Row
- `h-[3rem] bg-admin-bg-inset border-b border-admin-border flex-shrink-0`
- Use `ToolbarButton` from `_components/table/TableToolbar.tsx` for toolbar actions
- Each toolbar button gets a ROYGBIV color: `blue`, `green`, `orange`, `red`, `purple`, `neutral`
- Popovers use `ToolbarPopover` for consistent dropdown panels

### Content Area
- `flex-1 overflow-y-auto` — only the content area scrolls, never the page
- Admin scrollbar: `admin-scrollbar` (always visible) or `admin-scrollbar-auto` (on hover)

---

## UI Patterns

### Progressive Disclosure (group hover)
Hide secondary actions until the user hovers. Use scoped Tailwind groups to prevent leakage:

```tsx
<div className="group/row hover:bg-admin-bg-hover">
  <span className="opacity-0 group-hover/row:opacity-100 transition-opacity">
    {/* Action buttons */}
  </span>
</div>
```

Use scoped names like `group/beat`, `group/ref`, `group/row`, `group/img` — never bare `group` when nesting.

### Two-State Deletion
All delete actions must use two-state confirmation:

```
State 1: Trash icon (hidden until hover) → click sets confirmDelete=true
State 2: Check (danger) + X (cancel) icons → Check executes delete, X cancels
```

Use `.btn-ghost-danger` for the trash button. Never delete on single click.

### Inline Edit Toggle
Switch between view and edit mode inline:

```
View mode: Clickable text/button → click sets editing=true
Edit mode: Input fields + Done (success) + Cancel (ghost) buttons
```

### Left-Border Color Coding
Use `border-l` with semantic colors to categorize columns or content types:

```
border-l-[var(--admin-accent)]   — Primary/audio content (purple)
border-l-[var(--admin-info)]     — Visual content (blue)
border-l-[var(--admin-warning)]  — Notes/auxiliary (amber)
border-l-[var(--admin-success)]  — Reference/supporting (green)
```

### Custom Dropdowns (AdminSelect)
Never use browser-native `<select>` in admin UI. Use `AdminSelect` from `styleguide/_components/AdminSelect.tsx`:
- Always includes search field at top
- Works for single and multi-select
- Keyboard navigable (arrows, enter, escape)
- Styled with admin tokens

### Logo Inversion (Poolside/Light Mode)
Add `admin-logo` class to all client logo `<img>` tags. This opts them out of the CSS counter-inversion so white PNGs appear black in light mode.

---

## File Structure

- Admin pages: `src/app/admin/`
- Shared admin components: `src/app/admin/_components/`
- Table system: `src/app/admin/_components/table/`
- Script editor: `src/app/admin/scripts/_components/`
- Design tokens: CSS variables in `src/app/globals.css` under `:root`
- Tailwind mapping: `tailwind.config.ts` under `colors.admin`
- Style guide: `src/app/admin/styleguide/` (only accessible to `ready@fna.wtf`)

## Verification

After any admin UI changes, run:
- `npx tsc --noEmit` — must pass clean (pre-existing errors in scripts/intake are OK)
- Check the style guide at `/admin/styleguide` for visual consistency
- Use `/review-admin` skill to check design system compliance
