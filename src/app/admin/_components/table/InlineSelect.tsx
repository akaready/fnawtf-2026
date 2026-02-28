'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function InlineSelect({ options, value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-sm text-foreground hover:border-white/20 transition-colors text-left"
      >
        <span className="flex-1 truncate">{selectedLabel}</span>
        <ChevronDown size={12} className={`text-[#666] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-[3px] w-full min-w-[160px] bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-dropdown-in">
          <div className="max-h-56 overflow-y-auto admin-scrollbar py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  opt.value === value
                    ? 'bg-white/10 text-white'
                    : 'text-[#999] hover:bg-white/[0.06] hover:text-white/90'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
