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

interface Props {
  scenes: ComputedScene[];
  activeSceneId: string | null;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
  onReorderScenes: (orderedIds: string[]) => void;
  onDeleteScene: (id: string) => void;
}

export function ScriptSceneSidebar({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onReorderScenes,
  onDeleteScene,
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

  return (
    <div className="bg-admin-bg-sidebar flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-admin-border">
        <span className="text-[10px] uppercase tracking-widest text-admin-text-faint font-semibold">
          Scenes
        </span>
        <button
          onClick={onAddScene}
          className="bg-white text-black p-1 rounded hover:bg-admin-bg-base hover:text-white hover:ring-1 hover:ring-white transition-all"
          title="Add scene"
        >
          <Plus size={14} />
        </button>
      </div>

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
      className={`group flex items-center gap-1 px-2 py-2 border-b border-admin-border-subtle cursor-grab transition-colors ${
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
          <span className="font-mono text-xs font-bold">{scene.sceneNumber}</span>
        </div>
        <div className="text-[10px] truncate uppercase tracking-wide mt-0.5 opacity-70">
          {scene.int_ext}. {scene.location_name || '—'}
        </div>
        {scene.time_of_day && (
          <div className="text-[10px] text-admin-text-ghost">{scene.time_of_day}</div>
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
