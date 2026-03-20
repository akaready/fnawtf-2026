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
  beats?: { id: string; sort_order: number }[];
}

interface Props {
  scenes: SceneData[];
  activeSceneId: string | null;
  onSelectScene: (id: string) => void;
  activeBeatId?: string | null;
  onSelectBeat?: (beatId: string) => void;
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
  activeBeatId,
  onSelectBeat,
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
            isActive={activeSceneId === scene.id}
            onSelect={() => onSelectScene(scene.id)}
            activeBeatId={activeBeatId ?? null}
            onSelectBeat={onSelectBeat ?? (() => {})}
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
        beats={(scene.beats ?? []).length >= 2
          ? [...(scene.beats ?? [])]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((beat, i) => ({
                beatId: beat.id,
                label: String.fromCharCode(65 + i),
                isActive: beat.id === (activeBeatId ?? null),
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  onSelectBeat?.(beat.id);
                },
              }))
          : undefined}
      />
    ))
  );

  return (
    <div className="min-w-max bg-admin-bg-sidebar flex flex-col h-full">
      {showHeader && (
        <div className="h-[3rem] flex items-center justify-between px-4 border-b border-admin-border flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-admin-text-faint">Scenes</span>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="w-8 h-8 flex items-center justify-center rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            >
              <PanelLeftClose size={16} />
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
  activeBeatId,
  onSelectBeat,
}: {
  scene: SceneData;
  isActive: boolean;
  onSelect: () => void;
  activeBeatId: string | null;
  onSelectBeat: (beatId: string) => void;
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

  const beatNavItems = (scene.beats ?? []).length >= 2
    ? [...(scene.beats ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((beat, i) => ({
          beatId: beat.id,
          label: String.fromCharCode(65 + i),
          isActive: beat.id === activeBeatId,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectBeat(beat.id);
          },
        }))
    : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`text-left col-span-2 flex items-stretch min-h-[45px] overflow-hidden border-b border-admin-border-subtle cursor-grab transition-colors ${
        isActive
          ? 'bg-black/40 text-admin-text-primary'
          : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
      }`}
      onClick={onSelect}
    >
      <span className="w-[52px] flex-shrink-0 font-bebas text-[44px] leading-none text-right pr-1 pl-3 translate-y-[2px] text-admin-border flex items-center justify-end">
        {scene.sceneNumber}
      </span>
      <div className="flex-1 min-w-0 pr-3 flex flex-col justify-center py-2">
        <span className="text-admin-sm font-medium text-admin-text-faint uppercase tracking-wider whitespace-nowrap block leading-tight">
          {buildSlug(scene)}
        </span>
        {scene.scene_description && (
          <span className="text-admin-sm text-admin-text-muted font-normal uppercase tracking-wider whitespace-nowrap block leading-tight">
            {scene.scene_description}
          </span>
        )}
      </div>
      {/* Beat grid */}
      {beatNavItems.length >= 2 && (
        <div className="self-stretch border-l border-admin-border-subtle grid grid-rows-2 grid-flow-col auto-cols-[22px] gap-px bg-admin-border-subtle flex-shrink-0">
          {beatNavItems.map(beat => (
            <button
              key={beat.beatId}
              type="button"
              onClick={beat.onClick}
              className={`flex items-center justify-center font-bebas text-admin-sm leading-none transition-colors ${
                beat.isActive
                  ? 'bg-admin-beat-selected-bg text-admin-beat-selected-text'
                  : 'bg-admin-bg-sidebar text-admin-text-faint hover:bg-admin-beat-hover-bg hover:text-admin-text-muted'
              }`}
            >
              {beat.label}
            </button>
          ))}
          {beatNavItems.length % 2 !== 0 && (
            <span aria-hidden="true" className="bg-admin-bg-sidebar" />
          )}
        </div>
      )}
    </div>
  );
}
