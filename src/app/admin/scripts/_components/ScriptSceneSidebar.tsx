'use client';

import { useState, useId } from 'react';
import { Plus, GripVertical, Trash2, Check, X } from 'lucide-react';
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
import type { ComputedScene } from '@/types/scripts';
import type { ScratchScene } from './ScriptScratchPad';

interface Props {
  scenes: ComputedScene[];
  activeSceneId: string | null;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
  onReorderScenes: (orderedIds: string[]) => void;
  onDeleteScene: (id: string) => void;
  scratchpadMode?: boolean;
  scratchScenes?: ScratchScene[];
  onScrollToScene?: (label: string, sceneIndex: number) => void;
}

export function ScriptSceneSidebar({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onReorderScenes,
  onDeleteScene,
  scratchpadMode,
  scratchScenes,
  onScrollToScene,
}: Props) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = scenes.findIndex(s => s.id === active.id);
    const newIndex = scenes.findIndex(s => s.id === over.id);
    const reordered = arrayMove(scenes.map(s => s.id), oldIndex, newIndex);
    onReorderScenes(reordered);
  };

  // Scratchpad mode — read-only auto-detected scene list
  if (scratchpadMode && scratchScenes) {
    return (
      <div className="bg-admin-bg-sidebar flex flex-col h-full">
        <div className="flex-1 overflow-y-auto admin-scrollbar">
          {scratchScenes.map((scene, i) => (
            <button
              key={`${scene.sceneIndex}-${i}`}
              onClick={() => onScrollToScene?.(scene.label, scene.sceneIndex)}
              className="w-full text-left group flex items-center gap-1 px-3 py-2.5 border-b border-admin-border-subtle text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary transition-colors"
            >
              <div className="flex-shrink-0 font-mono text-sm font-bold text-admin-text-ghost w-5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0 text-xs uppercase tracking-wide break-words">
                {scene.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-admin-bg-sidebar flex flex-col h-full">
      <div className="flex-1 overflow-y-auto admin-scrollbar">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {scenes.map(scene => (
              <SortableSceneItem
                key={scene.id}
                scene={scene}
                isActive={scene.id === activeSceneId}
                onSelect={() => onSelectScene(scene.id)}
                onDelete={() => onDeleteScene(scene.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* New Scene — secondary button matching snippets sidebar pattern */}
      <div className="flex-shrink-0 border-t border-admin-border px-3 py-3.5 flex items-center">
        <button
          onClick={onAddScene}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors"
        >
          <Plus size={12} />
          New Scene
        </button>
      </div>
    </div>
  );
}

function SortableSceneItem({
  scene,
  isActive,
  onSelect,
  onDelete,
}: {
  scene: ComputedScene;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
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
      className={`group flex items-center gap-1 px-2 py-3 border-b border-admin-border-subtle cursor-grab transition-colors ${
        isActive
          ? 'bg-admin-bg-active text-admin-text-primary'
          : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
      }`}
      onClick={onSelect}
    >
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
        <GripVertical size={12} className="text-admin-text-ghost" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-bold">{scene.sceneNumber}</span>
        </div>
        <div className="text-xs truncate uppercase tracking-wide mt-0.5 opacity-70">
          {scene.int_ext}. {scene.location_name || '—'}
        </div>
        {scene.time_of_day && (
          <div className="text-xs text-admin-text-ghost">{scene.time_of_day}</div>
        )}
      </div>

      {confirmDelete ? (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-admin-danger hover:text-red-300 p-1 transition-colors"
            title="Confirm delete"
          >
            <Check size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
            className="text-admin-text-faint hover:text-admin-text-primary p-1 transition-colors"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          className="opacity-0 group-hover:opacity-100 text-admin-text-ghost hover:text-admin-danger p-1 transition-all"
          title="Delete scene"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
