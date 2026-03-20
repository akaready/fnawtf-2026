'use client';

/**
 * Shared scene list item — used in admin sidebar, share sidebars,
 * and mobile bottom sheets. Single source of truth for scene row rendering.
 *
 * IMPORTANT: The parent container MUST be `grid grid-cols-[auto_1fr]`
 * so all rows share the same auto-width first column.
 */

interface Props {
  sceneNumber: number;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SceneListItem({
  sceneNumber,
  slug,
  description,
  isActive = false,
  onClick,
  className = '',
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`text-left col-span-2 grid grid-cols-subgrid items-center h-[45px] overflow-hidden border-b border-admin-border-subtle transition-colors ${
        isActive
          ? 'bg-black/40 text-admin-text-primary'
          : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
      } ${className}`}
    >
      <span className="text-admin-border font-bebas text-[56px] leading-none text-right pr-0.5 pl-3 -translate-y-[3px]">
        {sceneNumber}
      </span>
      <div className="pr-5 -translate-y-[3px]">
        {slug && (
          <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider whitespace-nowrap block leading-tight">
            {slug}
          </span>
        )}
        {description && (
          <span className="text-xs text-admin-text-muted font-normal uppercase tracking-wider whitespace-nowrap block leading-tight">
            {description}
          </span>
        )}
      </div>
    </button>
  );
}
