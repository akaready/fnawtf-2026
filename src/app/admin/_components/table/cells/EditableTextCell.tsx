'use client';

import { useState, useCallback, useRef, useEffect, useTransition } from 'react';

interface Props {
  value: string;
  rowId: string;
  field: string;
  onEdit?: (rowId: string, newValue: unknown) => void | Promise<void>;
  className?: string;
  mono?: boolean;
}

export function EditableTextCell({ value, rowId, field: _field, onEdit, className, mono }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => { setDraft(value); }, [value]);

  const save = useCallback(() => {
    setEditing(false);
    if (draft.trim() === value) return;
    startTransition(async () => {
      await onEdit?.(rowId, draft.trim() || null);
    });
  }, [draft, value, rowId, onEdit]);

  if (!onEdit) {
    return (
      <span
        className={`inline-block w-full truncate ${mono ? 'font-mono text-xs' : ''} ${className ?? ''}`}
        title={value || undefined}
      >
        {value || <span className="text-admin-text-placeholder">—</span>}
      </span>
    );
  }

  if (!editing) {
    return (
      <span
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setEditing(true)}
        className={`cursor-text hover:ring-1 hover:ring-admin-border-muted rounded px-1 -mx-1 py-0.5 transition-all inline-block w-full truncate ${mono ? 'font-mono text-xs' : ''} ${className ?? ''}`}
        title={value || 'Double-click to edit'}
      >
        {value || <span className="text-admin-text-placeholder italic">—</span>}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={save}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
      className={`w-full bg-admin-bg-base border border-admin-border-emphasis rounded px-1.5 py-0.5 text-sm text-admin-text-primary focus:outline-none focus:border-admin-border-focus ${mono ? 'font-mono text-xs' : ''}`}
    />
  );
}
