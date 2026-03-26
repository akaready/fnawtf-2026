'use client';

import { useState, useId } from 'react';
import { Plus, MapPin, FileText } from 'lucide-react';
import { SceneListItem } from './SceneListItem';
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
  activeBeatId?: string | null;
  onSelectBeat?: (beatId: string) => void;
}

export function ScriptSceneSidebar({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onReorderScenes,
  onDeleteScene: _onDeleteScene,
  scratchpadMode,
  scratchScenes,
  onScrollToScene,
  activeBeatId,
  onSelectBeat,
}: Props) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [showSlug, setShowSlug] = useState(true);
  const [showDesc, setShowDesc] = useState(true);

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
        <div className="flex-1 overflow-y-auto admin-scrollbar flex flex-col">
          {scratchScenes.length === 0 ? (
            <p className="text-xs text-admin-text-faint text-center pt-8 px-3">
              No scenes yet.<br /><br />Use ALL CAPS to create a new scene.
            </p>
          ) : (
            scratchScenes.map((scene, i) => (
              <SceneListItem
                key={`${scene.sceneIndex}-${i}`}
                sceneNumber={i + 1}
                slug={scene.label}
                description={scene.description}
                onClick={() => onScrollToScene?.(scene.label, scene.sceneIndex)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-admin-bg-sidebar flex flex-col h-full">
      <div className="flex-1 overflow-y-auto admin-scrollbar flex flex-col">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {scenes.map(scene => (
              <SortableSceneItem
                key={scene.id}
                scene={scene}
                isActive={scene.id === activeSceneId}
                onSelect={() => onSelectScene(scene.id)}
                showSlug={showSlug}
                showDesc={showDesc}
                activeBeatId={activeBeatId}
                onSelectBeat={onSelectBeat}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Visibility toggles */}
      <div className="flex-shrink-0 border-t border-admin-border px-3 py-2 flex items-center gap-1">
        <button
          onClick={() => setShowSlug(p => !p)}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${showSlug ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-ghost hover:text-admin-text-muted'}`}
          title={showSlug ? 'Hide slugs' : 'Show slugs'}
        >
          <MapPin size={14} />
        </button>
        <button
          onClick={() => setShowDesc(p => !p)}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${showDesc ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-ghost hover:text-admin-text-muted'}`}
          title={showDesc ? 'Hide descriptions' : 'Show descriptions'}
        >
          <FileText size={14} />
        </button>
      </div>
      {/* New Scene */}
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
  showSlug,
  showDesc,
  activeBeatId,
  onSelectBeat,
}: {
  scene: ComputedScene;
  isActive: boolean;
  onSelect: () => void;
  showSlug: boolean;
  showDesc: boolean;
  activeBeatId?: string | null;
  onSelectBeat?: (beatId: string) => void;
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

  const slug = showSlug
    ? `${scene.int_ext}. ${scene.location_name || '—'}${scene.time_of_day ? ` — ${scene.time_of_day}` : ''}`
    : undefined;

  const beats = scene.beats.length >= 2
    ? [...scene.beats]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((beat, i) => ({
          beatId: beat.id,
          label: String.fromCharCode(65 + i),
          isActive: beat.id === activeBeatId,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectBeat?.(beat.id);
          },
        }))
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab"
    >
      <SceneListItem
        sceneNumber={scene.sceneNumber}
        slug={slug}
        description={showDesc ? scene.scene_description : undefined}
        isActive={isActive}
        onClick={onSelect}
        beats={beats}
      />
    </div>
  );
}
