'use client';

import { Plus, Trash2, Save, Loader2, Check } from 'lucide-react';

export function ButtonsSection() {
  return (
    <section id="buttons" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Buttons</h2>

      {/* Primary */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Primary (.btn-primary)</h3>
        <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <button className="btn-primary px-4 py-2.5 text-sm"><Plus size={14} /> Create New</button>
          <button className="btn-primary px-4 py-2.5 text-sm"><Save size={14} /> Save</button>
          <button className="btn-primary px-3 py-2 text-xs">Small</button>
          <button className="btn-primary px-4 py-2.5 text-sm" disabled><Loader2 size={14} className="animate-spin" /> Saving...</button>
        </div>
      </div>

      {/* Secondary */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Secondary (.btn-secondary)</h3>
        <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <button className="btn-secondary px-4 py-2.5 text-sm">Cancel</button>
          <button className="btn-secondary px-4 py-2.5 text-sm"><Plus size={14} /> Add Item</button>
          <button className="btn-secondary px-3 py-2 text-xs">Small</button>
          <button className="btn-secondary px-4 py-2.5 text-sm" disabled>Disabled</button>
        </div>
      </div>

      {/* Danger */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Danger (.btn-danger)</h3>
        <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <button className="btn-danger px-4 py-2 text-sm"><Trash2 size={14} /> Delete</button>
          <button className="btn-danger px-4 py-2 text-sm">Remove</button>
          <button className="btn-danger px-4 py-2 text-sm" disabled>Disabled</button>
        </div>
      </div>

      {/* Ghost — Default (.btn-ghost) */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Ghost — Default (.btn-ghost)</h3>
        <p className="text-admin-xs text-admin-text-faint mb-3">Generic grey hover for standard actions.</p>
        <div className="flex flex-wrap items-center gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <button className="btn-ghost w-10 h-10">
            <Check size={15} strokeWidth={1.75} />
          </button>
          <button className="btn-ghost gap-2 px-3 py-2 text-sm">
            <Check size={14} /> Approve
          </button>
        </div>
      </div>

      {/* Ghost — Danger (.btn-ghost-danger) */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Ghost — Danger (.btn-ghost-danger)</h3>
        <p className="text-admin-xs text-admin-text-faint mb-3">Red hover for destructive actions (delete, remove).</p>
        <div className="flex flex-wrap items-center gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <button className="btn-ghost-danger w-10 h-10">
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
          <button className="btn-ghost-danger gap-2 px-3 py-2 text-sm">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Ghost — Add (.btn-ghost-add) */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Ghost — Add (.btn-ghost-add)</h3>
        <p className="text-admin-xs text-admin-text-faint mb-3">Inverted (white bg, black icon) for add/new actions.</p>
        <div className="flex flex-wrap items-center gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <button className="btn-ghost-add w-10 h-10">
            <Plus size={15} strokeWidth={1.75} />
          </button>
          <button className="btn-ghost-add gap-2 px-3 py-2 text-sm">
            <Plus size={14} /> New Item
          </button>
        </div>
      </div>
    </section>
  );
}
