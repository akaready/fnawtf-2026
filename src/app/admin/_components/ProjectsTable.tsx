'use client';

import React, { useState, useMemo, useTransition, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit2, Trash2, Eye, EyeOff, CheckSquare, Square, Minus,
  Search, ChevronDown, ChevronUp, SlidersHorizontal, X,
  Star, StarOff, ArrowUpDown, Filter, Layers, Plus,
  ChevronRight, GripVertical, Home, Briefcase, Columns,
} from 'lucide-react';
import {
  batchSetPublished, batchUpdateProjects, batchDeleteProjects,
  deleteProject, updateProject, updateProjectOrder,
} from '../actions';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ProjectRow {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  client_name: string;
  client_quote: string | null;
  type: string;
  category: string | null;
  thumbnail_url: string | null;
  preview_gif_url: string | null;
  style_tags: string[] | null;
  premium_addons: string[] | null;
  camera_techniques: string[] | null;
  assets_delivered: string[] | null;
  production_days: number | null;
  crew_count: number | null;
  talent_count: number | null;
  location_count: number | null;
  featured: boolean;
  published: boolean;
  full_width: boolean;
  hidden_from_work: boolean;
  home_order: number;
  work_order: number;
  featured_services_build: boolean;
  featured_services_launch: boolean;
  featured_services_scale: boolean;
  featured_services_crowdfunding: boolean;
  featured_services_fundraising: boolean;
  client_id: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

type ColType = 'text' | 'toggle' | 'select' | 'tags' | 'number' | 'thumbnail' | 'date';

interface ColDef {
  key: string;
  label: string;
  sortable: boolean;
  defaultVisible: boolean;
  type: ColType;
  options?: { value: string; label: string }[];
  toggleLabels?: [string, string];
  toggleColors?: [string, string];
  mono?: boolean;
  group?: string;
  maxWidth?: number;
}

const COLUMN_DEFS: ColDef[] = [
  { key: 'thumbnail', label: 'Thumb', sortable: false, defaultVisible: true, type: 'thumbnail' },
  { key: 'title', label: 'Title', sortable: true, defaultVisible: true, type: 'text' },
  { key: 'subtitle', label: 'Subtitle', sortable: true, defaultVisible: false, type: 'text', maxWidth: 250 },
  { key: 'slug', label: 'Slug', sortable: true, defaultVisible: false, type: 'text', mono: true },
  { key: 'client_name', label: 'Client', sortable: true, defaultVisible: true, type: 'text' },
  { key: 'description', label: 'Description', sortable: false, defaultVisible: false, type: 'text', maxWidth: 300 },
  { key: 'client_quote', label: 'Quote', sortable: false, defaultVisible: false, type: 'text', maxWidth: 250 },
  { key: 'type', label: 'Type', sortable: true, defaultVisible: true, type: 'select', options: [{ value: 'video', label: 'Video' }, { value: 'design', label: 'Design' }] },
  { key: 'category', label: 'Category', sortable: true, defaultVisible: false, type: 'text' },
  { key: 'featured', label: 'Homepage', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Homepage', '—'], toggleColors: ['bg-amber-500/10 text-amber-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'full_width', label: 'Full Width', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Yes', '—'], toggleColors: ['bg-purple-500/10 text-purple-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'hidden_from_work', label: 'Hide on /work', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Hidden', '—'], toggleColors: ['bg-red-500/10 text-red-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'home_order', label: 'Home #', sortable: true, defaultVisible: true, type: 'number', group: 'Page Sort' },
  { key: 'work_order', label: 'Work #', sortable: true, defaultVisible: true, type: 'number', group: 'Page Sort' },
  { key: 'style_tags', label: 'Style', sortable: false, defaultVisible: false, type: 'tags' },
  { key: 'premium_addons', label: 'Add-ons', sortable: false, defaultVisible: false, type: 'tags' },
  { key: 'camera_techniques', label: 'Techniques', sortable: false, defaultVisible: false, type: 'tags' },
  { key: 'assets_delivered', label: 'Assets', sortable: false, defaultVisible: false, type: 'tags' },
  { key: 'production_days', label: 'Days', sortable: true, defaultVisible: false, type: 'number' },
  { key: 'crew_count', label: 'Crew', sortable: true, defaultVisible: false, type: 'number' },
  { key: 'talent_count', label: 'Talent', sortable: true, defaultVisible: false, type: 'number' },
  { key: 'location_count', label: 'Locations', sortable: true, defaultVisible: false, type: 'number' },
  { key: 'featured_services_build', label: 'Svc: Build', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Yes', '—'], toggleColors: ['bg-cyan-500/10 text-cyan-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'featured_services_launch', label: 'Svc: Launch', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Yes', '—'], toggleColors: ['bg-cyan-500/10 text-cyan-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'featured_services_scale', label: 'Svc: Scale', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Yes', '—'], toggleColors: ['bg-cyan-500/10 text-cyan-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'featured_services_crowdfunding', label: 'Svc: Crowd', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Yes', '—'], toggleColors: ['bg-cyan-500/10 text-cyan-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'featured_services_fundraising', label: 'Svc: Fund', sortable: true, defaultVisible: false, type: 'toggle', toggleLabels: ['Yes', '—'], toggleColors: ['bg-cyan-500/10 text-cyan-400', 'bg-white/5 text-muted-foreground/30'] },
  { key: 'thumbnail_url', label: 'Thumb URL', sortable: false, defaultVisible: false, type: 'text', mono: true },
  { key: 'client_id', label: 'Client ID', sortable: false, defaultVisible: false, type: 'text', mono: true },
  { key: 'updated_by', label: 'Updated By', sortable: false, defaultVisible: false, type: 'text', mono: true },
  { key: 'created_at', label: 'Created', sortable: true, defaultVisible: false, type: 'date' },
  { key: 'updated_at', label: 'Updated', sortable: true, defaultVisible: true, type: 'date' },
  { key: 'published', label: 'Published', sortable: true, defaultVisible: true, type: 'toggle', toggleLabels: ['Published', 'Draft'], toggleColors: ['bg-green-500/10 text-green-400', 'bg-white/5 text-muted-foreground/50'], group: 'Status' },
];

type ColumnKey = string;

/* ── Filter operators by column type ────────────────────────────────────── */

const OPERATORS_BY_TYPE: Record<ColType, { value: string; label: string }[]> = {
  text:      [{ value: 'contains', label: 'contains' }, { value: 'equals', label: 'equals' }, { value: 'not_contains', label: 'does not contain' }, { value: 'is_empty', label: 'is empty' }, { value: 'is_not_empty', label: 'is not empty' }],
  toggle:    [{ value: 'is_true', label: 'is true' }, { value: 'is_false', label: 'is false' }],
  select:    [{ value: 'is', label: 'is' }, { value: 'is_not', label: 'is not' }],
  number:    [{ value: 'eq', label: '=' }, { value: 'neq', label: '≠' }, { value: 'gt', label: '>' }, { value: 'lt', label: '<' }, { value: 'gte', label: '≥' }, { value: 'lte', label: '≤' }, { value: 'is_empty', label: 'is empty' }],
  tags:      [{ value: 'contains', label: 'contains' }, { value: 'is_empty', label: 'is empty' }, { value: 'is_not_empty', label: 'is not empty' }],
  date:      [{ value: 'before', label: 'before' }, { value: 'after', label: 'after' }, { value: 'is_empty', label: 'is empty' }],
  thumbnail: [{ value: 'is_empty', label: 'is empty' }, { value: 'is_not_empty', label: 'is not empty' }],
};

const NO_VALUE_OPS = new Set(['is_empty', 'is_not_empty', 'is_true', 'is_false']);

interface SortRule { key: string; dir: 'asc' | 'desc' }
interface FilterRule { field: string; operator: string; value: string }

/* ── Inline-editable text cell ──────────────────────────────────────────── */

function EditableTextCell({
  value,
  projectId,
  field,
  className,
  mono,
}: {
  value: string;
  projectId: string;
  field: string;
  className?: string;
  mono?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => { setDraft(value); }, [value]);

  const save = useCallback(() => {
    setEditing(false);
    if (draft.trim() === value) return;
    startTransition(async () => {
      await updateProject(projectId, { [field]: draft.trim() || null });
      router.refresh();
    });
  }, [draft, value, projectId, field, router]);

  if (!editing) {
    return (
      <span
        onDoubleClick={() => setEditing(true)}
        className={`cursor-text hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition-colors inline-block w-full truncate ${mono ? 'font-mono text-xs' : ''} ${className ?? ''}`}
        title={value || 'Double-click to edit'}
      >
        {value || <span className="text-muted-foreground/30 italic">—</span>}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
      className={`w-full bg-black border border-white/20 rounded px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:border-white/40 ${mono ? 'font-mono text-xs' : ''}`}
    />
  );
}

/* ── Inline-editable number cell ────────────────────────────────────────── */

function EditableNumberCell({
  value,
  projectId,
  field,
}: {
  value: number | null;
  projectId: string;
  field: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? '');
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => { setDraft(value?.toString() ?? ''); }, [value]);

  const save = useCallback(() => {
    setEditing(false);
    const num = draft.trim() === '' ? null : Number(draft);
    if (num === value) return;
    startTransition(async () => {
      await updateProject(projectId, { [field]: num });
      router.refresh();
    });
  }, [draft, value, projectId, field, router]);

  if (!editing) {
    return (
      <span
        onDoubleClick={() => setEditing(true)}
        className="cursor-text hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition-colors text-muted-foreground tabular-nums"
        title="Double-click to edit"
      >
        {value ?? <span className="text-muted-foreground/30">—</span>}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') { setDraft(value?.toString() ?? ''); setEditing(false); }
      }}
      className="w-16 bg-black border border-white/20 rounded px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:border-white/40 tabular-nums"
    />
  );
}

/* ── Inline toggle cell (boolean) ───────────────────────────────────────── */

function ToggleCell({
  value,
  projectId,
  field,
  labelTrue,
  labelFalse,
  colorTrue,
  colorFalse,
}: {
  value: boolean;
  projectId: string;
  field: string;
  labelTrue: string;
  labelFalse: string;
  colorTrue: string;
  colorFalse: string;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    startTransition(async () => {
      await updateProject(projectId, { [field]: !value });
      router.refresh();
    });
  };

  return (
    <button onClick={toggle} className="group">
      <span
        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
          value ? colorTrue : colorFalse
        } group-hover:ring-1 group-hover:ring-white/20`}
      >
        {value ? labelTrue : labelFalse}
      </span>
    </button>
  );
}

/* ── Inline select cell ─────────────────────────────────────────────────── */

function SelectCell({
  value,
  projectId,
  field,
  options,
}: {
  value: string;
  projectId: string;
  field: string;
  options: { value: string; label: string }[];
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (newVal: string) => {
    if (newVal === value) return;
    startTransition(async () => {
      await updateProject(projectId, { [field]: newVal });
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-transparent text-muted-foreground text-sm capitalize cursor-pointer hover:text-foreground focus:outline-none pr-5 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
    </div>
  );
}

/* ── Editable Tags cell with autocomplete ──────────────────────────────── */

function EditableTagsCell({
  tags,
  projectId,
  field,
  suggestions,
}: {
  tags: string[] | null;
  projectId: string;
  field: string;
  suggestions?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string[]>(tags ?? []);
  const [input, setInput] = useState('');
  const [hlIndex, setHlIndex] = useState(-1);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!suggestions || !input.trim()) return [];
    const q = input.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q) && !value.includes(s)).slice(0, 8);
  }, [suggestions, input, value]);

  const addTag = useCallback((tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    const next = [...value, t];
    setValue(next);
    setInput('');
    setHlIndex(-1);
    startTransition(async () => {
      await updateProject(projectId, { [field]: next });
    });
  }, [value, projectId, field]);

  const removeTag = useCallback((tag: string) => {
    const next = value.filter((t) => t !== tag);
    setValue(next);
    startTransition(async () => {
      await updateProject(projectId, { [field]: next });
    });
  }, [value, projectId, field]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHlIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHlIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (hlIndex >= 0 && filtered[hlIndex]) addTag(filtered[hlIndex]);
      else if (input.trim()) addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  // Click outside to close
  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing]);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className="cursor-pointer min-h-[24px] flex flex-wrap gap-1 w-full">
        {(!tags || tags.length === 0) ? (
          <span className="text-muted-foreground/30 text-xs">—</span>
        ) : tags.map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground/70 whitespace-nowrap">{t}</span>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-[180px]">
      <div className="flex flex-wrap gap-1 items-center border border-border/60 rounded-lg bg-black/60 px-2 py-1">
        {value.map((t) => (
          <span key={t} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-foreground/80">
            {t}
            <button onClick={() => removeTag(t)} className="ml-0.5 text-muted-foreground/50 hover:text-foreground">×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setHlIndex(-1); }}
          onKeyDown={handleKeyDown}
          placeholder="Add…"
          className="flex-1 min-w-[50px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 outline-none"
        />
      </div>
      {filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#111] border border-border/40 rounded-lg shadow-xl max-h-40 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={s}
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                i === hlIndex ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Render a cell based on column def ──────────────────────────────────── */

function renderCell(col: ColDef, project: ProjectRow, tagSuggestions?: Record<string, string[]>) {
  const val = (project as unknown as Record<string, unknown>)[col.key];

  switch (col.type) {
    case 'thumbnail':
      return project.thumbnail_url ? (
        <div className="w-9 h-6 rounded overflow-hidden bg-white/5 flex-shrink-0">
          <img src={project.thumbnail_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-9 h-6 rounded bg-white/5 flex-shrink-0" />
      );

    case 'text':
      return (
        <EditableTextCell
          value={(val as string) ?? ''}
          projectId={project.id}
          field={col.key}
          className={col.key === 'title' ? 'font-medium text-foreground' : 'text-muted-foreground'}
          mono={col.mono}
        />
      );

    case 'number':
      return (
        <EditableNumberCell
          value={val as number | null}
          projectId={project.id}
          field={col.key}
        />
      );

    case 'toggle':
      return (
        <ToggleCell
          value={val as boolean}
          projectId={project.id}
          field={col.key}
          labelTrue={col.toggleLabels![0]}
          labelFalse={col.toggleLabels![1]}
          colorTrue={col.toggleColors![0]}
          colorFalse={col.toggleColors![1]}
        />
      );

    case 'select':
      return (
        <SelectCell
          value={(val as string) ?? ''}
          projectId={project.id}
          field={col.key}
          options={col.options!}
        />
      );

    case 'tags':
      return (
        <EditableTagsCell
          tags={val as string[] | null}
          projectId={project.id}
          field={col.key}
          suggestions={tagSuggestions?.[col.key]}
        />
      );

    case 'date':
      return (
        <span className="text-muted-foreground/60 text-xs whitespace-nowrap">
          {new Date(val as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      );
  }
}

/* ── Toolbar popover wrapper ────────────────────────────────────────────── */

function ToolbarPopover({
  children,
  onClose,
  width,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let input elements handle Escape themselves first
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute left-0 top-full mt-2 bg-[#111] border border-border/60 rounded-xl shadow-2xl p-3 z-40 ${width ?? 'w-80'}`}
    >
      {children}
    </div>
  );
}

/* ── Toolbar button ─────────────────────────────────────────────────────── */

function ToolbarButton({
  icon: Icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  label: string;
  badge?: string | number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors whitespace-nowrap ${
        active
          ? 'border-accent/40 text-accent bg-accent/5'
          : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-white/20'
      }`}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label}
      {badge !== undefined && badge !== 0 && (
        <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Sort panel ─────────────────────────────────────────────────────────── */

function SortPanel({
  sorts,
  onChange,
  onClose,
}: {
  sorts: SortRule[];
  onChange: (s: SortRule[]) => void;
  onClose: () => void;
}) {
  const sortableCols = COLUMN_DEFS.filter((c) => c.sortable);

  const addSort = () => {
    const used = new Set(sorts.map((s) => s.key));
    const next = sortableCols.find((c) => !used.has(c.key));
    if (next) onChange([...sorts, { key: next.key, dir: 'asc' }]);
  };

  const updateSort = (idx: number, patch: Partial<SortRule>) => {
    const next = sorts.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  const removeSort = (idx: number) => {
    onChange(sorts.filter((_, i) => i !== idx));
  };

  return (
    <ToolbarPopover onClose={onClose} width="w-96">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Sort by</div>
        {sorts.length === 0 && (
          <p className="text-sm text-muted-foreground/40 py-2">No sorts applied. Showing default order.</p>
        )}
        {sorts.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={s.key}
              onChange={(e) => updateSort(i, { key: e.target.value })}
              className="flex-1 appearance-none bg-white/[0.03] border border-border/40 rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-white/20"
            >
              {sortableCols.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <button
              onClick={() => updateSort(i, { dir: s.dir === 'asc' ? 'desc' : 'asc' })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors whitespace-nowrap"
            >
              {s.dir === 'asc' ? (
                <><ChevronUp size={12} /> A→Z</>
              ) : (
                <><ChevronDown size={12} /> Z→A</>
              )}
            </button>
            <button
              onClick={() => removeSort(i)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addSort}
          disabled={sorts.length >= sortableCols.length}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1 disabled:opacity-30"
        >
          <Plus size={14} /> Add sort
        </button>
      </div>
    </ToolbarPopover>
  );
}

/* ── Filter panel ───────────────────────────────────────────────────────── */

function FilterPanel({
  filters,
  onChange,
  onClose,
}: {
  filters: FilterRule[];
  onChange: (f: FilterRule[]) => void;
  onClose: () => void;
}) {
  const filterableCols = COLUMN_DEFS.filter((c) => c.type !== 'thumbnail');

  const addFilter = () => {
    const col = filterableCols[0];
    const ops = OPERATORS_BY_TYPE[col.type];
    onChange([...filters, { field: col.key, operator: ops[0].value, value: '' }]);
  };

  const updateFilter = (idx: number, patch: Partial<FilterRule>) => {
    const next = filters.map((f, i) => {
      if (i !== idx) return f;
      const updated = { ...f, ...patch };
      // When field changes, reset operator and value
      if (patch.field && patch.field !== f.field) {
        const newCol = COLUMN_DEFS.find((c) => c.key === patch.field)!;
        const ops = OPERATORS_BY_TYPE[newCol.type];
        updated.operator = ops[0].value;
        updated.value = '';
      }
      // When operator changes to a no-value op, clear value
      if (patch.operator && NO_VALUE_OPS.has(patch.operator)) {
        updated.value = '';
      }
      return updated;
    });
    onChange(next);
  };

  const removeFilter = (idx: number) => {
    onChange(filters.filter((_, i) => i !== idx));
  };

  return (
    <ToolbarPopover onClose={onClose} width="w-[520px]">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Filter where</div>
        {filters.length === 0 && (
          <p className="text-sm text-muted-foreground/40 py-2">No filters applied. Showing all projects.</p>
        )}
        {filters.map((f, i) => {
          const col = COLUMN_DEFS.find((c) => c.key === f.field) ?? filterableCols[0];
          const ops = OPERATORS_BY_TYPE[col.type];
          const needsValue = !NO_VALUE_OPS.has(f.operator);

          return (
            <div key={i} className="flex items-center gap-2">
              <select
                value={f.field}
                onChange={(e) => updateFilter(i, { field: e.target.value })}
                className="w-32 appearance-none bg-white/[0.03] border border-border/40 rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-white/20 truncate"
              >
                {filterableCols.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <select
                value={f.operator}
                onChange={(e) => updateFilter(i, { operator: e.target.value })}
                className="w-36 appearance-none bg-white/[0.03] border border-border/40 rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-white/20"
              >
                {ops.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {needsValue ? (
                col.type === 'select' && col.options ? (
                  <select
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    className="flex-1 appearance-none bg-white/[0.03] border border-border/40 rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-white/20"
                  >
                    <option value="">Any</option>
                    {col.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    placeholder={col.type === 'tags' ? 'tag name…' : 'value…'}
                    className="flex-1 bg-white/[0.03] border border-border/40 rounded-lg px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-white/20"
                  />
                )
              ) : (
                <div className="flex-1" />
              )}
              <button
                onClick={() => removeFilter(i)}
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
        <button
          onClick={addFilter}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <Plus size={14} /> Add filter
        </button>
      </div>
    </ToolbarPopover>
  );
}

/* ── Group panel ────────────────────────────────────────────────────────── */

function GroupPanel({
  groupField,
  onChange,
  onClose,
}: {
  groupField: string | null;
  onChange: (f: string | null) => void;
  onClose: () => void;
}) {
  const groupableCols = COLUMN_DEFS.filter((c) => c.type === 'toggle' || c.type === 'select' || c.key === 'category' || c.key === 'client_name');

  return (
    <ToolbarPopover onClose={onClose} width="w-64">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Group by</div>
        <label
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
            !groupField ? 'bg-white/5 text-foreground' : 'text-muted-foreground hover:bg-white/5'
          }`}
        >
          <input
            type="radio"
            name="group"
            checked={!groupField}
            onChange={() => onChange(null)}
            className="accent-white"
          />
          None
        </label>
        {groupableCols.map((col) => (
          <label
            key={col.key}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
              groupField === col.key ? 'bg-white/5 text-foreground' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name="group"
              checked={groupField === col.key}
              onChange={() => onChange(col.key)}
              className="accent-white"
            />
            {col.label}
          </label>
        ))}
      </div>
    </ToolbarPopover>
  );
}

/* ── Fields panel ───────────────────────────────────────────────────────── */

function FieldsPanel({
  visibleCols,
  onToggle,
  onShowAll,
  onHideAll,
  onClose,
}: {
  visibleCols: Set<ColumnKey>;
  onToggle: (key: ColumnKey) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onClose: () => void;
}) {
  const [fieldSearch, setFieldSearch] = useState('');

  const filteredCols = useMemo(() => {
    if (!fieldSearch) return COLUMN_DEFS;
    const q = fieldSearch.toLowerCase();
    return COLUMN_DEFS.filter((c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
  }, [fieldSearch]);

  // Group columns: custom group first, then by type
  const groups: { label: string; cols: ColDef[] }[] = useMemo(() => {
    const customGrouped = new Map<string, ColDef[]>();
    const ungrouped = { text: [] as ColDef[], toggle: [] as ColDef[], number: [] as ColDef[], tags: [] as ColDef[], other: [] as ColDef[] };

    for (const c of filteredCols) {
      if (c.group) {
        const list = customGrouped.get(c.group) ?? [];
        list.push(c);
        customGrouped.set(c.group, list);
      } else if (c.type === 'text' || c.type === 'thumbnail') ungrouped.text.push(c);
      else if (c.type === 'toggle') ungrouped.toggle.push(c);
      else if (c.type === 'number') ungrouped.number.push(c);
      else if (c.type === 'tags') ungrouped.tags.push(c);
      else ungrouped.other.push(c);
    }

    const result: { label: string; cols: ColDef[] }[] = [];
    if (ungrouped.text.length) result.push({ label: 'Text', cols: ungrouped.text });
    if (ungrouped.toggle.length) result.push({ label: 'Toggles', cols: ungrouped.toggle });
    if (ungrouped.number.length) result.push({ label: 'Scope', cols: ungrouped.number });
    if (ungrouped.tags.length) result.push({ label: 'Tags', cols: ungrouped.tags });
    for (const [label, cols] of customGrouped) result.push({ label, cols });
    if (ungrouped.other.length) result.push({ label: 'Other', cols: ungrouped.other });
    return result;
  }, [filteredCols]);

  return (
    <ToolbarPopover onClose={onClose} width="w-64">
      <div className="space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Search fields…"
            className="w-full pl-8 pr-3 py-1.5 bg-white/[0.03] border border-border/40 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-white/20"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 pb-1 border-b border-border/20">
          <button onClick={onShowAll} className="text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">
            Show all
          </button>
          <span className="text-muted-foreground/20">·</span>
          <button onClick={onHideAll} className="text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors">
            Hide all
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="text-[10px] text-muted-foreground/30 uppercase tracking-wider font-medium px-2.5 mb-1">
                {g.label}
              </div>
              {g.cols.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-sm cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={visibleCols.has(col.key)}
                    onChange={() => onToggle(col.key)}
                    className="accent-white rounded"
                  />
                  <span className={visibleCols.has(col.key) ? 'text-foreground' : 'text-muted-foreground/50'}>
                    {col.label}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    </ToolbarPopover>
  );
}

/* ── Filter evaluation ──────────────────────────────────────────────────── */

function evaluateFilter(row: ProjectRow, rule: FilterRule): boolean {
  const rawVal = (row as unknown as Record<string, unknown>)[rule.field];

  switch (rule.operator) {
    case 'is_empty':
      return rawVal == null || rawVal === '' || (Array.isArray(rawVal) && rawVal.length === 0);
    case 'is_not_empty':
      return rawVal != null && rawVal !== '' && !(Array.isArray(rawVal) && rawVal.length === 0);
    case 'is_true':
      return rawVal === true;
    case 'is_false':
      return rawVal === false || rawVal == null;
    case 'contains': {
      if (Array.isArray(rawVal)) {
        return rule.value ? rawVal.some((t) => String(t).toLowerCase().includes(rule.value.toLowerCase())) : true;
      }
      return String(rawVal ?? '').toLowerCase().includes(rule.value.toLowerCase());
    }
    case 'not_contains':
      return !String(rawVal ?? '').toLowerCase().includes(rule.value.toLowerCase());
    case 'equals':
      return String(rawVal ?? '').toLowerCase() === rule.value.toLowerCase();
    case 'is':
      return !rule.value || String(rawVal) === rule.value;
    case 'is_not':
      return !rule.value || String(rawVal) !== rule.value;
    case 'eq':
      return Number(rawVal) === Number(rule.value);
    case 'neq':
      return Number(rawVal) !== Number(rule.value);
    case 'gt':
      return Number(rawVal) > Number(rule.value);
    case 'lt':
      return Number(rawVal) < Number(rule.value);
    case 'gte':
      return Number(rawVal) >= Number(rule.value);
    case 'lte':
      return Number(rawVal) <= Number(rule.value);
    case 'before':
      return rule.value ? new Date(rawVal as string) < new Date(rule.value) : true;
    case 'after':
      return rule.value ? new Date(rawVal as string) > new Date(rule.value) : true;
    default:
      return true;
  }
}

/* ── Compare helper for multi-sort ──────────────────────────────────────── */

function compareValues(aRaw: unknown, bRaw: unknown, dir: 'asc' | 'desc'): number {
  let cmp = 0;
  if (typeof aRaw === 'string' && typeof bRaw === 'string') {
    cmp = aRaw.localeCompare(bRaw);
  } else if (typeof aRaw === 'boolean' && typeof bRaw === 'boolean') {
    cmp = Number(aRaw) - Number(bRaw);
  } else if (typeof aRaw === 'number' && typeof bRaw === 'number') {
    cmp = aRaw - bRaw;
  } else {
    // dates or mixed: stringify
    cmp = String(aRaw ?? '').localeCompare(String(bRaw ?? ''));
  }
  return dir === 'asc' ? cmp : -cmp;
}

/* ── Session storage persistence ────────────────────────────────────────── */

const STORAGE_KEY = 'fna-admin-table-state';

interface PersistedTableState {
  search: string;
  sorts: SortRule[];
  filters: FilterRule[];
  groupField: string | null;
  collapsedGroups: string[];
  visibleCols: string[];
  colWidths: Record<string, number>;
  colOrder: string[];
  freezeCount: number;
}

function loadTableState(): Partial<PersistedTableState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedTableState>;
  } catch {
    return null;
  }
}

function saveTableState(state: PersistedTableState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

/* ── Main table ─────────────────────────────────────────────────────────── */

export function ProjectsTable({ projects, tagSuggestions, exportRef }: { projects: ProjectRow[]; tagSuggestions?: Record<string, string[]>; exportRef?: React.MutableRefObject<(() => void) | null> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const defaultVisibleCols = useMemo(() => new Set(COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.key)), []);

  const [search, setSearch] = useState('');
  const [sorts, setSorts] = useState<SortRule[]>([{ key: 'updated_at', dir: 'desc' }]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [groupField, setGroupField] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(defaultVisibleCols);
  const [openPanel, setOpenPanel] = useState<'sort' | 'filter' | 'group' | 'fields' | null>(null);
  const [orderMode, setOrderMode] = useState<'home_order' | 'work_order'>('home_order');
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [colOrder, setColOrder] = useState<string[]>(() => COLUMN_DEFS.map((c) => c.key));
  const [freezeCount, setFreezeCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Restore view state from sessionStorage after hydration
  useEffect(() => {
    const saved = loadTableState();
    if (saved) {
      if (saved.search != null) setSearch(saved.search);
      if (saved.sorts) setSorts(saved.sorts);
      if (saved.filters) setFilters(saved.filters);
      if (saved.groupField !== undefined) setGroupField(saved.groupField);
      if (saved.collapsedGroups) setCollapsedGroups(new Set(saved.collapsedGroups));
      if (saved.visibleCols && saved.visibleCols.length > 0) setVisibleCols(new Set(saved.visibleCols));
      if (saved.colWidths) setColWidths(saved.colWidths);
      if (saved.freezeCount != null) setFreezeCount(saved.freezeCount);
      if (saved.colOrder && saved.colOrder.length > 0) {
        // Merge: use saved order but append any new columns not in saved state
        const allKeys = COLUMN_DEFS.map((c) => c.key);
        const savedSet = new Set(saved.colOrder);
        const merged = [...saved.colOrder.filter((k) => allKeys.includes(k)), ...allKeys.filter((k) => !savedSet.has(k))];
        setColOrder(merged);
      }
    }
    setHydrated(true);
  }, []);

  // Persist view state to sessionStorage on change (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveTableState({
      search,
      sorts,
      filters,
      groupField,
      collapsedGroups: Array.from(collapsedGroups),
      visibleCols: Array.from(visibleCols),
      colWidths,
      colOrder,
      freezeCount,
    });
  }, [hydrated, search, sorts, filters, groupField, collapsedGroups, visibleCols, colWidths, colOrder, freezeCount]);

  const togglePanel = useCallback((panel: typeof openPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => setOpenPanel(null), []);

  /* ── Ordered visible columns ────────────────────────────────────── */

  const orderedVisibleCols = useMemo(() => {
    const colMap = new Map(COLUMN_DEFS.map((c) => [c.key, c]));
    return colOrder.filter((k) => visibleCols.has(k) && colMap.has(k)).map((k) => colMap.get(k)!);
  }, [colOrder, visibleCols]);

  /* ── Freeze column offsets ────────────────────────────────────────── */

  // The first 2 columns (grip + checkbox) are always frozen.
  // freezeCount = how many data columns after those are also frozen.
  // All widths are measured from the DOM to avoid gaps.
  const tableRef = useRef<HTMLDivElement>(null);
  const [measuredHeaderWidths, setMeasuredHeaderWidths] = useState<number[]>([]);

  // Measure ALL header column widths from the DOM after render
  const prevMeasuredRef = useRef<string>('');
  useEffect(() => {
    if (!tableRef.current) return;
    const headerRow = tableRef.current.querySelector('thead tr');
    if (!headerRow) return;
    const ths = Array.from(headerRow.querySelectorAll('th'));
    const widths = ths.map((th) => Math.round(th.getBoundingClientRect().width));
    const key = JSON.stringify(widths);
    if (key !== prevMeasuredRef.current) {
      prevMeasuredRef.current = key;
      setMeasuredHeaderWidths(widths);
    }
  });

  // Get width for a data column (by key)
  const getColWidth = useCallback((key: string) => {
    if (colWidths[key]) return colWidths[key];
    // Find index in orderedVisibleCols, then offset by 2 (grip + checkbox)
    const idx = orderedVisibleCols.findIndex((c) => c.key === key);
    if (idx >= 0 && measuredHeaderWidths[idx + 2]) return measuredHeaderWidths[idx + 2];
    return 120;
  }, [colWidths, orderedVisibleCols, measuredHeaderWidths]);

  // gripWidth and checkboxWidth from measured DOM (fallback to reasonable defaults)
  const gripWidth = measuredHeaderWidths[0] ?? 34;
  const checkboxWidth = measuredHeaderWidths[1] ?? 47;

  const frozenOffsets = useMemo(() => {
    const offsets: number[] = [];
    let left = 0;
    // Fixed columns first
    offsets.push(left); left += gripWidth;
    offsets.push(left); left += checkboxWidth;
    // Then frozen data columns
    for (let i = 0; i < freezeCount && i < orderedVisibleCols.length; i++) {
      offsets.push(left);
      left += getColWidth(orderedVisibleCols[i].key);
    }
    return offsets;
  }, [freezeCount, orderedVisibleCols, getColWidth, gripWidth, checkboxWidth]);

  const freezeLineLeft = useMemo(() => {
    if (frozenOffsets.length === 0) return 0;
    const lastOffset = frozenOffsets[frozenOffsets.length - 1];
    if (freezeCount > 0 && orderedVisibleCols[freezeCount - 1]) {
      return lastOffset + getColWidth(orderedVisibleCols[freezeCount - 1].key);
    }
    return lastOffset + checkboxWidth;
  }, [frozenOffsets, freezeCount, orderedVisibleCols, getColWidth, checkboxWidth]);

  /* ── Column drag-and-drop ───────────────────────────────────────── */

  const dragColRef = useRef<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  const handleColDragStart = useCallback((e: React.DragEvent, key: string) => {
    dragColRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  }, []);

  const handleColDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    dragColRef.current = null;
    setDragOverColKey(null);
  }, []);

  const handleColDragOver = useCallback((e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColKey(key);
  }, []);

  const handleColDrop = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    setDragOverColKey(null);
    const sourceKey = dragColRef.current;
    if (!sourceKey || sourceKey === targetKey) return;

    // Capture actual rendered widths of both columns before reorder
    // so they keep their size when moved
    const tableEl = tableRef.current;
    if (tableEl) {
      const headerRow = tableEl.querySelector('thead tr');
      if (headerRow) {
        const ths = Array.from(headerRow.querySelectorAll('th'));
        // First 2 ths are grip + checkbox, data cols start at index 2
        setColWidths((prev) => {
          const next = { ...prev };
          for (let i = 2; i < ths.length - 1; i++) { // -1 to skip actions column
            const colIdx = i - 2;
            if (colIdx < orderedVisibleCols.length) {
              const key = orderedVisibleCols[colIdx].key;
              if (!next[key]) {
                next[key] = ths[i].getBoundingClientRect().width;
              }
            }
          }
          return next;
        });
      }
    }

    setColOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(sourceKey);
      const toIdx = next.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, sourceKey);
      return next;
    });
  }, [orderedVisibleCols]);

  /* ── Drag-and-drop state ────────────────────────────────────────── */

  const dragRowId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /* ── Derived data ──────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = projects;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.subtitle ?? '').toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q)
      );
    }

    // Apply filter rules
    for (const f of filters) {
      result = result.filter((row) => evaluateFilter(row, f));
    }

    // Apply multi-sort
    result = [...result].sort((a, b) => {
      for (const s of sorts) {
        const aVal = (a as unknown as Record<string, unknown>)[s.key];
        const bVal = (b as unknown as Record<string, unknown>)[s.key];
        const cmp = compareValues(aVal, bVal, s.dir);
        if (cmp !== 0) return cmp;
      }
      return 0;
    });

    return result;
  }, [projects, search, filters, sorts]);

  // Compute groups
  const groups = useMemo(() => {
    if (!groupField) return null;
    const col = COLUMN_DEFS.find((c) => c.key === groupField);
    const map = new Map<string, ProjectRow[]>();
    for (const row of filtered) {
      const raw = (row as unknown as Record<string, unknown>)[groupField];
      let label: string;
      if (typeof raw === 'boolean') {
        if (col?.toggleLabels) {
          label = raw ? col.toggleLabels[0] : col.toggleLabels[1];
        } else {
          label = raw ? 'Yes' : 'No';
        }
      } else {
        label = raw != null && raw !== '' ? String(raw) : '(empty)';
      }
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(row);
    }
    return map;
  }, [filtered, groupField]);

  /* ── Drag-and-drop handlers ─────────────────────────────────────── */

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    dragRowId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    const row = (e.currentTarget as HTMLElement).closest('tr');
    if (row) row.style.opacity = '0.4';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const row = (e.currentTarget as HTMLElement).closest('tr');
    if (row) row.style.opacity = '1';
    dragRowId.current = null;
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    if (!dragRowId.current) return; // ignore column drags
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    if (!dragRowId.current) return; // ignore column drags
    e.preventDefault();
    setDragOverId(null);
    const sourceId = dragRowId.current;
    if (!sourceId || sourceId === targetId) return;

    const ids = filtered.map((p) => p.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, sourceId);

    const updates = ids.map((id, i) => ({ id, order: i }));
    startTransition(async () => {
      await updateProjectOrder(orderMode, updates);
      router.refresh();
    });
  }, [filtered, router, startTransition, orderMode]);

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSort = (key: string) => {
    // Skip if we just finished a column resize drag
    if (resizingRef.current) return;
    // Column header click: set as single sort
    setSorts((prev) => {
      if (prev.length === 1 && prev[0].key === key) {
        return [{ key, dir: prev[0].dir === 'asc' ? 'desc' : 'asc' }];
      }
      return [{ key, dir: 'asc' }];
    });
  };

  const toggleCol = (key: ColumnKey) => {
    const next = new Set(visibleCols);
    next.has(key) ? next.delete(key) : next.add(key);
    setVisibleCols(next);
  };

  const showAllCols = () => setVisibleCols(new Set(COLUMN_DEFS.map((c) => c.key)));
  const hideAllCols = () => setVisibleCols(new Set());

  const toggleGroup = (label: string) => {
    const next = new Set(collapsedGroups);
    next.has(label) ? next.delete(label) : next.add(label);
    setCollapsedGroups(next);
  };

  const handleBatchPublish = (published: boolean) => {
    startTransition(async () => {
      await batchSetPublished(Array.from(selected), published);
      setSelected(new Set());
      router.refresh();
    });
  };

  const handleBatchUpdate = (data: Record<string, unknown>) => {
    startTransition(async () => {
      await batchUpdateProjects(Array.from(selected), data);
      setSelected(new Set());
      router.refresh();
    });
  };

  const handleBatchDelete = () => {
    startTransition(async () => {
      await batchDeleteProjects(Array.from(selected));
      setSelected(new Set());
      setConfirmDelete(null);
      router.refresh();
    });
  };

  const handleExportCsv = useCallback(() => {
    const header = orderedVisibleCols.map((c) => c.label);
    const rows = filtered.map((p) => {
      return orderedVisibleCols.map((col) => {
        const val = (p as unknown as Record<string, unknown>)[col.key];
        if (val == null) return '';
        if (Array.isArray(val)) return val.join('; ');
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        if (col.type === 'date') return new Date(val as string).toLocaleDateString();
        return String(val);
      });
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, orderedVisibleCols]);

  // Expose export function to parent via ref
  useEffect(() => {
    if (exportRef) exportRef.current = handleExportCsv;
  }, [exportRef, handleExportCsv]);

  const handleDeleteOne = (id: string) => {
    startTransition(async () => {
      await deleteProject(id);
      setConfirmDelete(null);
      router.refresh();
    });
  };

  const SortIcon = ({ col }: { col: string }) => {
    const rule = sorts.find((s) => s.key === col);
    if (!rule) return <ChevronDown size={12} className="opacity-0 group-hover:opacity-30 ml-1" />;
    return rule.dir === 'asc' ? (
      <ChevronUp size={12} className="ml-1 text-foreground" />
    ) : (
      <ChevronDown size={12} className="ml-1 text-foreground" />
    );
  };

  /* ── Column resize handler ────────────────────────────────────── */

  const resizingRef = useRef(false);

  const handleColResize = useCallback((colKey: string, nextColKey: string | null, startX: number, startWidth: number, nextStartWidth: number) => {
    let didMove = false;
    const onMouseMove = (e: MouseEvent) => {
      didMove = true;
      resizingRef.current = true;
      const delta = e.clientX - startX;
      const newWidth = Math.max(40, startWidth + delta);
      setColWidths((prev) => {
        const next = { ...prev, [colKey]: newWidth };
        if (nextColKey) {
          next[nextColKey] = Math.max(40, nextStartWidth - delta);
        }
        return next;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Suppress the click event that fires after mouseup on the th
      if (didMove) {
        setTimeout(() => { resizingRef.current = false; }, 0);
      }
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const stickyStyle = (offsetIdx: number, isHeader?: boolean): React.CSSProperties | undefined => {
    if (offsetIdx < frozenOffsets.length) {
      return {
        position: 'sticky',
        left: frozenOffsets[offsetIdx],
        zIndex: 20,
        backgroundColor: isHeader ? '#191919' : '#0d0d0d',
      };
    }
    return undefined;
  };

  /* ── Freeze line drag handler ──────────────────────────────────── */

  const handleFreezeDrag = useCallback((_startX: number) => {
    const onMouseMove = (e: MouseEvent) => {
      if (!tableRef.current) return;
      const tableRect = tableRef.current.getBoundingClientRect();
      const scrollLeft = tableRef.current.scrollLeft;
      const relativeX = e.clientX - tableRect.left + scrollLeft;

      // Calculate which column boundary is closest
      // Start after the fixed cols (grip + checkbox)
      let cumLeft = gripWidth + checkboxWidth;
      let bestCount = 0;
      for (let i = 0; i < orderedVisibleCols.length; i++) {
        const colW = getColWidth(orderedVisibleCols[i].key);
        const colMid = cumLeft + colW / 2;
        if (relativeX > colMid) {
          bestCount = i + 1;
        }
        cumLeft += colW;
      }
      setFreezeCount(bestCount);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [orderedVisibleCols, getColWidth, gripWidth, checkboxWidth]);

  const thClass =
    'text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground/60 font-medium select-none whitespace-nowrap relative overflow-hidden';
  const thSortClass = `${thClass} cursor-pointer group hover:text-muted-foreground transition-colors`;

  const visibleColCount = 3 + visibleCols.size;

  /* ── Render row ──────────────────────────────────────────────── */

  const renderRow = (project: ProjectRow) => (
    <tr
      key={project.id}
      onDragOver={(e) => handleDragOver(e, project.id)}
      onDrop={(e) => handleDrop(e, project.id)}
      className={`border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors ${
        selected.has(project.id) ? 'bg-white/[0.03]' : ''
      } ${dragOverId === project.id ? 'border-t-2 border-t-accent' : ''}`}
    >
      <td className="w-8 px-1 py-3" style={stickyStyle(0)}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, project.id)}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors flex items-center justify-center"
        >
          <GripVertical size={14} />
        </div>
      </td>
      <td className="px-4 py-3" style={stickyStyle(1)}>
        <button onClick={() => toggleOne(project.id)} className="text-muted-foreground hover:text-foreground transition-colors">
          {selected.has(project.id) ? <CheckSquare size={15} className="text-accent" /> : <Square size={15} />}
        </button>
      </td>
      {orderedVisibleCols.map((col, idx) => {
        const isFrozen = idx < freezeCount;
        const frozenStyle = isFrozen ? stickyStyle(2 + idx) : undefined;
        const widthStyle = colWidths[col.key]
          ? { width: colWidths[col.key], minWidth: colWidths[col.key], maxWidth: colWidths[col.key] }
          : col.maxWidth ? { maxWidth: col.maxWidth } : undefined;
        const mergedStyle = { ...widthStyle, ...frozenStyle };
        return (
          <td
            key={col.key}
            className={`${col.type === 'thumbnail' ? 'px-2 py-3' : 'px-4 py-3'} overflow-hidden`}
            style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
          >
            {renderCell(col, project, tagSuggestions)}
          </td>
        );
      })}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <Link
            href={`/admin/projects/${project.id}`}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Edit2 size={13} />
          </Link>
          <button
            onClick={() => setConfirmDelete(project.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400/60 bg-red-500/5 hover:text-red-400 hover:bg-red-500/15 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-3 py-1.5 bg-[#111] border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Toolbar buttons */}
        <div className="relative">
          <ToolbarButton
            icon={ArrowUpDown}
            label="Sort"
            badge={sorts.length}
            active={sorts.length > 0}
            onClick={() => togglePanel('sort')}
          />
          {openPanel === 'sort' && (
            <SortPanel sorts={sorts} onChange={setSorts} onClose={closePanel} />
          )}
        </div>

        <div className="relative">
          <ToolbarButton
            icon={Filter}
            label="Filter"
            badge={filters.length}
            active={filters.length > 0}
            onClick={() => togglePanel('filter')}
          />
          {openPanel === 'filter' && (
            <FilterPanel filters={filters} onChange={setFilters} onClose={closePanel} />
          )}
        </div>

        <div className="relative">
          <ToolbarButton
            icon={Layers}
            label="Group"
            badge={groupField ? COLUMN_DEFS.find((c) => c.key === groupField)?.label : undefined}
            active={!!groupField}
            onClick={() => togglePanel('group')}
          />
          {openPanel === 'group' && (
            <GroupPanel groupField={groupField} onChange={(f) => { setGroupField(f); setCollapsedGroups(new Set()); }} onClose={closePanel} />
          )}
        </div>

        <div className="relative">
          <ToolbarButton
            icon={SlidersHorizontal}
            label="Fields"
            badge={visibleCols.size}
            active={openPanel === 'fields'}
            onClick={() => togglePanel('fields')}
          />
          {openPanel === 'fields' && (
            <FieldsPanel
              visibleCols={visibleCols}
              onToggle={toggleCol}
              onShowAll={showAllCols}
              onHideAll={hideAllCols}
              onClose={closePanel}
            />
          )}
        </div>

        {/* Order mode toggle */}
        <div className="flex items-center border border-yellow-500/40 rounded-lg overflow-hidden">
          <button
            onClick={() => setOrderMode('home_order')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors whitespace-nowrap ${
              orderMode === 'home_order'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home size={14} strokeWidth={1.75} />
            Home
          </button>
          <button
            onClick={() => setOrderMode('work_order')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors whitespace-nowrap ${
              orderMode === 'work_order'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase size={14} strokeWidth={1.75} />
            Work
          </button>
        </div>

        <button
          onClick={() => setColWidths({})}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors whitespace-nowrap ${
            Object.keys(colWidths).length > 0
              ? 'border-accent/40 text-accent bg-accent/5'
              : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-white/20'
          }`}
          title="Reset all column widths to auto-fit"
        >
          <Columns size={14} strokeWidth={1.75} />
          Auto-fit
        </button>

        {(search || filters.length > 0) && (
          <span className="text-xs text-muted-foreground/40 ml-1">
            {filtered.length} of {projects.length}
          </span>
        )}
      </div>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-[#111] border border-border rounded-xl shadow-2xl">
          <span className="text-sm text-muted-foreground mr-2">{selected.size} selected</span>
          <button onClick={() => handleBatchPublish(true)} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/8 hover:bg-white/12 text-foreground transition-colors disabled:opacity-40">
            <Eye size={13} /> Publish
          </button>
          <button onClick={() => handleBatchPublish(false)} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/8 hover:bg-white/12 text-foreground transition-colors disabled:opacity-40">
            <EyeOff size={13} /> Unpublish
          </button>
          <div className="w-px h-5 bg-border/40 mx-1" />
          <button onClick={() => handleBatchUpdate({ featured: true })} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/8 hover:bg-white/12 text-foreground transition-colors disabled:opacity-40">
            <Star size={13} /> Homepage
          </button>
          <button onClick={() => handleBatchUpdate({ featured: false })} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/8 hover:bg-white/12 text-foreground transition-colors disabled:opacity-40">
            <StarOff size={13} /> Remove
          </button>
          <div className="w-px h-5 bg-border/40 mx-1" />
          <button onClick={() => setConfirmDelete('batch')} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-40">
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-[#111] border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground mb-2">
              {confirmDelete === 'batch'
                ? `Delete ${selected.size} project${selected.size !== 1 ? 's' : ''}?`
                : 'Delete project?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={() => confirmDelete === 'batch' ? handleBatchDelete() : handleDeleteOne(confirmDelete)}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="relative">
        {/* Purple freeze line — positioned outside scroll wrapper so it doesn't scroll */}
        <div
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleFreezeDrag(e.clientX); }}
          className="absolute top-0 bottom-0 z-30 cursor-col-resize group/freeze"
          style={{ left: freezeLineLeft - 6, width: 13 }}
        >
          <div className="absolute top-0 bottom-0 left-[6px] w-px bg-purple-500/60 group-hover/freeze:bg-purple-400 transition-colors" />
          <div className="absolute top-[4px] left-[2px] w-[9px] h-[34px] rounded bg-purple-500 group-hover/freeze:bg-purple-400 transition-colors" />
        </div>
        <div ref={tableRef} className={`rounded-xl overflow-x-auto admin-scrollbar border ${selected.size > 0 ? 'border-white/20' : 'border-border/40'} transition-colors`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-white/[0.06]">
              <th className="w-8 px-1 py-3" style={stickyStyle(0, true)} />
              <th className="w-10 px-4 py-3 align-middle" style={stickyStyle(1, true)}>
                <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors flex items-center">
                  {allSelected ? <CheckSquare size={15} /> : someSelected ? <Minus size={15} /> : <Square size={15} />}
                </button>
              </th>
              {orderedVisibleCols.map((col, idx) => {
                const nextCol = idx < orderedVisibleCols.length - 1 ? orderedVisibleCols[idx + 1] : null;
                const resizeHandle = (
                  <span
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const th = e.currentTarget.closest('th')!;
                      const nextTh = th.nextElementSibling as HTMLElement | null;
                      handleColResize(
                        col.key,
                        nextCol?.key ?? null,
                        e.clientX,
                        th.getBoundingClientRect().width,
                        nextTh ? nextTh.getBoundingClientRect().width : 0,
                      );
                    }}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 transition-colors z-10"
                  />
                );
                const style = colWidths[col.key]
                  ? { width: colWidths[col.key], minWidth: colWidths[col.key] }
                  : col.maxWidth ? { maxWidth: col.maxWidth } : undefined;
                const isDragOver = dragOverColKey === col.key;

                // Drop target on the th, but only the grip icon is draggable
                const dropProps = {
                  onDragOver: (e: React.DragEvent) => handleColDragOver(e, col.key),
                  onDrop: (e: React.DragEvent) => handleColDrop(e, col.key),
                };

                const gripHandle = (
                  <span
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); handleColDragStart(e, col.key); }}
                    onDragEnd={handleColDragEnd}
                    className="opacity-0 group-hover:opacity-30 cursor-grab flex-shrink-0 -ml-1"
                  >
                    <GripVertical size={10} />
                  </span>
                );

                const isFrozen = idx < freezeCount;
                const frozenStyle = isFrozen ? stickyStyle(2 + idx, true) : undefined;
                const mergedStyle = { ...style, ...frozenStyle };

                return col.sortable ? (
                  <th
                    key={col.key}
                    className={`${thSortClass} ${isDragOver ? 'border-l-2 border-l-accent' : ''}`}
                    style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
                    onClick={() => handleSort(col.key)}
                    {...dropProps}
                  >
                    <span className="inline-flex items-center gap-1">
                      {gripHandle}
                      {col.label} <SortIcon col={col.key} />
                    </span>
                    {resizeHandle}
                  </th>
                ) : (
                  <th
                    key={col.key}
                    className={`${thClass} group ${isDragOver ? 'border-l-2 border-l-accent' : ''}`}
                    style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
                    {...dropProps}
                  >
                    <span className="inline-flex items-center gap-1">
                      {gripHandle}
                      {col.label}
                    </span>
                    {resizeHandle}
                  </th>
                );
              })}
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="px-4 py-12 text-center text-muted-foreground/50 text-sm">
                  {projects.length === 0 ? (
                    <>No projects yet.{' '}<Link href="/admin/projects/new" className="text-muted-foreground hover:text-foreground underline transition-colors">Create one</Link></>
                  ) : 'No projects match your filters.'}
                </td>
              </tr>
            ) : groups ? (
              // Grouped rendering
              Array.from(groups.entries()).map(([label, rows]) => (
                <React.Fragment key={label}>
                  <tr
                    className="bg-white/[0.03] border-b border-border/30 cursor-pointer hover:bg-white/[0.05] transition-colors"
                    onClick={() => toggleGroup(label)}
                  >
                    <td colSpan={visibleColCount} className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          size={14}
                          className={`text-muted-foreground/50 transition-transform ${
                            collapsedGroups.has(label) ? '' : 'rotate-90'
                          }`}
                        />
                        <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                          {label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                          {rows.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {!collapsedGroups.has(label) && rows.map(renderRow)}
                </React.Fragment>
              ))
            ) : (
              // Flat rendering
              filtered.map(renderRow)
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
