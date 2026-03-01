'use client';

import type { LucideIcon } from 'lucide-react';

export interface ViewDef<K extends string = string> {
  key: K;
  icon: LucideIcon;
  label: string;
}

interface ViewSwitcherProps<K extends string> {
  views: ViewDef<K>[];
  activeView: K;
  onChange: (view: K) => void;
}

/**
 * Yellow-accented view mode toggle — renders in AdminPageHeader.rightContent.
 * Hides itself when there is only one view.
 */
export function ViewSwitcher<K extends string>({
  views,
  activeView,
  onChange,
}: ViewSwitcherProps<K>) {
  if (views.length <= 1) return null;

  return (
    <div className="flex items-center rounded-lg border border-admin-warning-border overflow-hidden flex-shrink-0">
      {views.map((v) => {
        const Icon = v.icon;
        const isActive = activeView === v.key;
        return (
          <button
            key={v.key}
            onClick={() => onChange(v.key)}
            className={`px-3 py-[9px] transition-colors ${
              isActive
                ? 'bg-admin-warning-bg text-admin-warning'
                : 'text-yellow-500/50 hover:text-admin-warning hover:bg-admin-warning-bg'
            }`}
            title={v.label}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
