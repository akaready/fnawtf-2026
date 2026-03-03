'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

const inputCls =
  'w-full rounded-lg border border-admin-border-subtle bg-admin-bg-base px-3 py-2.5 text-sm text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:ring-1 focus:ring-admin-border-emphasis';

const inputClsCompact =
  'w-full rounded border border-admin-border-subtle bg-admin-bg-base px-2 h-7 text-xs text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:border-admin-border-focus';

interface AdminComboboxProps {
  /** Selected option ID (null = nothing selected) */
  value: string | null;
  /** Available options */
  options: Array<{ id: string; label: string }>;
  /** Called when selection changes */
  onChange: (id: string | null) => void;
  /** Placeholder text shown when empty */
  placeholder?: string;
  /** Callback to create a new record — opens side panel, etc. */
  onCreate?: (query: string) => void;
  /** Label for the create button, e.g. "Add Client" */
  createLabel?: string;
  /** Allow clearing to null (default true) */
  nullable?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Enable type-to-search filtering (default true). Set false for enum/fixed-option selects. */
  searchable?: boolean;
  /** Compact sizing (h-7, text-xs) for inline/row contexts like scene headers */
  compact?: boolean;
}

export function AdminCombobox({
  value,
  options,
  onChange,
  placeholder = 'Search…',
  onCreate,
  createLabel = 'Add new',
  nullable = true,
  disabled = false,
  searchable = true,
  compact = false,
}: AdminComboboxProps) {
  const cls = compact ? inputClsCompact : inputCls;
  const itemCls = compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  const selected = value ? options.find((o) => o.id === value) : null;
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync query when selected option changes externally
  useEffect(() => { setQuery(selected?.label ?? ''); }, [selected]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = searchable
    ? options.find((o) => o.label.toLowerCase() === query.trim().toLowerCase())
    : selected;

  // Build the items list: [None?] + filtered + [Create?]
  const hasNone = nullable && value !== null;
  const hasCreate = onCreate && query.trim() && !exactMatch;
  const totalItems = (hasNone ? 1 : 0) + filtered.length + (hasCreate ? 1 : 0);

  // Reset highlight on filter change
  useEffect(() => { setHighlightIdx(0); }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-combobox-item]');
    items[highlightIdx]?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx, open]);

  const handleSelect = useCallback((id: string | null) => {
    onChange(id);
    setQuery(id ? options.find((o) => o.id === id)?.label ?? '' : '');
    setOpen(false);
  }, [onChange, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (totalItems === 0) break;
        {
          let idx = highlightIdx;
          if (hasNone) {
            if (idx === 0) { handleSelect(null); return; }
            idx -= 1;
          }
          if (idx < filtered.length) {
            handleSelect(filtered[idx].id);
          } else if (hasCreate && onCreate) {
            onCreate(query.trim());
            setOpen(false);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        if (selected) setQuery(selected.label);
        break;
    }
  };

  return (
    <div ref={ref} className="relative">
      {searchable ? (
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (!e.target.value.trim() && nullable) onChange(null);
          }}
          onFocus={() => { if (!disabled) setOpen(true); }}
          onBlur={() => {
            setTimeout(() => {
              if (!ref.current?.contains(document.activeElement)) {
                setOpen(false);
                if (!query.trim() && nullable) onChange(null);
                else if (selected && query !== selected.label) setQuery(selected.label);
                else if (!selected && query.trim() && !nullable) setQuery('');
              }
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${cls} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) setOpen((o) => !o); }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => {
              if (!ref.current?.contains(document.activeElement)) setOpen(false);
            }, 150);
          }}
          className={`${cls} text-left flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={`flex-1 min-w-0 truncate ${selected ? 'text-admin-text-primary' : 'text-admin-text-placeholder'}`}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown size={14} className={`flex-shrink-0 text-admin-text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
      {open && totalItems > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto admin-scrollbar bg-admin-bg-raised border border-admin-border-muted rounded-lg shadow-xl"
        >
          {hasNone && (
            <button
              type="button"
              data-combobox-item
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(null)}
              className={`w-full text-left ${itemCls} transition-colors ${
                highlightIdx === 0
                  ? 'bg-admin-bg-active text-admin-text-muted'
                  : 'text-admin-text-muted hover:bg-admin-bg-hover'
              }`}
            >
              None
            </button>
          )}
          {filtered.slice(0, 30).map((opt, i) => {
            const itemIdx = (hasNone ? 1 : 0) + i;
            return (
              <button
                key={opt.id}
                type="button"
                data-combobox-item
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left ${itemCls} transition-colors truncate ${
                  itemIdx === highlightIdx
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : opt.id === value
                      ? 'text-admin-text-primary bg-admin-bg-hover'
                      : 'text-admin-text-primary hover:bg-admin-bg-hover'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {hasCreate && onCreate && (
            <button
              type="button"
              data-combobox-item
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onCreate(query.trim()); setOpen(false); }}
              className={`w-full text-left ${itemCls} transition-colors border-t border-admin-border ${
                highlightIdx === totalItems - 1
                  ? 'bg-admin-bg-active text-admin-info'
                  : 'text-admin-info hover:bg-admin-bg-hover'
              }`}
            >
              {createLabel} &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
