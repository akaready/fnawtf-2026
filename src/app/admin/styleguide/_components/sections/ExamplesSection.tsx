'use client';

import { useState } from 'react';
import {
  Trash2, Check, X, Pencil, Plus, Save, Search, Download,
  ChevronRight, ListFilter, ArrowUpDown, Columns,
  Snowflake, FileText, Settings, Users, MapPin, Hash,
} from 'lucide-react';
import { TwoStateDeleteButton } from '../../../_components/TwoStateDeleteButton';
import { StatusBadge } from '../../../_components/StatusBadge';
import { COMPANY_STATUSES, PROPOSAL_STATUSES, SCRIPT_STATUSES } from '../../../_components/statusConfigs';
import { EmptyState } from '../../../_components/EmptyState';
import { AdminSelect } from '../AdminSelect';

/* ── Shared Demo Card ─────────────────────────────────────────────────── */
function DemoCard({
  title,
  description,
  annotation,
  children,
}: {
  title: string;
  description: string;
  annotation?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-1">{title}</h3>
      <p className="text-admin-sm text-admin-text-muted mb-3">{description}</p>
      <div className="border border-admin-border rounded-xl overflow-hidden bg-admin-bg-inset">
        {children}
      </div>
      {annotation && (
        <p className="text-xs text-admin-text-faint mt-2 font-admin-mono">{annotation}</p>
      )}
    </div>
  );
}

/* ── 1. Page Layout Skeleton ──────────────────────────────────────────── */
function PageLayoutDemo() {
  return (
    <div className="p-4">
      <div className="border border-admin-border rounded-lg overflow-hidden text-xs font-admin-mono">
        {/* Header */}
        <div className="h-14 bg-admin-bg-base border-b border-admin-border flex items-center px-4 justify-between">
          <div>
            <span className="text-admin-text-primary font-semibold">Page Title</span>
            <span className="text-admin-text-faint ml-2">h-[7rem] flex-shrink-0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded bg-admin-bg-hover text-admin-text-dim">Search</div>
            <div className="px-2 py-1 rounded bg-admin-bg-active text-admin-text-dim">btn-secondary</div>
            <div className="px-2 py-1 rounded bg-white text-black text-[10px]">btn-primary</div>
          </div>
        </div>
        {/* Toolbar */}
        <div className="h-10 bg-admin-bg-inset border-b border-admin-border flex items-center px-4 gap-2">
          <span className="text-admin-text-faint">h-[3rem] bg-admin-bg-inset</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="px-2 py-0.5 rounded text-admin-text-ghost">Filter</div>
            <div className="px-2 py-0.5 rounded text-admin-text-ghost">Sort</div>
            <div className="px-2 py-0.5 rounded text-admin-text-ghost">Fields</div>
          </div>
        </div>
        {/* Content */}
        <div className="h-28 bg-admin-bg-base flex items-center justify-center text-admin-text-faint">
          flex-1 overflow-y-auto admin-scrollbar
        </div>
      </div>
    </div>
  );
}

/* ── 2. AdminPageHeader ───────────────────────────────────────────────── */
function HeaderDemo() {
  const [search, setSearch] = useState('');
  return (
    <div className="border-b border-admin-border">
      <div className="@container flex-shrink-0 h-[7rem] px-6 flex flex-col justify-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0 shrink-0 max-w-[40%]">
            <h1 className="text-2xl font-bold tracking-tight truncate">Page Title</h1>
            <p className="text-sm mt-1 text-admin-text-muted truncate">42 total</p>
          </div>
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <div className="relative flex-1 max-w-64 min-w-[100px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="admin-input w-full pl-9 pr-3 py-1.5 text-sm"
              />
            </div>
            <button className="btn-secondary px-4 py-2.5 text-sm"><Download size={14} /> Export</button>
            <button className="btn-primary px-5 py-2.5 text-sm"><Plus size={16} /> Create New</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 3. Toolbar Row ───────────────────────────────────────────────────── */
function ToolbarDemo() {
  const [active, setActive] = useState<string | null>(null);
  const colors = [
    { id: 'filter', label: 'Filter', icon: ListFilter, color: 'blue' as const },
    { id: 'sort', label: 'Sort', icon: ArrowUpDown, color: 'green' as const },
    { id: 'fields', label: 'Fields', icon: Columns, color: 'orange' as const },
    { id: 'freeze', label: '', icon: Snowflake, color: 'neutral' as const },
  ];
  const colorMap = {
    blue:    { active: 'bg-[#2d7ff9]/15 text-[#2d7ff9] border-[#2d7ff9]/25', badge: 'bg-[#2d7ff9]/15 text-[#2d7ff9]' },
    green:   { active: 'bg-[#20c933]/15 text-[#20c933] border-[#20c933]/25', badge: 'bg-[#20c933]/15 text-[#20c933]' },
    orange:  { active: 'bg-[#ff6f2c]/15 text-[#ff6f2c] border-[#ff6f2c]/25', badge: 'bg-[#ff6f2c]/15 text-[#ff6f2c]' },
    neutral: { active: 'bg-admin-bg-active text-admin-text-secondary border-admin-border-subtle', badge: '' },
  };

  return (
    <div className="flex items-center gap-1 px-6 h-[3rem] bg-admin-bg-inset">
      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        {colors.map((c) => {
          const isActive = active === c.id;
          const scheme = colorMap[c.color];
          const iconOnly = !c.label;
          return (
            <button
              key={c.id}
              onClick={() => setActive(isActive ? null : c.id)}
              className={`flex items-center ${iconOnly ? 'px-[9px]' : 'gap-1.5 px-[15px]'} py-[7px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap border ${
                isActive ? scheme.active : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
              }`}
            >
              <c.icon size={14} strokeWidth={1.75} />
              {c.label && c.label}
              {c.id === 'filter' && isActive && (
                <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full leading-none ${scheme.badge}`}>2</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 4. Side Panel Preview ────────────────────────────────────────────── */
function SidePanelDemo() {
  return (
    <div className="p-4">
      <div className="border border-admin-border rounded-lg overflow-hidden max-w-sm mx-auto bg-admin-bg-sidebar text-xs">
        {/* Panel header */}
        <div className="px-6 pt-5 pb-4 border-b border-admin-border flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-admin-text-primary">Panel Title</h2>
            <p className="text-xs text-admin-text-faint mt-0.5">Subtitle text</p>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Panel body */}
        <div className="px-6 py-5 space-y-4 text-admin-text-muted">
          <div className="h-8 bg-admin-bg-hover rounded-lg animate-pulse" />
          <div className="h-8 bg-admin-bg-hover rounded-lg animate-pulse w-3/4" />
          <div className="h-8 bg-admin-bg-hover rounded-lg animate-pulse w-1/2" />
        </div>
        {/* Panel footer */}
        <div className="px-6 py-4 border-t border-admin-border flex items-center justify-between">
          <button className="btn-primary px-5 py-2.5 text-sm"><Save size={14} /> Save</button>
          <button className="btn-ghost-danger w-8 h-8"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

/* ── 5. Two-State Delete (Row) ────────────────────────────────────────── */
function TwoStateRowDemo() {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const items = ['Acme Corp', 'Globex Inc', 'Initech LLC'];

  return (
    <div className="divide-y divide-admin-border-subtle">
      {items.map((item) => (
        <div key={item} className="group/row flex items-center px-4 py-3 hover:bg-admin-bg-hover transition-colors">
          <span className="flex-1 text-admin-sm text-admin-text-primary">{item}</span>
          <TwoStateDeleteButton
            itemId={item}
            confirmId={confirmId}
            onRequestConfirm={setConfirmId}
            onConfirmDelete={() => setConfirmId(null)}
            onCancel={() => setConfirmId(null)}
            hideUntilHover
            groupName="row"
          />
        </div>
      ))}
    </div>
  );
}

/* ── 6. Two-State Delete (Toolbar Batch) ──────────────────────────────── */
function TwoStateBatchDemo() {
  const [selected, setSelected] = useState(new Set<string>());
  const [confirm, setConfirm] = useState(false);
  const items = ['Row A', 'Row B', 'Row C'];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setConfirm(false);
  };

  return (
    <div>
      {/* Mini toolbar */}
      <div className="flex items-center gap-1 px-4 h-10 bg-admin-bg-inset border-b border-admin-border">
        <span className="text-xs text-admin-text-faint">
          {selected.size > 0 ? `${selected.size} selected` : 'Select rows below'}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          {selected.size > 0 && (
            confirm ? (
              <div className="flex items-center gap-0.5">
                <button onClick={() => { setSelected(new Set()); setConfirm(false); }} className="btn-ghost-danger w-8 h-8" title="Confirm delete">
                  <Check size={14} strokeWidth={2} />
                </button>
                <button onClick={() => setConfirm(false)} className="btn-ghost w-8 h-8" title="Cancel">
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} className="btn-ghost-danger w-8 h-8" title={`Delete ${selected.size} selected`}>
                <Trash2 size={14} />
              </button>
            )
          )}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-admin-border-subtle">
        {items.map((item) => (
          <div key={item} className="flex items-center px-4 py-2.5 hover:bg-admin-bg-hover transition-colors">
            <input
              type="checkbox"
              checked={selected.has(item)}
              onChange={() => toggle(item)}
              className="mr-3 w-4 h-4 rounded border-admin-border bg-transparent accent-white"
            />
            <span className="text-admin-sm text-admin-text-primary">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 7. Ghost Button Variants ─────────────────────────────────────────── */
function GhostButtonsDemo() {
  return (
    <div className="p-6 flex flex-wrap items-center gap-6">
      <div className="text-center space-y-2">
        <button className="btn-ghost w-10 h-10"><Pencil size={15} strokeWidth={1.75} /></button>
        <p className="text-xs text-admin-text-faint">.btn-ghost</p>
      </div>
      <div className="text-center space-y-2">
        <button className="btn-ghost-danger w-10 h-10"><Trash2 size={15} strokeWidth={1.75} /></button>
        <p className="text-xs text-admin-text-faint">.btn-ghost-danger</p>
      </div>
      <div className="text-center space-y-2">
        <button className="btn-ghost-add w-10 h-10"><Plus size={15} strokeWidth={1.75} /></button>
        <p className="text-xs text-admin-text-faint">.btn-ghost-add</p>
      </div>
      <div className="border-l border-admin-border-subtle pl-6 flex items-center gap-3">
        <div className="text-center space-y-2">
          <button className="btn-ghost w-8 h-8"><Pencil size={13} /></button>
          <p className="text-xs text-admin-text-faint">w-8 h-8</p>
        </div>
        <div className="text-center space-y-2">
          <button className="btn-ghost w-10 h-10"><Pencil size={15} /></button>
          <p className="text-xs text-admin-text-faint">w-10 h-10</p>
        </div>
      </div>
    </div>
  );
}

/* ── 8. Tab Bar ───────────────────────────────────────────────────────── */
function TabBarDemo() {
  const [tab, setTab] = useState('details');
  const tabs = [
    { value: 'details', label: 'Details' },
    { value: 'videos', label: 'Videos' },
    { value: 'credits', label: 'Credits' },
    { value: 'bts', label: 'BTS' },
  ];

  return (
    <div className="flex-shrink-0 flex items-center gap-1 px-6 h-[3rem] border-b border-admin-border bg-admin-bg-inset overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => setTab(t.value)}
          className={`flex items-center gap-1.5 px-[15px] py-[7px] rounded-lg text-sm font-medium transition-colors border ${
            tab === t.value
              ? 'bg-admin-bg-active text-admin-text-primary border-transparent'
              : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── 9. Status Badges ─────────────────────────────────────────────────── */
function StatusBadgesDemo() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-2">Company Statuses</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COMPANY_STATUSES).map(([key]) => (
            <StatusBadge key={key} status={key} config={COMPANY_STATUSES} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-2">Proposal Statuses</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROPOSAL_STATUSES).map(([key]) => (
            <StatusBadge key={key} status={key} config={PROPOSAL_STATUSES} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-2">Script Statuses</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SCRIPT_STATUSES).map(([key]) => (
            <StatusBadge key={key} status={key} config={SCRIPT_STATUSES} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 10. Empty State ──────────────────────────────────────────────────── */
function EmptyStateDemo() {
  return (
    <EmptyState
      icon={FileText}
      title="No proposals yet"
      description="Create your first proposal to get started."
      action={{ label: 'Create Proposal', onClick: () => {} }}
    />
  );
}

/* ── 11. AdminSelect ──────────────────────────────────────────────────── */
function AdminSelectDemo() {
  const [single, setSingle] = useState('');
  const [multi, setMulti] = useState<string[]>([]);
  const options = [
    { value: 'director', label: 'Director' },
    { value: 'producer', label: 'Producer' },
    { value: 'editor', label: 'Editor' },
    { value: 'cinematographer', label: 'Cinematographer' },
    { value: 'sound', label: 'Sound Designer' },
  ];

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-2">Single Select</p>
        <AdminSelect options={options} value={single} onChange={(v) => setSingle(v as string)} placeholder="Choose role…" />
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-2">Multi Select</p>
        <AdminSelect options={options} value={multi} onChange={(v) => setMulti(v as string[])} placeholder="Choose roles…" multi />
      </div>
    </div>
  );
}

/* ── 12. Form Inputs ──────────────────────────────────────────────────── */
function FormInputsDemo() {
  return (
    <div className="p-6 space-y-4 max-w-md">
      <div>
        <label className="block text-xs text-admin-text-secondary uppercase tracking-wide mb-1">Default Input</label>
        <input type="text" className="admin-input w-full px-3 py-2 text-sm" placeholder="Placeholder text…" />
      </div>
      <div>
        <label className="block text-xs text-admin-text-secondary uppercase tracking-wide mb-1">Disabled Input</label>
        <input type="text" className="admin-input w-full px-3 py-2 text-sm" value="Cannot edit" disabled />
      </div>
      <div>
        <label className="block text-xs text-admin-text-secondary uppercase tracking-wide mb-1">Textarea</label>
        <textarea className="admin-input w-full px-3 py-2 text-sm resize-none" rows={3} placeholder="Enter description…" />
      </div>
    </div>
  );
}

/* ── 13. Button Sizing Table ──────────────────────────────────────────── */
function ButtonSizingDemo() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Header Actions (px-5 py-2.5 text-sm)</p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary px-4 py-2.5 text-sm"><Download size={14} /> Export</button>
          <button className="btn-primary px-5 py-2.5 text-sm"><Plus size={16} /> Create New</button>
        </div>
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Inline / Compact (px-3 py-2 text-xs)</p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary px-3 py-2 text-xs">Cancel</button>
          <button className="btn-primary px-3 py-2 text-xs">Save</button>
        </div>
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Icon-Only</p>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <button className="btn-ghost w-8 h-8"><Pencil size={13} /></button>
            <p className="text-xs text-admin-text-ghost mt-1">w-8 h-8 (rows)</p>
          </div>
          <div className="text-center">
            <button className="btn-ghost w-10 h-10"><Pencil size={15} /></button>
            <p className="text-xs text-admin-text-ghost mt-1">w-10 h-10 (headers)</p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Mobile (p-2.5, icon-only)</p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary p-2.5"><Download size={14} /></button>
          <button className="btn-primary p-2.5"><Plus size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/* ── 14. Breadcrumbs ──────────────────────────────────────────────────── */
function BreadcrumbDemo() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Standard Breadcrumb (topContent prop)</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-admin-text-faint hover:text-admin-text-primary transition-colors cursor-pointer">Scripts</span>
          <ChevronRight size={10} className="text-admin-text-ghost" />
          <span className="text-xs text-admin-text-muted">Rise & Grind — Brand Launch</span>
          <span className="text-admin-text-ghost mx-0.5">·</span>
          <span className="text-xs text-admin-text-faint">Project Title</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Minimal Breadcrumb (text separator)</p>
        <p className="text-xs text-admin-text-faint uppercase tracking-wider">
          <span className="hover:text-admin-text-muted transition-colors cursor-pointer">Projects</span>
          {' / '}
          <span className="text-admin-text-muted normal-case tracking-normal">Edit</span>
        </p>
      </div>
    </div>
  );
}

/* ── 15. Responsive Header Rules ──────────────────────────────────────── */
function ResponsiveHeaderDemo() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Wide (@xl) — Single Row</p>
        <div className="border border-admin-border rounded-lg overflow-hidden">
          <div className="h-14 px-4 flex items-center gap-3 bg-admin-bg-base">
            <span className="text-lg font-bold text-admin-text-primary">Script Title</span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border border-admin-success/40 bg-admin-success-bg text-admin-success">v04</span>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"><Users size={14} /> Characters</button>
              <button className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"><MapPin size={14} /> Locations</button>
              <button className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"><Hash size={14} /> Tags</button>
              <button className="btn-secondary p-2"><Settings size={14} /></button>
              <button className="btn-primary px-4 py-1.5 text-sm flex items-center gap-1.5"><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs text-admin-text-faint uppercase tracking-wide mb-3">Narrow (below @xl) — Stacked + mobileActions</p>
        <div className="border border-admin-border rounded-lg overflow-hidden max-w-xs">
          <div className="px-4 py-3 bg-admin-bg-base space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-admin-text-primary truncate">Script Title</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border border-admin-success/40 bg-admin-success-bg text-admin-success">v04</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-faint" />
                <input type="text" placeholder="Search…" className="admin-input w-full pl-9 pr-3 py-1.5 text-sm" readOnly />
              </div>
              <button className="btn-secondary p-2.5"><Settings size={14} /></button>
              <button className="btn-primary p-2.5"><Save size={14} /></button>
            </div>
          </div>
        </div>
        <p className="text-xs text-admin-text-faint mt-2 font-admin-mono">
          Rule: Use mobileActions prop — icon-only buttons (p-2.5) replace text+icon buttons at narrow widths.
        </p>
      </div>
    </div>
  );
}

/* ── 16. Checkbox Styling ─────────────────────────────────────────────── */
function CheckboxDemo() {
  const [checked, setChecked] = useState([false, true, false]);
  return (
    <div className="p-6">
      <div className="space-y-2">
        {['Select all', 'Row item (checked)', 'Row item (unchecked)'].map((label, i) => (
          <label key={label} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-admin-bg-hover transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={() => setChecked((p) => { const n = [...p]; n[i] = !n[i]; return n; })}
              className="w-4 h-4 rounded border-admin-border bg-transparent accent-white"
            />
            <span className="text-admin-sm text-admin-text-primary">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── 17. Consistency Notes ────────────────────────────────────────────── */
function ConsistencyNotes() {
  const notes = [
    { status: 'warn', text: 'CompanyPanel uses modal delete confirmation instead of inline two-state pattern' },
    { status: 'warn', text: 'MeetingPanel uses native <select> — should use AdminSelect per CLAUDE.md' },
    { status: 'warn', text: 'Some group hover patterns lack scoped names (e.g. group/row) — risk of style leakage' },
    { status: 'info', text: 'Panel title weight: standardize to font-semibold (ProjectPanel pattern)' },
    { status: 'info', text: 'Panel body padding: standardize to py-5 (CompanyPanel currently py-4)' },
    { status: 'info', text: 'Tab bar background: standardize on bg-admin-bg-inset (AdminTabBar default)' },
    { status: 'info', text: 'Header Create button icon: standardize to Plus size={16}' },
    { status: 'info', text: 'Empty state padding: standardize to py-12' },
  ];

  return (
    <div className="p-6 space-y-2">
      {notes.map((note, i) => (
        <div key={i} className={`flex items-start gap-2 text-sm ${
          note.status === 'warn' ? 'text-admin-warning' : 'text-admin-info'
        }`}>
          <span className="mt-0.5">{note.status === 'warn' ? '⚠' : 'ℹ'}</span>
          <span className="text-admin-text-muted">{note.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main Section ───────────────────────────────────────────────────── */
export function ExamplesSection() {
  return (
    <section id="examples" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Examples</h2>
      <p className="text-admin-sm text-admin-text-muted -mt-4">
        Concrete examples of every shared UI mechanic in the admin dashboard. Use these as the canonical reference for building new pages.
      </p>

      <DemoCard title="Page Layout" description="Every admin page follows this 3-zone structure. Only the content area scrolls.">
        <PageLayoutDemo />
      </DemoCard>

      <DemoCard
        title="AdminPageHeader"
        description="Fixed h-[7rem] header with title, subtitle, search, and action buttons. Primary action always last (rightmost)."
        annotation="actions: secondary first (px-4 py-2.5) → primary last (px-5 py-2.5). Icon: Plus size={16} for Create."
      >
        <HeaderDemo />
      </DemoCard>

      <DemoCard
        title="Toolbar Row"
        description="h-[3rem] bg-admin-bg-inset toolbar with ToolbarButton components using ROYGBIV colors."
        annotation="ToolbarButton: px-[15px] py-[7px] text-sm font-medium rounded-lg. Badge: text-[10px] px-1.5 py-0.5 rounded-full."
      >
        <ToolbarDemo />
      </DemoCard>

      <DemoCard
        title="Side Panel (PanelDrawer)"
        description="Standard panel: header (px-6 pt-5 pb-4, title text-lg font-semibold), body (px-6 py-5), footer (px-6 py-4, save left, delete right)."
      >
        <SidePanelDemo />
      </DemoCard>

      <DemoCard
        title="Two-State Delete (Row)"
        description="Trash icon hidden until hover → Check (danger) + X (cancel) on click. Uses TwoStateDeleteButton component."
        annotation="TwoStateDeleteButton: btn-ghost-danger w-8 h-8, hideUntilHover + groupName='row'"
      >
        <TwoStateRowDemo />
      </DemoCard>

      <DemoCard
        title="Two-State Delete (Toolbar Batch)"
        description="Trash icon appears in toolbar when rows are selected. Same two-state confirm/cancel pattern."
      >
        <TwoStateBatchDemo />
      </DemoCard>

      <DemoCard
        title="Ghost Button Variants & Icon Sizing"
        description="Three ghost variants plus standard icon-only sizes."
      >
        <GhostButtonsDemo />
      </DemoCard>

      <DemoCard
        title="Tab Bar (AdminTabBar)"
        description="Standard tab bar for panels and sub-navigation. Uses AdminTabBar component."
        annotation="px-[15px] py-[7px] rounded-lg text-sm font-medium. Active: bg-admin-bg-active. Container: h-[3rem] bg-admin-bg-inset."
      >
        <TabBarDemo />
      </DemoCard>

      <DemoCard title="Status Badges" description="Semantic status families using StatusBadge component + shared configs.">
        <StatusBadgesDemo />
      </DemoCard>

      <DemoCard title="Empty State" description="Standard empty state with optional icon, description, and action button." annotation="py-12 text-sm text-admin-text-ghost. Action: btn-secondary px-4 py-2 text-xs.">
        <EmptyStateDemo />
      </DemoCard>

      <DemoCard title="AdminSelect" description="Custom dropdown. Never use browser-native <select> in admin UI." annotation="Always includes search. Keyboard navigable (arrows, enter, escape).">
        <AdminSelectDemo />
      </DemoCard>

      <DemoCard title="Form Inputs" description="Standard admin-input class with consistent sizing." annotation="admin-input: rounded-lg border border-admin-border-subtle px-3 py-2 text-sm. Focus: ring-1 ring-admin-border-emphasis.">
        <FormInputsDemo />
      </DemoCard>

      <DemoCard title="Button Sizing Convention" description="Four standard button sizes used consistently across the dashboard.">
        <ButtonSizingDemo />
      </DemoCard>

      <DemoCard
        title="Breadcrumbs"
        description="Two patterns: chevron-separated (topContent prop in AdminPageHeader) and slash-separated (inline). Both use text-xs."
        annotation="Link: text-admin-text-faint hover:text-admin-text-primary. Separator: ChevronRight size={10} text-admin-text-ghost. Current: text-admin-text-muted."
      >
        <BreadcrumbDemo />
      </DemoCard>

      <DemoCard
        title="Responsive Header"
        description="AdminPageHeader uses @container queries. Wide: single row. Narrow: stacked with icon-only mobileActions."
        annotation="@xl breakpoint splits layout. Use mobileActions prop for icon-only fallbacks (p-2.5)."
      >
        <ResponsiveHeaderDemo />
      </DemoCard>

      <DemoCard title="Checkbox" description="Standard checkbox styling with admin border tokens.">
        <CheckboxDemo />
      </DemoCard>

      <DemoCard title="Known Inconsistencies" description="Documented deviations from the design system to fix in future passes.">
        <ConsistencyNotes />
      </DemoCard>
    </section>
  );
}
