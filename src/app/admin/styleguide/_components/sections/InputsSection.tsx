'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { AdminCombobox } from '@/app/admin/_components/AdminCombobox';
import { AdminSelect } from '../AdminSelect';

const COMBOBOX_ENUM_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'pending', label: 'Pending' },
  { id: 'archived', label: 'Archived' },
  { id: 'draft', label: 'Draft' },
];

const COMBOBOX_RECORD_OPTIONS = [
  { id: '1', label: 'Acme Corp' },
  { id: '2', label: 'Globex Industries' },
  { id: '3', label: 'Initech' },
  { id: '4', label: 'Umbrella Corp' },
  { id: '5', label: 'Stark Industries' },
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
  const [enumVal, setEnumVal] = useState<string | null>(null);
  const [recordVal, setRecordVal] = useState<string | null>(null);
  const [requiredVal, setRequiredVal] = useState<string | null>('active');
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

      {/* AdminCombobox — Single Select */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">AdminCombobox — Enum (nullable)</h3>
        <p className="text-admin-sm text-admin-text-muted mb-3">Click to see all options. Select &ldquo;None&rdquo; to clear. Use <code className="text-admin-xs bg-admin-bg-hover px-1 py-0.5 rounded">searchable=false</code> for status, type, phase fields.</p>
        <div className="space-y-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset max-w-md">
          <AdminCombobox
            options={COMBOBOX_ENUM_OPTIONS}
            value={enumVal}
            onChange={setEnumVal}
            placeholder="Choose status…"
            searchable={false}
          />
        </div>
      </div>

      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">AdminCombobox — Enum (required)</h3>
        <p className="text-admin-sm text-admin-text-muted mb-3">No &ldquo;None&rdquo; option. Use <code className="text-admin-xs bg-admin-bg-hover px-1 py-0.5 rounded">nullable=false</code> for required fields.</p>
        <div className="space-y-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset max-w-md">
          <AdminCombobox
            options={COMBOBOX_ENUM_OPTIONS}
            value={requiredVal}
            onChange={(v) => { if (v) setRequiredVal(v); }}
            placeholder="Choose status…"
            nullable={false}
            searchable={false}
          />
        </div>
      </div>

      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">AdminCombobox — Record with onCreate</h3>
        <p className="text-admin-sm text-admin-text-muted mb-3">Type a name not in the list to see the &ldquo;Add Client&rdquo; option. For client, contact, project fields.</p>
        <div className="space-y-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset max-w-md">
          <AdminCombobox
            options={COMBOBOX_RECORD_OPTIONS}
            value={recordVal}
            onChange={setRecordVal}
            placeholder="Search clients…"
            createLabel="Add Client"
            onCreate={() => {}}
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
