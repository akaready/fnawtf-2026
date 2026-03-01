'use client';

import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface FilterDropdownItem {
  id: string;
  name: string;
  subtitle?: string;
}

interface Props {
  label: string;
  searchPlural?: string;
  icon?: ReactNode;
  items: FilterDropdownItem[];
  value: string | null;
  onChange: (id: string | null) => void;
  allowClear?: boolean;
  clearLabel?: string;
  placeholder?: string;
  width?: string;
}

export function FilterDropdown({
  label,
  searchPlural,
  icon,
  items,
  value,
  onChange,
  allowClear = false,
  clearLabel = 'Any',
  placeholder,
  width = 'w-72',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const selectedName = value ? items.find((i) => i.id === value)?.name : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm transition-colors border border-transparent ${
          value
            ? 'text-admin-text-secondary bg-admin-bg-hover border-admin-border'
            : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
        }`}
      >
        {icon}
        <span className="hidden @lg:inline">{selectedName ?? placeholder ?? label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-[5px] ${width} bg-admin-bg-overlay border-2 border-admin-border rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-dropdown-in`}>
          <div className="flex items-center gap-2 px-3 py-[10px] border-b border-admin-border bg-admin-bg-base">
            <Search size={13} className="text-admin-text-faint flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${searchPlural ?? `${label.toLowerCase()}s`}...`}
              className="flex-1 bg-transparent text-sm text-admin-text-primary outline-none placeholder:text-admin-text-ghost"
            />
          </div>
          <div className="max-h-56 overflow-y-auto admin-scrollbar py-1">
            {allowClear && (
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 transition-colors ${
                  !value
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text-primary/90'
                }`}
              >
                <span className="text-sm">{clearLabel}</span>
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-admin-text-ghost text-center">No matches</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onChange(item.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 transition-colors ${
                    value === item.id
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-secondary hover:bg-admin-bg-hover hover:text-admin-text-primary/90'
                  }`}
                >
                  <span className="text-sm truncate block">{item.name}</span>
                  {item.subtitle && (
                    <span className="text-xs text-admin-text-faint truncate block">{item.subtitle}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
