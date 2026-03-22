'use client';

/**
 * Animated sidebar shell for SceneNav — shared across editor, share, and presentation views.
 * Auto-sizes to content width (w-fit) with a smooth max-width transition for show/hide.
 */

interface Props {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SceneSidebarShell({ open, children, className = '' }: Props) {
  return (
    <div
      className={`h-full overflow-hidden flex-shrink-0 border-r border-admin-border transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-w-[500px]' : 'max-w-0'} ${className}`}
    >
      <div className="h-full w-fit min-w-[280px] bg-admin-bg-nav">
        {children}
      </div>
    </div>
  );
}
