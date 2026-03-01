'use client';

import { useState, useMemo, useCallback, useRef, useEffect, useTransition } from 'react';

interface Props {
  tags: string[] | null;
  rowId: string;
  field: string;
  suggestions?: string[];
  onEdit?: (rowId: string, newValue: unknown) => void | Promise<void>;
}

export function EditableTagsCell({ tags, rowId, field: _field, suggestions, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string[]>(tags ?? []);
  const [input, setInput] = useState('');
  const [hlIndex, setHlIndex] = useState(-1);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!suggestions || !input.trim()) return [];
    const q = input.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q) && !value.includes(s)).slice(0, 8);
  }, [suggestions, input, value]);

  const addTag = useCallback((tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    const next = [...value, t];
    setValue(next);
    setInput('');
    setHlIndex(-1);
    startTransition(async () => {
      await onEdit?.(rowId, next);
    });
  }, [value, rowId, onEdit]);

  const removeTag = useCallback((tag: string) => {
    const next = value.filter((t) => t !== tag);
    setValue(next);
    startTransition(async () => {
      await onEdit?.(rowId, next);
    });
  }, [value, rowId, onEdit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHlIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHlIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (hlIndex >= 0 && filtered[hlIndex]) addTag(filtered[hlIndex]);
      else if (input.trim()) addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing]);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  // Read-only mode (no onEdit)
  if (!onEdit) {
    return (
      <div className="flex flex-wrap gap-1">
        {(!tags || tags.length === 0) ? (
          <span className="text-admin-text-placeholder text-xs">—</span>
        ) : tags.map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-admin-bg-hover text-admin-text-muted/70 whitespace-nowrap">{t}</span>
        ))}
      </div>
    );
  }

  if (!editing) {
    return (
      <div onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="cursor-pointer min-h-[24px] flex flex-wrap gap-1 w-full rounded px-1 -mx-1 py-0.5 hover:ring-1 hover:ring-admin-border-muted transition-all">
        {(!tags || tags.length === 0) ? (
          <span className="text-admin-text-placeholder text-xs">—</span>
        ) : tags.map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-admin-bg-hover text-admin-text-muted/70 whitespace-nowrap">{t}</span>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-[180px]" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1 items-center border border-admin-border-subtle rounded-lg bg-admin-bg-base px-2 py-1">
        {value.map((t) => (
          <span key={t} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-admin-bg-active text-admin-text-primary/80">
            {t}
            <button onClick={() => removeTag(t)} className="ml-0.5 text-admin-text-faint hover:text-admin-text-primary">&times;</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setHlIndex(-1); }}
          onKeyDown={handleKeyDown}
          placeholder="Add…"
          className="flex-1 min-w-[50px] bg-transparent text-xs text-admin-text-primary placeholder:text-admin-text-placeholder outline-none"
        />
      </div>
      {filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-admin-bg-base border border-admin-border-subtle rounded-lg shadow-xl max-h-40 overflow-y-auto admin-scrollbar">
          {filtered.map((s, i) => (
            <button
              key={s}
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                i === hlIndex ? 'bg-admin-bg-active text-admin-text-primary' : 'text-admin-text-muted hover:bg-admin-bg-hover'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
