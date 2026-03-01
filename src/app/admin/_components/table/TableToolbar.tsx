'use client';

import { useRef, useEffect } from 'react';

/* ── Airtable-style color variants ─────────────────────────────────────── */

const TOOLBAR_COLORS = {
  blue: {
    active: 'bg-[#2d7ff9]/15 text-[#2d7ff9] border-[#2d7ff9]/25',
    badge: 'bg-[#2d7ff9]/15 text-[#2d7ff9]',
  },
  green: {
    active: 'bg-[#20c933]/15 text-[#20c933] border-[#20c933]/25',
    badge: 'bg-[#20c933]/15 text-[#20c933]',
  },
  purple: {
    active: 'bg-[#8b46ff]/15 text-[#8b46ff] border-[#8b46ff]/25',
    badge: 'bg-[#8b46ff]/15 text-[#8b46ff]',
  },
  orange: {
    active: 'bg-[#ff6f2c]/15 text-[#ff6f2c] border-[#ff6f2c]/25',
    badge: 'bg-[#ff6f2c]/15 text-[#ff6f2c]',
  },
  yellow: {
    active: 'bg-[#fcb400]/15 text-[#fcb400] border-[#fcb400]/25',
    badge: 'bg-[#fcb400]/15 text-[#fcb400]',
  },
  red: {
    active: 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25',
    badge: 'bg-[#ef4444]/15 text-[#ef4444]',
  },
  neutral: {
    active: 'bg-admin-bg-active text-admin-text-secondary border-white/15',
    badge: 'bg-admin-bg-active text-admin-text-secondary',
  },
} as const;

export type ToolbarColor = keyof typeof TOOLBAR_COLORS;

/* ── ToolbarButton ──────────────────────────────────────────────────────── */

export function ToolbarButton({
  icon: Icon,
  label,
  badge,
  active,
  disabled,
  color = 'neutral',
  onClick,
}: {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  label: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  color?: ToolbarColor;
  onClick: () => void;
}) {
  const scheme = TOOLBAR_COLORS[color];
  const iconOnly = !label;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex items-center ${iconOnly ? 'px-[9px]' : 'gap-1.5 px-[15px]'} py-[7px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap border ${
        disabled
          ? 'text-admin-text-ghost border-transparent cursor-default'
          : active
            ? scheme.active
            : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
      }`}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label && label}
      {badge !== undefined && badge !== 0 && (
        <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
          active ? scheme.badge : 'bg-admin-bg-active text-admin-text-secondary'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── ToolbarPopover ─────────────────────────────────────────────────────── */

export function ToolbarPopover({
  children,
  onClose,
  width,
  align = 'left',
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
  align?: 'left' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute top-full mt-[5px] bg-admin-bg-overlay border-2 border-admin-border rounded-xl shadow-[0_10px_40px_10px_rgba(0,0,0,0.5)] p-3 z-50 animate-dropdown-in max-w-[calc(100vw-2rem)] ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${width ?? 'w-80'}`}
    >
      {children}
    </div>
  );
}
