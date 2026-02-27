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
  /** Action buttons rendered after the search bar in the title row */
  actions?: ReactNode;
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
}: Props) {
  const hasInlineControls = onSearchChange !== undefined || actions || rightContent;

  return (
    <div className={`flex-shrink-0 px-8 pb-4 border-b border-[#2a2a2a] ${topContent ? 'pt-5' : 'pt-[45px]'}`}>
      {/* Breadcrumb row */}
      {topContent && <div className="mb-3">{topContent}</div>}

      {/* Title row */}
      <div className="flex items-center gap-4">
        {leftContent}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm mt-1 text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {hasInlineControls && (
          <div className="flex-1 flex items-center justify-end gap-3 ml-auto min-w-0">
            {rightContent}
            {onSearchChange !== undefined && (
              <div className="relative w-64">
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
            {actions && <div className="flex items-center gap-2 flex-shrink-0 [&_button]:py-1.5 [&_a]:py-1.5">{actions}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
