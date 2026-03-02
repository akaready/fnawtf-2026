'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multi?: boolean;
  searchable?: boolean;
  className?: string;
}

export function AdminSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multi = false,
  searchable = true,
  className = '',
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedSet = new Set(Array.isArray(value) ? value : value ? [value] : []);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  // Reset highlight on search change
  useEffect(() => {
    setHighlightIdx(0);
  }, [search]);

  const handleSelect = useCallback((optValue: string) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      const next = arr.includes(optValue)
        ? arr.filter((v) => v !== optValue)
        : [...arr, optValue];
      onChange(next);
    } else {
      onChange(optValue);
      setOpen(false);
      setSearch('');
    }
  }, [multi, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIdx]) handleSelect(filtered[highlightIdx].value);
        break;
      case 'Escape':
        setOpen(false);
        setSearch('');
        break;
    }
  };

  // Scroll highlighted into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.children;
    if (items[highlightIdx]) {
      (items[highlightIdx] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx, open]);

  // Display text
  const displayText = (() => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return placeholder;
      const labels = arr.map((v) => options.find((o) => o.value === v)?.label || v);
      return labels.join(', ');
    }
    if (!value) return placeholder;
    return options.find((o) => o.value === value)?.label || value;
  })();

  const hasValue = multi ? (Array.isArray(value) ? value.length > 0 : false) : !!value;

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`admin-input w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left ${
          hasValue ? 'text-admin-text-primary' : 'text-admin-text-placeholder'
        }`}
      >
        <span className="flex-1 truncate">{displayText}</span>
        {multi && hasValue && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className="text-admin-text-faint hover:text-admin-text-primary"
          >
            <X size={12} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`text-admin-text-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[140px] bg-admin-bg-raised border border-admin-border rounded-lg shadow-lg overflow-hidden animate-dropdown-in">
          {/* Search */}
          {searchable && (
            <div className="p-2 border-b border-admin-border-subtle">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-text-faint" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-admin-xs bg-admin-bg-inset border border-admin-border-subtle rounded-md text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:border-admin-border-focus"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div ref={listRef} className="max-h-48 overflow-y-auto admin-scrollbar-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-admin-xs text-admin-text-faint">
                No results
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const selected = selectedSet.has(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      idx === highlightIdx ? 'bg-admin-bg-hover' : ''
                    } ${selected ? 'text-admin-text-primary' : 'text-admin-text-secondary'} hover:bg-admin-bg-hover`}
                  >
                    {multi && (
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selected
                          ? 'bg-admin-accent border-admin-accent text-white'
                          : 'border-admin-border-muted'
                      }`}>
                        {selected && <Check size={10} />}
                      </span>
                    )}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {!multi && selected && (
                      <Check size={14} className="text-admin-accent flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
