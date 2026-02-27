'use client';

import { type ReactNode } from 'react';
import { Search, X } from 'lucide-react';

interface AdminControlsBarProps {
  /** Search input state */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Buttons / controls rendered on the right side */
  actions?: ReactNode;
  /** Optional content on the left side (before search) */
  leftActions?: ReactNode;
}

export function AdminControlsBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  actions,
  leftActions,
}: AdminControlsBarProps) {
  return (
    <div className="flex-shrink-0 flex items-stretch gap-3 px-8 py-2 border-b border-[#2a2a2a] [&_button]:py-[7px] [&_a]:py-[7px]">
      {leftActions && <div className="flex items-center gap-2">{leftActions}</div>}
      {onSearchChange !== undefined && (
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="admin-input w-full h-full pl-9 pr-9 text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
    </div>
  );
}
