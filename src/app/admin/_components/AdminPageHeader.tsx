'use client';

import { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  /** Optional content rendered before the title (e.g. a back button) */
  leftContent?: ReactNode;
  /** Optional content on the left side of the controls row (below title) */
  leftActions?: ReactNode;
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
  leftActions,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  actions,
  below,
}: Props) {
  const hasControls = leftActions !== undefined || onSearchChange !== undefined || actions;

  return (
    <div className="flex-shrink-0 px-8 pt-10 pb-4 border-b border-white/[0.12]">
      {/* Title row */}
      <div className="flex items-center gap-4">
        {leftContent}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm mt-1 text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Controls row: leftActions + search + actions */}
      {hasControls && (
        <div className="flex items-center gap-3 mt-4">
          {leftActions && <div className="flex items-center gap-2">{leftActions}</div>}
          {onSearchChange !== undefined && (
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="admin-input w-full pl-9 pr-3 py-2.5 text-sm"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-3 ml-auto">{actions}</div>}
        </div>
      )}

      {below && <div className="mt-4">{below}</div>}
    </div>
  );
}
