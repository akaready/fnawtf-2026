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
            ? 'text-[#ccc] bg-white/[0.06] border-[#2a2a2a]'
            : 'text-[#666] hover:text-[#b3b3b3] hover:bg-white/5'
        }`}
      >
        {icon}
        <span className="hidden @lg:inline">{selectedName ?? placeholder ?? label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-[5px] ${width} bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-dropdown-in`}>
          <div className="flex items-center gap-2 px-3 py-[10px] border-b border-[#2a2a2a] bg-black/30">
            <Search size={13} className="text-[#4d4d4d] flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${searchPlural ?? `${label.toLowerCase()}s`}...`}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#404040]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto admin-scrollbar py-1">
            {allowClear && (
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 transition-colors ${
                  !value
                    ? 'bg-white/10 text-white'
                    : 'text-[#999] hover:bg-white/[0.06] hover:text-white/90'
                }`}
              >
                <span className="text-sm italic">{clearLabel}</span>
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-[#404040] text-center">No matches</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onChange(item.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 transition-colors ${
                    value === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-[#999] hover:bg-white/[0.06] hover:text-white/90'
                  }`}
                >
                  <span className="text-sm truncate block">{item.name}</span>
                  {item.subtitle && (
                    <span className="text-xs text-[#4d4d4d] truncate block">{item.subtitle}</span>
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
