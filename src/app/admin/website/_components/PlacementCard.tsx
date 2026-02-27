'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import type { PlacementWithProject } from '@/types/placement';

interface PlacementCardProps {
  placement: PlacementWithProject;
  mode?: 'bar' | 'tile';
  className?: string;
  showFullWidth?: boolean;
  onToggleFullWidth?: (id: string, value: boolean) => void;
  onRemove: (id: string) => void;
}

/** Static card content shared between sortable cards and drag overlay */
function CardContent({
  placement,
  mode,
  showFullWidth,
  onToggleFullWidth,
  onRemove,
  isDragging,
}: {
  placement: PlacementWithProject;
  mode: 'bar' | 'tile';
  showFullWidth?: boolean;
  onToggleFullWidth?: (id: string, value: boolean) => void;
  onRemove?: (id: string) => void;
  isDragging?: boolean;
}) {
  const isTile = mode === 'tile';
  const thumbSize = isTile ? 'w-9 h-9' : 'w-12 h-8';

  return (
    <>
      <div className={`flex-shrink-0 ${thumbSize} rounded overflow-hidden bg-white/[0.04]`}>
        {placement.project.thumbnail_url ? (
          <img
            src={placement.project.thumbnail_url}
            alt={placement.project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 truncate">
          {placement.project.title}
        </p>
        <p className="text-xs text-white/30 truncate">{placement.project.client_name}</p>
      </div>

      {!isDragging && showFullWidth && onToggleFullWidth && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFullWidth(placement.id, !placement.full_width); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex-shrink-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
            placement.full_width
              ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-400/10'
              : 'text-white/20 hover:text-white/40 hover:bg-white/5'
          }`}
          title={placement.full_width ? 'Shrink to normal' : 'Expand to full width'}
        >
          {placement.full_width ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      )}

      {onRemove && !isDragging && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(placement.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-shrink-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 hover:bg-red-400/10"
          aria-label="Remove from page"
        >
          <X size={14} />
        </button>
      )}
    </>
  );
}

/** Drag overlay version — no sortable hooks, just visuals */
export function PlacementCardOverlay({
  placement,
  mode = 'tile',
  className = '',
}: {
  placement: PlacementWithProject;
  mode?: 'bar' | 'tile';
  className?: string;
}) {
  const isTile = mode === 'tile';
  const padding = isTile ? 'px-2 py-1.5 gap-2.5' : 'px-3 py-2.5 gap-3';

  return (
    <div
      className={`relative flex items-center ${padding} rounded-lg bg-white/[0.08] border border-purple-400/30 shadow-lg shadow-purple-500/10 cursor-grabbing ${className}`}
    >
      <CardContent placement={placement} mode={mode} />
    </div>
  );
}

export function PlacementCard({
  placement,
  mode = 'bar',
  className = '',
  showFullWidth,
  onToggleFullWidth,
  onRemove,
}: PlacementCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: placement.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isTile = mode === 'tile';
  const padding = isTile ? 'px-2 py-1.5 gap-2.5' : 'px-3 py-2.5 gap-3';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex items-center ${padding} rounded-lg group touch-none ${
        isDragging
          ? 'border-2 border-dashed border-[#2a2a2a] bg-white/[0.02] opacity-40'
          : 'bg-white/[0.03] border border-[#2a2a2a] cursor-grab active:cursor-grabbing'
      } ${className}`}
    >
      <CardContent
        placement={placement}
        mode={mode}
        showFullWidth={showFullWidth}
        onToggleFullWidth={onToggleFullWidth}
        onRemove={onRemove}
        isDragging={isDragging}
      />
    </div>
  );
}
