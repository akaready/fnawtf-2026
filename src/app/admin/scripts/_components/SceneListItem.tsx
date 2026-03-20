'use client';

/**
 * Shared scene list item — used in admin sidebar, share sidebars,
 * and mobile bottom sheets. Single source of truth for scene row rendering.
 */

interface BeatNav {
  beatId: string;
  label: string;       // "A", "B", "C" — derived by parent
  isActive: boolean;
  hasComment?: boolean;
  onClick: (e: React.MouseEvent) => void;  // must call e.stopPropagation()
}

interface Props {
  sceneNumber: number;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  beats?: BeatNav[];   // omit or [] = no beat column rendered
  hasSceneComment?: boolean;
}

export function SceneListItem({
  sceneNumber,
  slug,
  description,
  isActive = false,
  onClick,
  className = '',
  beats,
  hasSceneComment,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`text-left flex items-stretch min-h-[45px] overflow-hidden border-b border-admin-border-subtle transition-colors cursor-pointer ${
        isActive
          ? 'bg-black/40 text-admin-text-primary'
          : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
      } ${className}`}
    >
      {/* Scene number — fixed w-[52px] keeps alignment across all rows */}
      <span className="w-[52px] flex-shrink-0 font-bebas text-[44px] leading-none text-right pr-1 pl-3 translate-y-[2px] text-admin-border flex items-center justify-end">
        {sceneNumber}
      </span>

      {/* Info column — flex:1 pushes beat grid to right */}
      <div className="flex-1 min-w-0 pr-3 flex flex-col justify-center py-2">
        {slug && (
          <span className="text-admin-sm font-medium text-admin-text-faint uppercase tracking-wider whitespace-nowrap block leading-tight">
            {slug}
          </span>
        )}
        {hasSceneComment && (
          <div className="w-2 h-2 rounded-full bg-admin-warning mt-0.5" />
        )}
        {description && (
          <span className="text-admin-sm text-admin-text-muted font-normal uppercase tracking-wider whitespace-nowrap block leading-tight">
            {description}
          </span>
        )}
      </div>

      {/* Beat grid — only on 2+ beat scenes, always flush right */}
      {beats && beats.length >= 2 && (
        <div className="self-stretch border-l border-admin-border-subtle grid grid-rows-2 grid-flow-col auto-cols-[22px] gap-px bg-admin-border-subtle flex-shrink-0">
          {beats.map(beat => (
            <button
              key={beat.beatId}
              type="button"
              onClick={beat.onClick}
              className={`relative flex items-center justify-center font-bebas text-admin-sm leading-none transition-colors ${
                beat.isActive
                  ? 'bg-admin-beat-selected-bg text-admin-beat-selected-text'
                  : 'bg-admin-bg-sidebar text-admin-text-faint hover:bg-admin-beat-hover-bg hover:text-admin-text-muted'
              }`}
            >
              {beat.label}
              {beat.hasComment && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-admin-warning border border-admin-bg-sidebar" />
              )}
            </button>
          ))}
          {beats.length % 2 !== 0 && (
            <span aria-hidden="true" className="bg-admin-bg-sidebar" />
          )}
        </div>
      )}
    </div>
  );
}
