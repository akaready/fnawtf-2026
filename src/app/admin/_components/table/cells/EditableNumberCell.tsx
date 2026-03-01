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
      <span className="text-admin-text-muted tabular-nums">
        {value ?? <span className="text-admin-text-placeholder">—</span>}
      </span>
    );
  }

  if (!editing) {
    return (
      <span
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setEditing(true)}
        className="cursor-text hover:ring-1 hover:ring-admin-border-muted rounded px-1 -mx-1 py-0.5 transition-all text-admin-text-muted tabular-nums"
        title="Double-click to edit"
      >
        {value ?? <span className="text-admin-text-placeholder">—</span>}
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
      className="w-16 bg-admin-bg-base border border-admin-border-emphasis rounded px-1.5 py-0.5 text-sm text-admin-text-primary focus:outline-none focus:border-admin-border-focus tabular-nums"
    />
  );
}
