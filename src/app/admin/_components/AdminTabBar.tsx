'use client';

import { Fragment, type ReactNode } from 'react';

export interface AdminTab {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Custom class applied when this tab is active (overrides default bg-admin-bg-active text-admin-text-primary) */
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
    <div className="flex-shrink-0 flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-admin-border bg-admin-bg-inset overflow-x-auto [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => (
        <Fragment key={tab.value}>
          <button
            onClick={() => onTabChange(tab.value)}
            className={`flex items-center gap-1.5 px-[15px] py-[7px] rounded-lg text-sm font-medium transition-colors border ${
              activeTab === tab.value
                ? (tab.activeClassName ?? 'bg-admin-bg-active text-admin-text-primary border-transparent')
                : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
          {dividerAfter === tab.value && (
            <div className="w-px bg-admin-bg-active mx-2 my-1 self-stretch" />
          )}
        </Fragment>
      ))}
      {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
    </div>
  );
}
