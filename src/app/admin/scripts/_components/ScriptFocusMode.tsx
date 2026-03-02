'use client';

import { useState, useCallback, useEffect, useId, useRef } from 'react';
import { ArrowLeft, Users, Hash, MapPin, Settings, CopyPlus, Save, Loader2, ChevronRight, ChevronDown, MoreVertical, Paintbrush, Sparkles, X } from 'lucide-react';
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
import { ScriptColumnToggle } from './ScriptColumnToggle';
import { ScriptSceneHeader } from './ScriptSceneHeader';
import { ScriptBeatRow } from './ScriptBeatRow';
import { getGridTemplateFromFractions, getVisibleColumns, getVisibleColumnKeys } from './gridUtils';
import { useColumnResize } from './useColumnResize';
import { buildRichPrompt } from './storyboardUtils';
import type { ComputedScene, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptColumnConfig, ScriptBeatReferenceRow, ScriptSceneRow, ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, CharacterCastWithContact } from '@/types/scripts';

const VERSION_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
function versionColor(v: number): string { return VERSION_COLORS[(v - 1) % VERSION_COLORS.length]; }

interface Props {
  scenes: ComputedScene[];
  columnConfig: ScriptColumnConfig;
  onColumnConfigChange: (config: ScriptColumnConfig) => void;
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
  onUpdateBeat: (beatId: string, field: string, value: string) => void;
  onDeleteBeat: (beatId: string) => void;
  onAddBeat: (sceneId: string) => void;
  onAddScene: () => void;
  onReorderBeats: (sceneId: string, orderedIds: string[]) => void;
  onUploadReference: (beatId: string, files: FileList) => void;
  onDeleteReference: (refId: string) => void;
  onUpdateScene: (sceneId: string, data: Partial<ScriptSceneRow>) => void;
  onDeleteScene: (sceneId: string) => void;
  onShowCharacters: () => void;
  onShowTags: () => void;
  onShowLocations: () => void;
  onShowStyle: () => void;
  onShowSettings: () => void;
  onNewVersion: () => void;
  onSave: () => void;
  saving?: boolean;
  versioning?: boolean;
  scriptVersion: number;
  scriptStatus: string;
  exiting?: boolean;
  onExit: () => void;
  castMap?: Record<string, CharacterCastWithContact[]>;
}

export function ScriptFocusMode({
  scenes,
  columnConfig,
  onColumnConfigChange,
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
  onUpdateBeat,
  onDeleteBeat,
  onAddBeat,
  onAddScene,
  onReorderBeats,
  onUploadReference,
  onDeleteReference,
  onUpdateScene,
  onDeleteScene,
  onShowCharacters,
  onShowTags,
  onShowLocations,
  onShowStyle,
  onShowSettings,
  onNewVersion,
  onSave,
  saving,
  versioning,
  scriptVersion,
  scriptStatus,
  exiting,
  onExit,
  castMap,
}: Props) {
  const [entered, setEntered] = useState(false);
  const [iconsEntered, setIconsEntered] = useState(false);
  const [contentEntered, setContentEntered] = useState(false);
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(new Set());
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dndId = useId();

  const toggleCollapse = useCallback((sceneId: string) => {
    setCollapsedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);

  // Entrance animation — bar first, icons stagger in, script content follows
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    const iconsTimer = setTimeout(() => setIconsEntered(true), 300);
    const contentTimer = setTimeout(() => setContentEntered(true), 450);
    return () => { clearTimeout(iconsTimer); clearTimeout(contentTimer); };
  }, []);

  // Escape to exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onExit]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  // Measure column header height dynamically for scene header sticky offset
  const colHeaderRef = useRef<HTMLDivElement>(null);
  const [colHeaderHeight, setColHeaderHeight] = useState(28);
  useEffect(() => {
    if (colHeaderRef.current) {
      setColHeaderHeight(colHeaderRef.current.offsetHeight);
    }
  }, [columnConfig]);

  // ── Batch storyboard generation ──
  const [generatingScope, setGeneratingScope] = useState<string | null>(null);
  const [generatingBeatIds, setGeneratingBeatIds] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

  const generateForScenes = useCallback(async (targetScenes: ComputedScene[], scope: string) => {
    if (!scriptStyle || generatingScope) return;
    abortRef.current = false;
    setGeneratingScope(scope);
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
          const castRefUrls: string[] = [];
          if (castMap) {
            const pat = /\]\(([0-9a-f-]{36})\)/g;
            const txt = `${beat.audio_content} ${beat.visual_content} ${beat.notes_content}`;
            let r;
            while ((r = pat.exec(txt)) !== null) {
              const f = castMap[r[1]]?.find(c => c.is_featured);
              if (f?.contact.headshot_url) castRefUrls.push(f.contact.headshot_url);
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
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'var(--admin-bg-base)' }}>
      {/* Toolbar — slides down from above */}
      <div className={`flex-shrink-0 z-30 bg-admin-bg-inset border-b border-admin-border transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${entered && !exiting ? 'translate-y-0' : '-translate-y-full'}`}>
        {/* Primary row: back · column dots · hamburger */}
        <div className="h-[3rem] flex items-center justify-between px-4">
          <div className={`transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${iconsEntered && !exiting ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}>
            <button onClick={onExit} className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors" title="Exit focus mode"><ArrowLeft size={16} /></button>
          </div>
          <div className={`transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${iconsEntered && !exiting ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`} style={{ transitionDelay: iconsEntered && !exiting ? '60ms' : '0ms' }}>
            <ScriptColumnToggle config={columnConfig} onChange={onColumnConfigChange} compact />
          </div>
          <div className={`transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${iconsEntered && !exiting ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`} style={{ transitionDelay: iconsEntered && !exiting ? '120ms' : '0ms' }}>
            <button onClick={() => setMenuOpen(o => !o)} className={`p-1.5 rounded transition-colors ${menuOpen ? 'bg-admin-bg-active text-admin-text-primary' : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'}`} title="Menu"><MoreVertical size={16} /></button>
          </div>
        </div>
        {/* Expandable row */}
        <div ref={menuRef} className="overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ maxHeight: menuOpen ? '3rem' : '0px', opacity: menuOpen ? 1 : 0 }}>
          <div className="h-[3rem] flex items-center justify-between px-4 border-t border-admin-border-subtle">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border" style={{ borderColor: versionColor(scriptVersion) + '40', backgroundColor: versionColor(scriptVersion) + '15', color: versionColor(scriptVersion) }}>v{String(scriptVersion).padStart(2, '0')}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize border ${scriptStatus === 'locked' ? 'border-admin-success-border bg-admin-success-bg text-admin-success' : scriptStatus === 'review' ? 'border-admin-info-border bg-admin-info-bg text-admin-info' : 'border-admin-border bg-admin-bg-active text-admin-text-secondary'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${scriptStatus === 'locked' ? 'bg-admin-success' : scriptStatus === 'review' ? 'bg-admin-info' : 'bg-admin-text-faint'}`} />{scriptStatus}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { onShowCharacters(); setMenuOpen(false); }} className="text-admin-text-muted hover:text-admin-text-primary p-1.5 sm:px-2.5 sm:py-1.5 rounded hover:bg-admin-bg-hover transition-colors flex items-center gap-1.5 text-xs" title="Characters"><Users size={14} /><span className="hidden sm:inline">Characters</span></button>
              <button onClick={() => { onShowLocations(); setMenuOpen(false); }} className="text-admin-text-muted hover:text-admin-text-primary p-1.5 sm:px-2.5 sm:py-1.5 rounded hover:bg-admin-bg-hover transition-colors flex items-center gap-1.5 text-xs" title="Locations"><MapPin size={14} /><span className="hidden sm:inline">Locations</span></button>
              <button onClick={() => { onShowTags(); setMenuOpen(false); }} className="text-admin-text-muted hover:text-admin-text-primary p-1.5 sm:px-2.5 sm:py-1.5 rounded hover:bg-admin-bg-hover transition-colors flex items-center gap-1.5 text-xs" title="Tags"><Hash size={14} /><span className="hidden sm:inline">Tags</span></button>
              <button onClick={() => { onShowStyle(); setMenuOpen(false); }} className="text-admin-text-muted hover:text-admin-text-primary p-1.5 sm:px-2.5 sm:py-1.5 rounded hover:bg-admin-bg-hover transition-colors flex items-center gap-1.5 text-xs" title="Style"><Paintbrush size={14} /><span className="hidden sm:inline">Style</span></button>
              <button onClick={() => { onShowSettings(); setMenuOpen(false); }} className="text-admin-text-muted hover:text-admin-text-primary p-1.5 sm:px-2.5 sm:py-1.5 rounded hover:bg-admin-bg-hover transition-colors flex items-center gap-1.5 text-xs" title="Settings"><Settings size={14} /><span className="hidden sm:inline">Settings</span></button>
              <button onClick={() => { onNewVersion(); setMenuOpen(false); }} disabled={versioning} className="p-1.5 sm:px-2.5 sm:py-1.5 rounded border transition-colors hover:bg-admin-bg-hover flex items-center gap-1.5 text-xs" style={{ borderColor: versionColor(scriptVersion) + '40', color: versionColor(scriptVersion) }} title="New Version">{versioning ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} />}<span className="hidden sm:inline">Version</span></button>
              <button onClick={() => { onSave(); setMenuOpen(false); }} disabled={saving} className="bg-white text-black p-1.5 sm:px-2.5 sm:py-1.5 rounded hover:bg-admin-bg-base hover:text-white hover:ring-1 hover:ring-white transition-all flex items-center gap-1.5 text-xs" title="Save">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}<span className="hidden sm:inline">Save</span></button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content — sticky headers, staggered fade+shift */}
      <div className={`relative flex-1 overflow-y-auto transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${contentEntered && !exiting ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`} style={{ scrollbarWidth: 'none' }}>
        <div className="relative max-w-7xl mx-auto px-8">
          {/* Persistent left/right border — at gutter left edge + content right edge, above everything */}
          <div
            className="absolute top-0 bottom-0 z-[48] pointer-events-none border-l border-r border-admin-border"
            style={{ left: '2rem', right: '2rem', maskImage: 'linear-gradient(to bottom, black calc(100% - 12rem), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 12rem), transparent 100%)' }}
          />

          {/* Column headers — sticky at top */}
          <div ref={colHeaderRef} className="sticky top-0 z-[45] bg-admin-bg-base">
            <div
              ref={headerGridRef}
              className="grid ml-10"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {visibleColumns.map((col, idx) => (
                <div
                  key={col.key}
                  className={`group/colhdr relative px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${col.color} opacity-60 min-w-0 overflow-hidden border-l ${col.borderColor}`}
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

          {/* Scenes + beats */}
          {scenes.map((scene, sceneIdx) => {
            const isCollapsed = collapsedScenes.has(scene.id);
            const isEditing = editingSceneId === scene.id;
            const prevCollapsed = sceneIdx > 0 && collapsedScenes.has(scenes[sceneIdx - 1].id);
            const needsTopBorder = sceneIdx === 0 || !prevCollapsed;
            return (
              <div key={scene.id}>
                {/* Scene heading — click to collapse/expand, sticky below column headers */}
                <div
                  className={`sticky z-20 flex items-center bg-admin-bg-raised border-b border-admin-border cursor-pointer${needsTopBorder ? ' border-t' : ''}`}
                  style={{ top: colHeaderHeight }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditing) toggleCollapse(scene.id);
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

                {/* Beats — collapsible */}
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
          })}

          {/* Bottom padding */}
          <div className="h-48" />
        </div>
      </div>
    </div>
  );
}
