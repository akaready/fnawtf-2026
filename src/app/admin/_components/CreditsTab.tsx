'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { saveProjectCredits, createRole, createContact } from '../actions';

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

const inputClass =
  'w-full px-3 py-2 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 transition-colors';

/* ── Combobox ───────────────────────────────────────────────────────────── */

function Combobox({
  value,
  options,
  onChange,
  placeholder,
  createLabel,
  onCreate,
  className,
}: {
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (name: string, id: string | null) => void;
  placeholder: string;
  createLabel: string;
  onCreate?: (name: string) => Promise<string>;
  className?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = options.find((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (option: { id: string; name: string }) => {
    setQuery(option.name);
    onChange(option.name, option.id);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    try {
      const id = await onCreate(query.trim());
      onChange(query.trim(), id);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleBlur = () => {
    // Allow time for click events on dropdown items
    setTimeout(() => {
      if (!ref.current?.contains(document.activeElement)) {
        setOpen(false);
        if (query.trim() && !exactMatch) {
          // Text was typed but no match selected — keep as freeform
          onChange(query.trim(), null);
        }
      }
    }, 150);
  };

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          // If empty, clear
          if (!e.target.value.trim()) onChange('', null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={inputClass}
      />
      {open && (filtered.length > 0 || (query.trim() && !exactMatch)) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#111] border border-white/15 rounded-lg shadow-xl">
          {filtered.slice(0, 20).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-white/[0.06] transition-colors truncate"
            >
              {opt.name}
            </button>
          ))}
          {query.trim() && !exactMatch && onCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-white/[0.06] transition-colors border-t border-white/[0.06]"
            >
              {creating ? 'Creating...' : `${createLabel} "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
    const id = await createContact({ name, type: 'crew' });
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
        <p className="text-sm text-muted-foreground/50 py-4">No credits yet.</p>
      ) : (
        <div className="space-y-2">
          {credits.map((credit, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 border border-border/40 rounded-lg bg-white/[0.02]"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === credits.length - 1}
                  className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                >
                  <ArrowDown size={12} />
                </button>
              </div>
              <Combobox
                value={credit.role}
                options={roles}
                onChange={(name, id) => updateCredit(i, { role: name, role_id: id })}
                placeholder="Role"
                createLabel="Add role"
                onCreate={handleCreateRole}
                className="max-w-44"
              />
              <Combobox
                value={credit.name}
                options={people}
                onChange={(name, id) => updateCredit(i, { name, contact_id: id })}
                placeholder="Full Name"
                createLabel="Add person"
                onCreate={handleCreatePerson}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors"
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
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus size={14} /> Add credit
      </button>

    </div>
  );
});
