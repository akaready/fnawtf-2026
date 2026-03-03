'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { saveProjectCredits, createRole, createContact } from '../actions';
import { AdminCombobox } from './AdminCombobox';

interface Credit {
  role: string;
  name: string;
  sort_order: number;
  role_id?: string | null;
  contact_id?: string | null;
}

interface RoleOption {
  id: string;
  name: string;
}

interface PersonOption {
  id: string;
  name: string;
}

interface Props {
  projectId: string;
  initialCredits: Credit[];
  roles?: RoleOption[];
  people?: PersonOption[];
}

export type CreditsTabHandle = {
  save: () => Promise<void>;
  isDirty: boolean;
};

/* ── Credits Tab ────────────────────────────────────────────────────────── */

export const CreditsTab = forwardRef<CreditsTabHandle, Props>(function CreditsTab(
  { projectId, initialCredits, roles: initialRoles = [], people: initialPeople = [] },
  ref
) {
  const [credits, setCredits] = useState<Credit[]>(
    initialCredits.length ? initialCredits : []
  );
  const [roles, setRoles] = useState(initialRoles);
  const [people, setPeople] = useState(initialPeople);
  const [isDirty, setIsDirty] = useState(false);

  const updateCredit = (index: number, updates: Partial<Credit>) => {
    setCredits((prev) => prev.map((c, i) => (i === index ? { ...c, ...updates } : c)));
    setIsDirty(true);
  };

  const add = () => {
    setCredits((prev) => [...prev, { role: '', name: '', sort_order: prev.length, role_id: null, contact_id: null }]);
    setIsDirty(true);
  };

  const remove = (index: number) => {
    setCredits((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i })));
    setIsDirty(true);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...credits];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCredits(next.map((c, i) => ({ ...c, sort_order: i })));
    setIsDirty(true);
  };

  const handleCreateRole = async (name: string): Promise<string> => {
    const id = await createRole(name);
    setRoles((prev) => [...prev, { id, name }].sort((a, b) => a.name.localeCompare(b.name)));
    return id;
  };

  const handleCreatePerson = async (name: string): Promise<string> => {
    const parts = name.split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';
    const id = await createContact({ first_name, last_name, type: 'crew' });
    setPeople((prev) => [...prev, { id, name }].sort((a, b) => a.name.localeCompare(b.name)));
    return id;
  };

  async function handleSave(): Promise<void> {
    await saveProjectCredits(projectId, credits);
    setIsDirty(false);
  }

  useImperativeHandle(ref, () => ({ save: handleSave, isDirty }));


  return (
    <div className="space-y-4">
      {credits.length === 0 ? (
        <p className="text-sm text-admin-text-faint py-4">No credits yet.</p>
      ) : (
        <div className="space-y-2">
          {credits.map((credit, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 border border-admin-border-subtle rounded-lg bg-admin-bg-subtle"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-admin-text-ghost hover:text-admin-text-muted disabled:opacity-20 transition-colors"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === credits.length - 1}
                  className="text-admin-text-ghost hover:text-admin-text-muted disabled:opacity-20 transition-colors"
                >
                  <ArrowDown size={12} />
                </button>
              </div>
              <div className="max-w-44">
                <AdminCombobox
                  value={credit.role_id ?? null}
                  options={roles.map((r) => ({ id: r.id, label: r.name }))}
                  onChange={(id) => {
                    const r = id ? roles.find((ro) => ro.id === id) : null;
                    updateCredit(i, { role: r?.name ?? '', role_id: id });
                  }}
                  placeholder="Role"
                  createLabel="Add role"
                  onCreate={async (name) => {
                    const id = await handleCreateRole(name);
                    updateCredit(i, { role: name, role_id: id });
                  }}
                />
              </div>
              <div className="flex-1">
                <AdminCombobox
                  value={credit.contact_id ?? null}
                  options={people.map((p) => ({ id: p.id, label: p.name }))}
                  onChange={(id) => {
                    const p = id ? people.find((pe) => pe.id === id) : null;
                    updateCredit(i, { name: p?.name ?? '', contact_id: id });
                  }}
                  placeholder="Full Name"
                  createLabel="Add person"
                  onCreate={async (name) => {
                    const id = await handleCreatePerson(name);
                    updateCredit(i, { name, contact_id: id });
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-danger hover:bg-red-500/8 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-admin-bg-hover text-admin-text-muted hover:bg-admin-bg-hover-strong hover:text-admin-text-primary transition-colors"
      >
        <Plus size={14} /> Add Credit
      </button>

    </div>
  );
});
