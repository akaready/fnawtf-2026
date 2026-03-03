'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
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
}

export function ImageActionButton({ icon: Icon, color, title, onClick, variant = 'overlay' }: Props) {
  const isOverlay = variant === 'overlay';
  const [armed, setArmed] = useState(false);

  // Danger: first click arms, mouse-out resets, second click fires
  if (color === 'danger' && armed) {
    const className = isOverlay
      ? 'w-7 h-7 flex items-center justify-center rounded bg-red-500 text-white hover:bg-red-600 transition-colors'
      : 'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-red-400 bg-red-500/15 hover:bg-red-500/25 transition-all';

    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); setArmed(false); }}
        onMouseLeave={() => setArmed(false)}
        className={className}
        title="Confirm delete"
      >
        <Check size={12} />
      </button>
    );
  }

  const handleClick = color === 'danger' ? () => setArmed(true) : onClick;

  const className = isOverlay
    ? `w-7 h-7 flex items-center justify-center rounded bg-black/50 text-white/80 ${overlayHover[color]} transition-colors`
    : `flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted ${rowHover[color]} transition-all`;

  return (
    <button type="button" onClick={handleClick} className={className} title={title}>
      <Icon size={12} />
    </button>
  );
}
