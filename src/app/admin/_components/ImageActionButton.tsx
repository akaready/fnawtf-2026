'use client';

import type { LucideIcon } from 'lucide-react';

type ActionColor = 'warning' | 'info' | 'danger' | 'neutral';
type ActionVariant = 'overlay' | 'row';

const overlayHover: Record<ActionColor, string> = {
  warning: 'hover:bg-amber-500 hover:text-white',
  info:    'hover:bg-sky-500 hover:text-white',
  danger:  'hover:bg-red-500 hover:text-white',
  neutral: 'hover:bg-zinc-500 hover:text-white',
};

const rowHover: Record<ActionColor, string> = {
  warning: 'hover:text-admin-warning hover:bg-admin-warning/8',
  info:    'hover:text-admin-info hover:bg-admin-info/8',
  danger:  'hover:text-admin-danger hover:bg-red-500/8',
  neutral: 'hover:text-admin-text-primary hover:bg-admin-bg-hover-strong',
};

interface Props {
  icon: LucideIcon;
  color: ActionColor;
  title: string;
  onClick: () => void;
  variant?: ActionVariant;
  hidden?: boolean;
}

export function ImageActionButton({ icon: Icon, color, title, onClick, variant = 'overlay', hidden }: Props) {
  const isOverlay = variant === 'overlay';

  const className = isOverlay
    ? `w-7 h-7 flex items-center justify-center rounded bg-black/50 text-white/80 ${overlayHover[color]} transition-all ${hidden ? 'opacity-0 pointer-events-none' : ''}`
    : `flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted ${rowHover[color]} transition-all`;

  return (
    <button type="button" onClick={onClick} className={className} title={title}>
      <Icon size={12} />
    </button>
  );
}
