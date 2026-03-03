'use client';

import type { LucideIcon } from 'lucide-react';

/**
 * Standardized hover-action button for image overlays and image rows.
 *
 * Variants:
 *   overlay  — used inside dark overlay on image grids (bg-black/60, white icon)
 *   row      — used in list rows alongside other controls (transparent, muted icon)
 *
 * Colors map to admin semantic tokens:
 *   warning  — star / favorite (amber)
 *   info     — download / regenerate / upload (blue)
 *   danger   — delete / trash (red)
 *   neutral  — expand / fullscreen (white glow)
 */

type ActionColor = 'warning' | 'info' | 'danger' | 'neutral';
type ActionVariant = 'overlay' | 'row';

const overlayHover: Record<ActionColor, string> = {
  warning: 'hover:bg-admin-warning/80',
  info:    'hover:bg-admin-info/80',
  danger:  'hover:bg-admin-danger/80',
  neutral: 'hover:bg-white/20',
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

  const className = isOverlay
    ? `w-7 h-7 flex items-center justify-center rounded bg-black/60 text-white ${overlayHover[color]} transition-colors`
    : `flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted ${rowHover[color]} transition-all`;

  return (
    <button type="button" onClick={onClick} className={className} title={title}>
      <Icon size={12} />
    </button>
  );
}
