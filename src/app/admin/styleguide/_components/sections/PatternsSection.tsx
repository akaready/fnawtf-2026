'use client';

import { useState } from 'react';
import { Trash2, Check, X, Pencil, Upload, GripVertical } from 'lucide-react';

/* ── Pattern Demo Card ──────────────────────────────────────────────────── */
function PatternCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-1">{title}</h3>
      <p className="text-admin-sm text-admin-text-muted mb-3">{description}</p>
      <div className="border border-admin-border rounded-xl overflow-hidden bg-admin-bg-inset">
        {children}
      </div>
    </div>
  );
}

/* ── Progressive Disclosure Demo ────────────────────────────────────────── */
function ProgressiveDisclosureDemo() {
  return (
    <div className="divide-y divide-admin-border-subtle">
      {['Project Alpha', 'Project Beta', 'Project Gamma'].map((name) => (
        <div key={name} className="group/row flex items-center px-4 py-3 hover:bg-admin-bg-hover transition-colors">
          <span className="opacity-0 group-hover/row:opacity-100 transition-opacity text-admin-text-ghost mr-2 cursor-grab">
            <GripVertical size={14} />
          </span>
          <span className="flex-1 text-admin-sm text-admin-text-primary">{name}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button className="btn-ghost w-8 h-8"><Pencil size={13} /></button>
            <button className="btn-ghost-danger w-8 h-8"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Two-State Deletion Demo ────────────────────────────────────────────── */
function TwoStateDeleteDemo() {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const items = ['Item One', 'Item Two', 'Item Three'];

  return (
    <div className="divide-y divide-admin-border-subtle">
      {items.map((item) => (
        <div key={item} className="group/row flex items-center px-4 py-3 hover:bg-admin-bg-hover transition-colors">
          <span className="flex-1 text-admin-sm text-admin-text-primary">{item}</span>
          <div className="flex items-center gap-0.5">
            {confirmId === item ? (
              <>
                <button
                  onClick={() => setConfirmId(null)}
                  className="p-2 text-admin-danger hover:text-red-300 transition-colors"
                  title="Confirm delete"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="p-2 text-admin-text-faint hover:text-admin-text-primary transition-colors"
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmId(item)}
                className="btn-ghost-danger w-8 h-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Inline Edit Toggle Demo ────────────────────────────────────────────── */
function InlineEditDemo() {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('INT. COFFEE SHOP');

  return (
    <div className="px-4 py-3">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="admin-input flex-1 px-3 py-2 text-admin-sm uppercase"
            autoFocus
          />
          <button onClick={() => setEditing(false)} className="p-2 text-admin-success hover:text-admin-success transition-colors">
            <Check size={14} />
          </button>
          <button onClick={() => setEditing(false)} className="p-2 text-admin-text-faint hover:text-admin-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-admin-bg-hover transition-colors text-admin-sm text-admin-text-primary w-full text-left"
        >
          <span className="font-admin-mono text-admin-xs text-admin-text-dim">1.</span>
          <span className="uppercase font-medium">{value}</span>
          <span className="text-admin-text-ghost">— MORNING</span>
          <Pencil size={12} className="ml-auto text-admin-text-ghost opacity-0 group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

/* ── Left Border Color Coding Demo ──────────────────────────────────────── */
function BorderColorDemo() {
  const columns = [
    { label: 'Audio / Primary', color: 'border-l-[var(--admin-accent)]', text: 'Dialog, voiceover, sound effects' },
    { label: 'Visual / Info', color: 'border-l-[var(--admin-info)]', text: 'Camera angles, visual descriptions' },
    { label: 'Notes / Warning', color: 'border-l-[var(--admin-warning)]', text: 'Director notes, reminders' },
    { label: 'Reference / Success', color: 'border-l-[var(--admin-success)]', text: 'Supporting assets, thumbnails' },
  ];

  return (
    <div className="divide-y divide-admin-border-subtle">
      {columns.map((col) => (
        <div key={col.label} className={`px-4 py-3 border-l-2 ${col.color}`}>
          <div className="text-admin-sm font-medium text-admin-text-primary">{col.label}</div>
          <div className="text-admin-xs text-admin-text-muted mt-0.5">{col.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Scoped Group Demo ──────────────────────────────────────────────────── */
function ScopedGroupDemo() {
  return (
    <div className="p-4 space-y-2">
      <p className="text-admin-xs text-admin-text-faint mb-3">
        Use scoped groups (<code className="font-admin-mono text-admin-text-dim">group/name</code>) to prevent hover state leakage when nesting interactive elements.
      </p>
      <div className="group/card border border-admin-border rounded-lg p-3 hover:bg-admin-bg-hover transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-admin-sm text-admin-text-primary font-medium">Card (group/card)</span>
          <button className="btn-ghost w-8 h-8 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <Pencil size={12} />
          </button>
        </div>
        <div className="group/img relative w-full h-24 bg-admin-bg-base rounded-md overflow-hidden border border-admin-border-subtle">
          <div className="w-full h-full flex items-center justify-center text-admin-text-ghost text-admin-xs">Image area</div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
            <Upload size={16} className="text-white" />
          </div>
        </div>
        <p className="text-admin-xs text-admin-text-muted mt-2">Hovering the image shows upload overlay without triggering the card edit button.</p>
      </div>
    </div>
  );
}

/* ── Column Toggle Demo ─────────────────────────────────────────────────── */
function ColumnToggleDemo() {
  const [cols, setCols] = useState({ audio: true, visual: true, notes: false, ref: false });
  const toggles = [
    { key: 'audio' as const, label: 'Audio', color: 'bg-[var(--admin-accent)]' },
    { key: 'visual' as const, label: 'Visual', color: 'bg-[var(--admin-info)]' },
    { key: 'notes' as const, label: 'Notes', color: 'bg-[var(--admin-warning)]' },
    { key: 'ref' as const, label: 'Reference', color: 'bg-[var(--admin-success)]' },
  ];

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1">
        {toggles.map((t) => (
          <button
            key={t.key}
            onClick={() => setCols((p) => ({ ...p, [t.key]: !p[t.key] }))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-admin-xs font-medium transition-colors ${
              cols[t.key]
                ? 'bg-admin-bg-active text-admin-text-primary'
                : 'text-admin-text-ghost hover:text-admin-text-muted'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${cols[t.key] ? t.color : 'bg-admin-text-ghost'}`} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main Section ───────────────────────────────────────────────────────── */
export function PatternsSection() {
  return (
    <section id="patterns" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Patterns</h2>
      <p className="text-admin-sm text-admin-text-muted -mt-4">
        Reusable UI recipes for consistent admin interfaces. These patterns are documented in CLAUDE.md.
      </p>

      <PatternCard
        title="Progressive Disclosure"
        description="Hide secondary actions until hover. Use scoped groups (group/row) to prevent leakage."
      >
        <ProgressiveDisclosureDemo />
      </PatternCard>

      <PatternCard
        title="Two-State Deletion"
        description="All delete actions require two-state confirmation. Never delete on single click."
      >
        <TwoStateDeleteDemo />
      </PatternCard>

      <PatternCard
        title="Inline Edit Toggle"
        description="Switch between view and edit mode inline. Done (success) + Cancel (ghost) buttons."
      >
        <InlineEditDemo />
      </PatternCard>

      <PatternCard
        title="Left-Border Color Coding"
        description="Use border-l with semantic colors to categorize content types."
      >
        <BorderColorDemo />
      </PatternCard>

      <PatternCard
        title="Scoped Group Hover"
        description="Nested group/name scoping prevents hover states from leaking between parent and child."
      >
        <ScopedGroupDemo />
      </PatternCard>

      <PatternCard
        title="Column Toggle with Color Dots"
        description="Toggle visibility of columns with color-coded indicators matching the column content."
      >
        <ColumnToggleDemo />
      </PatternCard>
    </section>
  );
}
