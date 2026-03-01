'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { AdminSelect } from '../AdminSelect';

const DEMO_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
  { value: 'draft', label: 'Draft' },
];

const MULTI_OPTIONS = [
  { value: 'design', label: 'Design' },
  { value: 'dev', label: 'Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'ops', label: 'Operations' },
];

export function InputsSection() {
  const [singleVal, setSingleVal] = useState('');
  const [multiVal, setMultiVal] = useState<string[]>([]);

  return (
    <section id="inputs" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Inputs & Forms</h2>

      {/* Text Inputs */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Text Input (.admin-input)</h3>
        <div className="space-y-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset max-w-md">
          <input type="text" placeholder="Default input" className="admin-input w-full px-3 py-2.5 text-sm" />
          <input type="text" value="Filled input" readOnly className="admin-input w-full px-3 py-2.5 text-sm" />
          <input type="text" placeholder="Disabled" disabled className="admin-input w-full px-3 py-2.5 text-sm opacity-50" />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-faint" />
            <input type="text" placeholder="Search..." className="admin-input w-full pl-9 pr-3 py-2.5 text-sm" />
          </div>
        </div>
      </div>

      {/* Single Select */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Select — Single (AdminSelect)</h3>
        <div className="space-y-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset max-w-md">
          <AdminSelect
            options={DEMO_OPTIONS}
            value={singleVal}
            onChange={(v) => setSingleVal(v as string)}
            placeholder="Choose status..."
          />
        </div>
      </div>

      {/* Multi Select */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Select — Multi (AdminSelect multi)</h3>
        <div className="space-y-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset max-w-md">
          <AdminSelect
            options={MULTI_OPTIONS}
            value={multiVal}
            onChange={(v) => setMultiVal(v as string[])}
            placeholder="Choose departments..."
            multi
          />
        </div>
      </div>

      {/* Textarea */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Textarea</h3>
        <div className="p-6 border border-admin-border rounded-xl bg-admin-bg-inset max-w-md">
          <textarea
            placeholder="Enter description..."
            rows={4}
            className="admin-input w-full px-3 py-2.5 text-sm resize-none"
          />
        </div>
      </div>
    </section>
  );
}
