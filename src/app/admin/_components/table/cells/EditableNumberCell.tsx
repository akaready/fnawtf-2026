'use client';

import { useState, useCallback, useRef, useEffect, useTransition } from 'react';

interface Props {
  value: number | null;
  rowId: string;
  field: string;
  onEdit?: (rowId: string, newValue: unknown) => void | Promise<void>;
}

export function EditableNumberCell({ value, rowId, field: _field, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? '');
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => { setDraft(value?.toString() ?? ''); }, [value]);

  const save = useCallback(() => {
    setEditing(false);
    const num = draft.trim() === '' ? null : Number(draft);
    if (num === value) return;
    startTransition(async () => {
      await onEdit?.(rowId, num);
    });
  }, [draft, value, rowId, onEdit]);

  if (!onEdit) {
    return (
      <span className="text-muted-foreground tabular-nums">
        {value ?? <span className="text-[#303033]">—</span>}
      </span>
    );
  }

  if (!editing) {
    return (
      <span
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setEditing(true)}
        className="cursor-text hover:ring-1 hover:ring-white/15 rounded px-1 -mx-1 py-0.5 transition-all text-muted-foreground tabular-nums"
        title="Double-click to edit"
      >
        {value ?? <span className="text-[#303033]">—</span>}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
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
