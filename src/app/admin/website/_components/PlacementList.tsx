'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { reorderPlacements, removePlacement, updatePlacement } from '@/app/admin/actions';
import type { PlacementPage, PlacementWithProject } from '@/types/placement';
import { PlacementCard, PlacementCardOverlay } from './PlacementCard';

export type PlacementLayout = 'list' | 'grid' | 'masonry' | 'featured' | 'row';

interface PlacementListProps {
  page: PlacementPage;
  initialPlacements: PlacementWithProject[];
  layout?: PlacementLayout;
  showFullWidth?: boolean;
  /** Called when a placement is removed from within the list */
  onRemove?: (id: string) => void;
}

export function PlacementList({
  page,
  initialPlacements,
  layout = 'list',
  showFullWidth = false,
  onRemove: onRemoveExternal,
}: PlacementListProps) {
  const [placements, setPlacements] = useState(initialPlacements);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = placements.findIndex((p) => p.id === active.id);
      const newIndex = placements.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(placements, oldIndex, newIndex);
      setPlacements(newOrder);

      reorderPlacements(
        newOrder.map((p, i) => ({ id: p.id, sort_order: i })),
        page,
      ).catch(console.error);
    },
    [page, placements],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      setPlacements((prev) => prev.filter((p) => p.id !== id));
      removePlacement(id, page).catch(console.error);
      onRemoveExternal?.(id);
    },
    [page, onRemoveExternal],
  );

  const handleToggleFullWidth = useCallback(
    (id: string, value: boolean) => {
      setPlacements((prev) =>
        prev.map((p) => (p.id === id ? { ...p, full_width: value } : p)),
      );
      updatePlacement(id, { full_width: value }, page).catch(console.error);
    },
    [page],
  );

  if (placements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[#333]">No projects yet — add from the sidebar.</p>
      </div>
    );
  }

  const useGrid = layout !== 'list';
  const strategy = useGrid ? rectSortingStrategy : verticalListSortingStrategy;

  const getContainerClass = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-2 gap-1.5';
      case 'masonry':
        return 'grid grid-cols-4 gap-1.5';
      case 'featured':
        return 'grid grid-cols-3 gap-1.5';
      case 'row':
        return 'grid grid-cols-3 gap-1.5';
      default:
        return 'flex flex-col gap-1.5';
    }
  };

  const getCardProps = (placement: PlacementWithProject, index: number) => {
    switch (layout) {
      case 'grid':
        return {
          mode: 'tile' as const,
          className: placement.full_width ? 'col-span-2' : '',
        };
      case 'masonry':
        return {
          mode: 'tile' as const,
          className: placement.full_width ? 'col-span-4' : '',
        };
      case 'featured':
        return {
          mode: 'tile' as const,
          className: index === 0 || placement.full_width ? 'col-span-3' : '',
        };
      case 'row':
        return {
          mode: 'tile' as const,
          className: '',
        };
      default:
        return {
          mode: 'bar' as const,
          className: '',
        };
    }
  };

  const activePlacement = activeId ? placements.find((p) => p.id === activeId) : null;
  const activeCardProps = activePlacement
    ? getCardProps(activePlacement, placements.indexOf(activePlacement))
    : null;

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={placements.map((p) => p.id)} strategy={strategy}>
          <div className={getContainerClass()}>
            {placements.map((placement, index) => {
              const cardProps = getCardProps(placement, index);
              return (
                <PlacementCard
                  key={placement.id}
                  placement={placement}
                  mode={cardProps.mode}
                  className={cardProps.className}
                  showFullWidth={showFullWidth}
                  onToggleFullWidth={handleToggleFullWidth}
                  onRemove={handleRemove}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activePlacement && activeCardProps && (
            <PlacementCardOverlay
              placement={activePlacement}
              mode={activeCardProps.mode}
              className={activeCardProps.className}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Re-export for parent component to update list after adding
export type { PlacementListProps };
