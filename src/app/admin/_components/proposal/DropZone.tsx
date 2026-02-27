'use client';

import { useDroppable } from '@dnd-kit/core';
import { useBuilderDndState, type DragItemType } from './ProposalDndContext';

interface Props {
  id: string;
  zoneType: 'text' | 'video';
  zoneId: string;
  label: string;
  children?: React.ReactNode;
}

const ACCEPTS: Record<string, DragItemType> = {
  text: 'snippet',
  video: 'video',
};

export function DropZone({ id, zoneType, zoneId, label, children }: Props) {
  const { isDragging, dragType } = useBuilderDndState();
  const accepts = ACCEPTS[zoneType];
  const isRelevantDrag = isDragging && dragType === accepts;

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { zoneType, zoneId },
    disabled: !isRelevantDrag,
  });

  // If zone has content and nothing relevant is being dragged, just show children
  if (children && !isRelevantDrag) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        transition-all duration-200 rounded-xl border-2 border-dashed
        ${isRelevantDrag
          ? isOver
            ? 'min-h-[96px] border-accent/50 bg-accent/5'
            : 'min-h-[64px] border-white/15 bg-white/[0.02]'
          : children
            ? ''
            : 'min-h-[64px] border-[#2a2a2a] bg-white/[0.01]'
        }
      `}
    >
      {isRelevantDrag ? (
        <div className="flex items-center justify-center h-full min-h-[64px] text-xs font-medium">
          {isOver ? (
            <span className="text-accent/60">Drop {label.toLowerCase()} here</span>
          ) : (
            <span className="text-[#333]">{label}</span>
          )}
        </div>
      ) : children ? (
        children
      ) : (
        <div className="flex items-center justify-center min-h-[64px] text-xs text-white/10 italic">
          {label} — drag from sidebar or click +
        </div>
      )}
    </div>
  );
}
