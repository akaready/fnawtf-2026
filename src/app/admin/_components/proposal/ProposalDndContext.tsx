'use client';

import { useState, useCallback, useId, createContext, useContext } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { FileText, Video } from 'lucide-react';

export type DragItemType = 'snippet' | 'video';

interface DragData {
  source: 'sidebar';
  dragType: DragItemType;
  label?: string;
  [key: string]: unknown;
}

interface Props {
  children: React.ReactNode;
  onDropSnippet: (zoneId: string, data: Record<string, unknown>) => void;
  onDropVideo: (data: Record<string, unknown>) => void;
}

interface DndState {
  isDragging: boolean;
  dragType: DragItemType | null;
}

const BuilderDndStateContext = createContext<DndState>({ isDragging: false, dragType: null });
export const useBuilderDndState = () => useContext(BuilderDndStateContext);

export function ProposalDndContext({ children, onDropSnippet, onDropVideo }: Props) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<DragItemType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    setActiveId(event.active.id);
    setActiveDragData(data ?? null);
    setIsDragging(true);
    setDragType(data?.dragType ?? null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragData(null);
    setIsDragging(false);
    setDragType(null);

    if (!over) return;

    const activeData = active.data.current as DragData | undefined;
    if (!activeData || activeData.source !== 'sidebar') return;

    const overData = over.data.current as { zoneType?: string; zoneId?: string } | undefined;
    if (!overData?.zoneType) return;

    if (activeData.dragType === 'snippet' && overData.zoneType === 'text') {
      onDropSnippet(overData.zoneId ?? '', activeData as unknown as Record<string, unknown>);
    } else if (activeData.dragType === 'video' && overData.zoneType === 'video') {
      onDropVideo(activeData as unknown as Record<string, unknown>);
    }
  }, [onDropSnippet, onDropVideo]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveDragData(null);
    setIsDragging(false);
    setDragType(null);
  }, []);

  return (
    <BuilderDndStateContext.Provider value={{ isDragging, dragType }}>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        <DragOverlay dropAnimation={null}>
          {activeId && activeDragData && (
            <div className="bg-admin-bg-raised border border-border rounded-lg px-4 py-3 shadow-2xl max-w-xs opacity-90">
              <div className="flex items-center gap-2 text-xs text-admin-text-primary">
                {activeDragData.dragType === 'snippet' && <FileText size={12} />}
                {activeDragData.dragType === 'video' && <Video size={12} />}
                <span className="truncate">{activeDragData.label ?? 'Item'}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </BuilderDndStateContext.Provider>
  );
}
