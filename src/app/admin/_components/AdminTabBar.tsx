'use client';

import { Fragment, type ReactNode } from 'react';

export interface AdminTab {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Custom class applied when this tab is active (overrides default bg-white/10 text-white) */
  activeClassName?: string;
}

interface AdminTabBarProps {
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  /** Optional content rendered on the right side of the tab bar */
  actions?: ReactNode;
  /** Show a vertical divider after the tab with this value */
  dividerAfter?: string;
}

export function AdminTabBar({ tabs, activeTab, onTabChange, actions, dividerAfter }: AdminTabBarProps) {
  return (
    <div className="flex-shrink-0 flex items-center gap-1 px-8 py-2 border-b border-[#2a2a2a]">
      {tabs.map((tab) => (
        <Fragment key={tab.value}>
          <button
            onClick={() => onTabChange(tab.value)}
            className={`flex items-center gap-1.5 px-[15px] py-[7px] rounded-lg text-sm font-medium transition-colors border ${
              activeTab === tab.value
                ? (tab.activeClassName ?? 'bg-white/10 text-white border-transparent')
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
          {dividerAfter === tab.value && (
            <div className="w-px bg-white/10 mx-2 my-1 self-stretch" />
          )}
        </Fragment>
      ))}
      {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
    </div>
  );
}
