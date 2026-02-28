'use client';

import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  /** Optional content rendered before the title (e.g. a back button) */
  leftContent?: ReactNode;
  /** Optional breadcrumb/nav link rendered above the title row; reduces top padding to compensate */
  topContent?: ReactNode;
  /** Optional content rendered on the right side of the title row */
  rightContent?: ReactNode;
  /** Inline search state — renders a search bar in the title row */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Action buttons rendered after the search bar — full-size with labels */
  actions?: ReactNode;
  /** Icon-only version of actions for mobile. Falls back to `actions` if not provided. */
  mobileActions?: ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  leftContent,
  topContent,
  rightContent,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  actions,
  mobileActions,
}: Props) {
  const hasInlineControls = onSearchChange !== undefined || actions || rightContent;

  return (
    <div
      className="@container flex-shrink-0 h-[7rem] px-6 @xl:px-8 border-b border-[#2a2a2a] flex flex-col justify-center"
    >
      {/* Breadcrumb row */}
      {topContent && <div className="mb-2">{topContent}</div>}

      {/* Wide: single row — title + search + actions */}
      <div className="hidden @xl:flex items-center gap-3 min-w-0">
        {leftContent}
        <div className="min-w-0 shrink-0 max-w-[40%]">
          <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm mt-1 text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {hasInlineControls && (
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            {rightContent}
            {onSearchChange !== undefined && (
              <div className="relative flex-1 max-w-64 min-w-[100px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616166]" />
                <input
                  type="text"
                  value={search ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="admin-input w-full pl-9 pr-9 py-1.5 text-sm"
                />
                {search && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616166] hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0 [&_button]:py-1.5 [&_a]:py-1.5 [&_button]:whitespace-nowrap">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Narrow: stacked — title row, then controls row */}
      <div className="flex @xl:hidden flex-col gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {leftContent}
          <div className="min-w-0 shrink">
            <h1 className="text-xl font-bold tracking-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs mt-0.5 text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex-1" />
          {rightContent}
        </div>
        {(onSearchChange !== undefined || actions) && (
          <div className="flex items-center gap-2">
            {onSearchChange !== undefined && (
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616166]" />
                <input
                  type="text"
                  value={search ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="admin-input w-full pl-9 pr-9 py-1.5 text-sm"
                />
                {search && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616166] hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {mobileActions ?? actions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
