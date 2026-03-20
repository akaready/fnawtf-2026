'use client';

import { useId } from 'react';
import { Plus, PanelLeftClose } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SceneListItem } from './SceneListItem';

/**
 * Shared scene navigation sidebar — used in admin editor, share table view,
 * and share presentation view. Single source of truth.
 */

interface SceneData {
  id: string;
  sceneNumber: number;
  int_ext: string;
  location_name: string;
  time_of_day: string;
  scene_description: string | null;
}

interface Props {
  scenes: SceneData[];
  activeSceneId: string | null;
  onSelectScene: (id: string) => void;
  /** Show "SCENES" header with collapse button */
  showHeader?: boolean;
  onCollapse?: () => void;
  /** Enable drag-and-drop reordering (admin editor only) */
  draggable?: boolean;
  onReorder?: (ids: string[]) => void;
  /** Show "New Scene" footer button (admin editor only) */
  showAddButton?: boolean;
  onAddScene?: () => void;
}

function buildSlug(scene: SceneData): string {
  return `${scene.int_ext}. ${scene.location_name || '—'}${scene.time_of_day ? ` — ${scene.time_of_day}` : ''}`;
}

export function SceneNav({
  scenes,
  activeSceneId,
  onSelectScene,
  showHeader = false,
  onCollapse,
  draggable = false,
  onReorder,
  showAddButton = false,
  onAddScene,
}: Props) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = scenes.findIndex(s => s.id === active.id);
    const newIndex = scenes.findIndex(s => s.id === over.id);
    onReorder(arrayMove(scenes.map(s => s.id), oldIndex, newIndex));
  };

  const listContent = draggable ? (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {scenes.map(scene => (
          <SortableSceneRow
            key={scene.id}
            scene={scene}
            isActive={scene.id === activeSceneId}
            onSelect={() => onSelectScene(scene.id)}
          />
        ))}
      </SortableContext>
    </DndContext>
  ) : (
    scenes.map(scene => (
      <SceneListItem
        key={scene.id}
        sceneNumber={scene.sceneNumber}
        slug={buildSlug(scene)}
        description={scene.scene_description}
        isActive={scene.id === activeSceneId}
        onClick={() => onSelectScene(scene.id)}
      />
    ))
  );

  return (
    <div className="bg-admin-bg-sidebar flex flex-col h-full">
      {showHeader && (
        <div className="h-[3rem] flex items-center justify-between px-4 border-b border-admin-border flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-admin-text-faint">Scenes</span>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="w-7 h-7 flex items-center justify-center rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto admin-scrollbar grid grid-cols-[auto_1fr] content-start">
        {listContent}
      </div>

      {showAddButton && onAddScene && (
        <div className="flex-shrink-0 border-t border-admin-border px-3 py-3.5 flex items-center">
          <button
            onClick={onAddScene}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors"
          >
            <Plus size={12} />
            New Scene
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sortable wrapper for DnD mode ────────────────────────────────────────

function SortableSceneRow({
  scene,
  isActive,
  onSelect,
}: {
  scene: SceneData;
  isActive: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`text-left col-span-2 grid grid-cols-subgrid items-center h-[45px] overflow-hidden border-b border-admin-border-subtle cursor-grab transition-colors ${
        isActive
          ? 'bg-black/40 text-admin-text-primary'
          : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
      }`}
      onClick={onSelect}
    >
      <span className="text-admin-border font-bebas text-[56px] leading-none text-right pr-2">
        {scene.sceneNumber}
      </span>
      <div className="pr-1 -translate-y-[3px]">
        <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider whitespace-nowrap block leading-tight">
          {buildSlug(scene)}
        </span>
        {scene.scene_description && (
          <span className="text-xs text-admin-text-muted font-normal uppercase tracking-wider whitespace-nowrap block leading-tight">
            {scene.scene_description}
          </span>
        )}
      </div>
    </div>
  );
}
