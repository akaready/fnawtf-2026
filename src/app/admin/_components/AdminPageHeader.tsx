'use client';

import { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  /** Optional content rendered before the title (e.g. a back button) */
  leftContent?: ReactNode;
  /** Search input state */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Buttons / controls rendered on the right side */
  actions?: ReactNode;
  /** Extra content rendered below the title row (e.g. filter pills) */
  below?: ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  leftContent,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  actions,
  below,
}: Props) {
  return (
    <div className="flex-shrink-0 px-8 pt-10 pb-4 border-b border-white/[0.12]">
      <div className="flex items-center justify-between min-h-[48px]">
        <div className="flex items-center gap-4">
          {leftContent}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {/* Reserve subtitle space so header height stays consistent */}
            <p className={`text-sm mt-1 ${subtitle ? 'text-muted-foreground' : 'text-transparent select-none'}`}>
              {subtitle || '\u00A0'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onSearchChange !== undefined && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-56 rounded-lg border border-[#1f1f1f] bg-black pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30"
              />
            </div>
          )}
          {actions}
        </div>
      </div>
      {below && <div className="mt-4">{below}</div>}
    </div>
  );
}
