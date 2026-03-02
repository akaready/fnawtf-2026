'use client';

import { useRef, useEffect, useState, useCallback, useId } from 'react';
import { ChevronRight, ChevronDown, Sparkles, X } from 'lucide-react';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { ScriptSceneHeader } from './ScriptSceneHeader';
import { ScriptBeatRow } from './ScriptBeatRow';
import { getGridTemplateFromFractions, getVisibleColumns, getVisibleColumnKeys } from './gridUtils';
import { useColumnResize } from './useColumnResize';
import { buildRichPrompt } from './storyboardUtils';
import type { ComputedScene, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptColumnConfig, ScriptSceneRow, ScriptBeatReferenceRow, ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, CharacterCastWithContact } from '@/types/scripts';

interface Props {
  scenes: ComputedScene[];
  columnConfig: ScriptColumnConfig;
  columnFractions: Record<string, number>;
  onColumnFractionsChange: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
  references: Record<string, ScriptBeatReferenceRow[]>;
  storyboardFrames: ScriptStoryboardFrameRow[];
  scriptStyle: ScriptStyleRow | null;
  styleReferences: ScriptStyleReferenceRow[];
  scriptId: string;
  onFrameGenerated: (frame: ScriptStoryboardFrameRow | null, beatId?: string) => void;
  activeSceneId: string | null;
  onUpdateScene: (sceneId: string, data: Partial<ScriptSceneRow>) => void;
  onAddScene: () => void;
  onAddBeat: (sceneId: string) => void;
  onUpdateBeat: (beatId: string, field: string, value: string) => void;
  onDeleteBeat: (beatId: string) => void;
  onReorderBeats: (sceneId: string, orderedIds: string[]) => void;
  onDeleteScene: (sceneId: string) => void;
  onSelectScene: (sceneId: string) => void;
  onUploadReference: (beatId: string, files: FileList) => void;
  onDeleteReference: (refId: string) => void;
  castMap?: Record<string, CharacterCastWithContact[]>;
}

export function ScriptEditorCanvas({
  scenes,
  columnConfig,
  columnFractions,
  onColumnFractionsChange,
  characters,
  tags,
  locations,
  references,
  storyboardFrames,
  scriptStyle,
  styleReferences,
  scriptId,
  onFrameGenerated,
  activeSceneId,
  onUpdateScene,
  onAddScene,
  onAddBeat,
  onUpdateBeat,
  onDeleteBeat,
  onReorderBeats,
  onDeleteScene,
  onSelectScene,
  onUploadReference,
  onDeleteReference,
  castMap,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dndId = useId();
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(new Set());
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [selectedBeatIds, setSelectedBeatIds] = useState<Set<string>>(new Set());
  const lastSelectedBeatId = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const toggleCollapse = (sceneId: string) => {
    setCollapsedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  // Scroll to active scene when it changes
  useEffect(() => {
    if (!activeSceneId || !scrollRef.current) return;
    const el = document.getElementById(`scene-${activeSceneId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSceneId]);

  // Keyboard handler for batch delete, Cmd+Delete instant delete, and deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+Backspace / Cmd+Shift+Delete = instant delete current beat (even while editing)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'Backspace' || e.key === 'Delete')) {
        const active = document.activeElement as HTMLElement | null;
        const beatIdAttr = active?.closest('[data-beat-id]')?.getAttribute('data-beat-id')
          ?? active?.closest('[data-beat-gutter]')?.getAttribute('data-beat-gutter');

        if (selectedBeatIds.size > 0) {
          e.preventDefault();
          for (const id of selectedBeatIds) onDeleteBeat(id);
          setSelectedBeatIds(new Set());
          return;
        }
        if (beatIdAttr) {
          e.preventDefault();
          onDeleteBeat(beatIdAttr);
          return;
        }
      }

      if (selectedBeatIds.size === 0) return;
      // Don't interfere with editing in cells for non-Cmd shortcuts
      const active = document.activeElement;
      if (active?.getAttribute('contenteditable') === 'true' || active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        for (const id of selectedBeatIds) {
          onDeleteBeat(id);
        }
        setSelectedBeatIds(new Set());
      }
      if (e.key === 'Escape') {
        setSelectedBeatIds(new Set());
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedBeatIds, onDeleteBeat]);

  // Click on canvas background clears selection
  const handleCanvasClick = useCallback(() => {
    setSelectedBeatIds(new Set());
  }, []);

  const handleBeatSelect = useCallback((beatId: string, shiftKey: boolean, metaKey: boolean) => {
    setSelectedBeatIds(prev => {
      const next = new Set(prev);
      if (shiftKey && lastSelectedBeatId.current) {
        // Range select
        const allBeatIds = scenes.flatMap(s => s.beats.map(b => b.id));
        const startIdx = allBeatIds.indexOf(lastSelectedBeatId.current);
        const endIdx = allBeatIds.indexOf(beatId);
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        for (let i = from; i <= to; i++) {
          next.add(allBeatIds[i]);
        }
      } else if (metaKey) {
        // Toggle individual
        if (next.has(beatId)) next.delete(beatId);
        else next.add(beatId);
      } else {
        // Single select
        next.clear();
        next.add(beatId);
      }
      lastSelectedBeatId.current = beatId;
      return next;
    });
  }, [scenes]);

  // ── Drag-select across rows ──
  const isDragSelecting = useRef(false);
  const dragStartBeat = useRef<string | null>(null);

  // Use a ref to access latest scenes without re-creating the callback
  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;

  const handleDragSelectStart = useCallback((beatId: string) => {
    isDragSelecting.current = true;
    dragStartBeat.current = beatId;
    setSelectedBeatIds(new Set([beatId]));
    lastSelectedBeatId.current = beatId;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragSelecting.current || !dragStartBeat.current) return;
      // Find the beat gutter element under the cursor
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const gutterEl = (el as HTMLElement).closest('[data-beat-gutter]') as HTMLElement | null;
      if (!gutterEl) return;
      const hoveredBeatId = gutterEl.getAttribute('data-beat-gutter');
      if (!hoveredBeatId) return;

      const allBeatIds = scenesRef.current.flatMap(s => s.beats.map(b => b.id));
      const startIdx = allBeatIds.indexOf(dragStartBeat.current);
      const endIdx = allBeatIds.indexOf(hoveredBeatId);
      if (startIdx === -1 || endIdx === -1) return;
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      setSelectedBeatIds(new Set(allBeatIds.slice(from, to + 1)));
    };

    const handleMouseUp = () => {
      isDragSelecting.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleBeatDragEnd = useCallback((sceneId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    const oldIndex = scene.beats.findIndex(b => b.id === active.id);
    const newIndex = scene.beats.findIndex(b => b.id === over.id);
    const reordered = arrayMove(scene.beats.map(b => b.id), oldIndex, newIndex);
    onReorderBeats(sceneId, reordered);
  }, [scenes, onReorderBeats]);

  const visibleColumns = getVisibleColumns(columnConfig);
  const visibleKeys = getVisibleColumnKeys(columnConfig);
  const gridTemplate = getGridTemplateFromFractions(columnConfig, columnFractions);

  // Column resize
  const headerGridRef = useRef<HTMLDivElement>(null);
  const { handleResize, resetFractions } = useColumnResize(visibleKeys, columnFractions, onColumnFractionsChange, headerGridRef);

  // Column header height for scene header sticky offset
  const colHeaderRef = useRef<HTMLDivElement>(null);
  const [colHeaderHeight, setColHeaderHeight] = useState(28);
  useEffect(() => {
    if (colHeaderRef.current) {
      setColHeaderHeight(colHeaderRef.current.offsetHeight);
    }
  }, [columnConfig]);

  // ── Batch storyboard generation ──
  const [generatingScope, setGeneratingScope] = useState<string | null>(null); // null | 'all' | sceneId
  const [generatingBeatIds, setGeneratingBeatIds] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

  const generateForScenes = useCallback(async (targetScenes: ComputedScene[], scope: string) => {
    if (!scriptStyle || generatingScope) return;
    abortRef.current = false;
    setGeneratingScope(scope);
    // Collect all beat IDs that need generation
    const queuedIds = new Set<string>();
    for (const scene of targetScenes) {
      for (const beat of scene.beats) {
        if (!storyboardFrames.some(f => f.beat_id === beat.id)) {
          queuedIds.add(beat.id);
        }
      }
    }
    setGeneratingBeatIds(queuedIds);
    try {
      for (const scene of targetScenes) {
        for (let i = 0; i < scene.beats.length; i++) {
          if (abortRef.current) break;
          const beat = scene.beats[i];
          if (storyboardFrames.some(f => f.beat_id === beat.id)) continue;
          const contentPrompt = buildRichPrompt(beat, i, scene, characters, locations, castMap);
          const beatRefs = references[beat.id] ?? [];

          // Collect cast headshot URLs for mentioned characters
          const castRefUrls: string[] = [];
          if (castMap) {
            const mentionPat = /\]\(([0-9a-f-]{36})\)/g;
            const beatText = `${beat.audio_content} ${beat.visual_content} ${beat.notes_content}`;
            let found;
            while ((found = mentionPat.exec(beatText)) !== null) {
              const feat = castMap[found[1]]?.find(c => c.is_featured);
              if (feat?.contact.headshot_url) {
                castRefUrls.push(feat.contact.headshot_url);
              }
            }
          }

          try {
            const res = await fetch('/api/admin/storyboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scriptId,
                beatId: beat.id,
                contentPrompt,
                stylePrompt: scriptStyle.prompt,
                stylePreset: scriptStyle.style_preset,
                aspectRatio: scriptStyle.aspect_ratio,
                referenceImageUrls: styleReferences.map(r => r.image_url),
                beatReferenceUrls: beatRefs.map(r => r.image_url),
                castReferenceUrls: castRefUrls,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.frame) onFrameGenerated(data.frame, beat.id);
            }
          } catch { /* continue */ }
          setGeneratingBeatIds(prev => {
            const next = new Set(prev);
            next.delete(beat.id);
            return next;
          });
        }
        if (abortRef.current) break;
      }
    } finally {
      setGeneratingScope(null);
      setGeneratingBeatIds(new Set());
    }
  }, [scriptStyle, styleReferences, scriptId, storyboardFrames, onFrameGenerated, generatingScope, references, characters, locations, castMap]);

  const handleGenerateAll = useCallback(() => {
    generateForScenes(scenes, 'all');
  }, [scenes, generateForScenes]);

  const handleGenerateScene = useCallback((sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    generateForScenes([scene], sceneId);
  }, [scenes, generateForScenes]);

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-y-auto admin-scrollbar" onClick={handleCanvasClick}>
      {/* Persistent right border — above scene headers */}
      <div className="absolute top-0 bottom-0 right-0 w-px bg-admin-border z-[18] pointer-events-none" style={{ right: 0, left: 'auto' }} />
      {/* Column headers */}
      <div ref={colHeaderRef} className="sticky top-0 z-20 bg-admin-bg-base">
        <div ref={headerGridRef} className="grid ml-10 border-r border-admin-border" style={{ gridTemplateColumns: gridTemplate }}>
          {visibleColumns.map((col, idx) => (
            <div
              key={col.key}
              className={`group/colhdr relative px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${col.color} opacity-60 border-l ${col.borderColor}`}
            >
              {col.label}
              {col.key === 'storyboard' && scriptStyle && (
                generatingScope ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); abortRef.current = true; }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-admin-bg-hover text-admin-danger"
                    title="Cancel generation"
                  >
                    <X size={10} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGenerateAll(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/colhdr:opacity-100 transition-opacity p-1 rounded hover:bg-admin-bg-hover"
                    title="Generate all storyboards"
                  >
                    <Sparkles size={10} />
                  </button>
                )
              )}
              {idx < visibleColumns.length - 1 && (
                <span
                  onMouseDown={(e) => handleResize(col.key, e)}
                  onDoubleClick={resetFractions}
                  className="absolute right-0 top-0 bottom-0 w-2 -mr-1 cursor-col-resize z-20 hover:bg-white/10 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scenes */}
      {scenes.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-admin-text-faint text-sm">
          No scenes yet. Add one to start writing.
        </div>
      ) : (
        scenes.map((scene, sceneIdx) => {
          const isCollapsed = collapsedScenes.has(scene.id);
          const isEditing = editingSceneId === scene.id;
          const prevCollapsed = sceneIdx > 0 && collapsedScenes.has(scenes[sceneIdx - 1].id);
          const needsTopBorder = sceneIdx === 0 || !prevCollapsed;
          return (
            <div
              key={scene.id}
              className={activeSceneId === scene.id ? 'ring-1 ring-admin-accent/20' : ''}
              onClick={(e) => { e.stopPropagation(); onSelectScene(scene.id); }}
            >
              {/* Scene heading — click to collapse/expand, sticky below column headers */}
              <div
                className={`sticky ${isEditing ? 'z-[20]' : 'z-[15]'} flex items-center bg-admin-bg-raised border-b border-admin-border cursor-pointer${needsTopBorder ? ' border-t' : ''}`}
                style={{ top: colHeaderHeight }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isEditing) {
                    toggleCollapse(scene.id);
                    onSelectScene(scene.id);
                  }
                }}
              >
                <div className="flex-shrink-0 w-10 flex items-center justify-center py-3 text-admin-text-faint">
                  {isCollapsed
                    ? <ChevronRight size={13} />
                    : <ChevronDown size={13} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <ScriptSceneHeader
                    scene={scene}
                    locations={locations}
                    onUpdate={(id, data) => onUpdateScene(id, data)}
                    onDelete={onDeleteScene}
                    editing={isEditing}
                    onEditingChange={(editing) => setEditingSceneId(editing ? scene.id : null)}
                    onGenerate={columnConfig.storyboard && scriptStyle ? () => handleGenerateScene(scene.id) : undefined}
                    generating={generatingScope === scene.id}
                  />
                </div>
              </div>

              {/* Beats — collapsible, sortable */}
              {!isCollapsed && (
                <DndContext
                  id={`${dndId}-${scene.id}`}
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleBeatDragEnd(scene.id)}
                >
                  <SortableContext
                    items={scene.beats.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {scene.beats.map((beat, i) => (
                      <ScriptBeatRow
                        key={beat.id}
                        beat={beat}
                        columnConfig={columnConfig}
                        gridTemplate={gridTemplate}
                        characters={characters}
                        tags={tags}
                        references={references[beat.id] ?? []}
                        storyboardFrame={storyboardFrames.find(f => f.beat_id === beat.id) ?? null}
                        scriptStyle={scriptStyle}
                        styleReferences={styleReferences}
                        scriptId={scriptId}
                        sceneId={scene.id}
                        onFrameChange={(frame) => onFrameGenerated(frame, beat.id)}
                        onUpdate={onUpdateBeat}
                        onDelete={onDeleteBeat}
                        onAddBeat={() => onAddBeat(scene.id)}
                        onAddScene={onAddScene}
                        onUploadReference={onUploadReference}
                        onDeleteReference={onDeleteReference}
                        isOnly={scene.beats.length <= 1}
                        beatNumber={i + 1}
                        isSelected={selectedBeatIds.has(beat.id)}
                        onSelect={handleBeatSelect}
                        onDragSelectStart={handleDragSelectStart}
                        batchGenerating={generatingBeatIds.has(beat.id)}
                        onCancelGeneration={() => { abortRef.current = true; }}
                        scene={scene}
                        locations={locations}
                        castMap={castMap}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          );
        })
      )}

      {/* Bottom padding */}
      <div className="h-32" />
    </div>
  );
}
