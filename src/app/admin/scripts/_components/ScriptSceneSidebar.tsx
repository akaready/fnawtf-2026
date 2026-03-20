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
          {scratchScenes.map((scene, i) => (
            <SceneListItem
              key={`${scene.sceneIndex}-${i}`}
              sceneNumber={i + 1}
              slug={scene.label}
              description={scene.description}
              onClick={() => onScrollToScene?.(scene.label, scene.sceneIndex)}
            />
          ))}
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
                showNumber={true}
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
  showNumber: _showNumber,
  showSlug,
  showDesc,
  activeBeatId,
  onSelectBeat,
}: {
  scene: ComputedScene;
  isActive: boolean;
  onSelect: () => void;
  showNumber: boolean;
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

  // Beat nav derivation
  const beatNavItems = scene.beats.length >= 2
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
    : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex items-stretch min-h-[45px] overflow-hidden border-b border-admin-border-subtle cursor-grab transition-colors ${
        isActive
          ? 'bg-black/40 text-admin-text-primary'
          : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
      }`}
      onClick={onSelect}
    >
      <span className="w-[68px] flex-shrink-0 font-bebas text-[56px] leading-none text-right pr-2 translate-y-[6px] text-admin-border flex items-center justify-end">
        {scene.sceneNumber}
      </span>
      <div className="flex-1 min-w-0 pr-3 flex flex-col justify-center py-2">
        {showSlug && (
          <span className="text-admin-sm font-medium text-admin-text-faint uppercase tracking-wider truncate block leading-tight">
            {scene.int_ext}. {scene.location_name || '—'}{scene.time_of_day ? ` — ${scene.time_of_day}` : ''}
          </span>
        )}
        {showDesc && scene.scene_description && (
          <span className="text-admin-sm text-admin-text-muted font-normal uppercase tracking-wider truncate block leading-tight">
            {scene.scene_description}
          </span>
        )}
      </div>
      {/* Beat grid — will not render in scratchpad (beats.length always < 2) */}
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
