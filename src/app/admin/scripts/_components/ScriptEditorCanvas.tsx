'use client';

import { useRef, useEffect, useState, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronDown, Sparkles, X, Trash2, Check, GripVertical, Download, Info } from 'lucide-react';
import { downloadStoryboardZip, buildFullZipName, buildStoryboardFilename } from '@/lib/scripts/downloadStoryboards';
import { deleteAllStoryboardFrames } from '@/app/admin/actions';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptSceneHeader } from './ScriptSceneHeader';
import { ScriptBeatRow } from './ScriptBeatRow';
import { getOrderedGridTemplateFromFractions, getOrderedVisibleColumns, getOrderedVisibleColumnKeys, DEFAULT_COLUMN_ORDER } from './gridUtils';
import { useColumnResize } from './useColumnResize';
import { buildRichPrompt } from './storyboardUtils';
import type { ComputedScene, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptColumnConfig, ScriptSceneRow, ScriptBeatReferenceRow, ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, CharacterCastWithContact, CharacterReferenceRow, LocationReferenceRow, ScriptProductRow, ScriptShareRow, ScriptShareCommentRow, StoryboardSlotFrame } from '@/types/scripts';
import type { LightboxSlide } from './StoryboardLightbox';
import { ScriptCommentsVersionPicker } from './ScriptCommentsVersionPicker';

interface Props {
  scenes: ComputedScene[];
  columnConfig: ScriptColumnConfig;
  columnOrder?: string[];
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
  scriptGroupId: string;
  onFrameGenerated: (frame: ScriptStoryboardFrameRow | null, beatId?: string) => void;
  onFramesBatchChange?: (frames: ScriptStoryboardFrameRow[], beatId: string) => void;
  activeSceneId: string | null;
  activeBeatId?: string | null;
  onUpdateScene: (sceneId: string, data: Partial<ScriptSceneRow>) => void;
  onAddScene: () => void;
  onAddBeat: (sceneId: string) => void;
  onUpdateBeat: (beatId: string, field: string, value: string) => void;
  onDeleteBeat: (beatId: string) => void;
  onDeleteBeatsBatch?: (beatIds: Set<string>) => void;
  onReorderBeats: (sceneId: string, orderedIds: string[]) => void;
  onDeleteScene: (sceneId: string) => void;
  onSelectScene: (sceneId: string) => void;
  onUploadReference: (beatId: string, files: FileList) => void;
  onDeleteReference: (refId: string) => void;
  castMap?: Record<string, CharacterCastWithContact[]>;
  referenceMap?: Record<string, CharacterReferenceRow[]>;
  locationReferenceMap?: Record<string, LocationReferenceRow[]>;
  products?: ScriptProductRow[];
  toolbarPortalRef?: React.RefObject<HTMLDivElement | null>;
  onReorderScenes?: (orderedIds: string[]) => void;
  scriptTitle: string;
  scriptVersion: number;
  onAllFramesDeleted?: () => void;
  onImageMove?: (dragData: import('@/types/scripts').ImageDragData, dropData: import('@/types/scripts').ImageDropData) => void;
  groupShares: ScriptShareRow[];
  selectedShareId: string | null;
  onSelectShare: (shareId: string) => void;
  commentsMap: Map<string, ScriptShareCommentRow[]>;
  commentsLoading?: boolean;
  onRefreshComments?: () => void;
  getCellLock?: (beatId: string, field: string) => { email: string } | null;
  onCellFocus?: (beatId: string, field: string) => void;
  onCellBlur?: (beatId: string, field: string) => void;
  onBatchComplete?: (success: number, failed: number) => void;
}

export function ScriptEditorCanvas({
  scenes,
  columnConfig,
  columnOrder,
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
  scriptGroupId,
  onFrameGenerated,
  onFramesBatchChange,
  activeSceneId,
  activeBeatId,
  onUpdateScene,
  onAddScene,
  onAddBeat,
  onUpdateBeat,
  onDeleteBeat,
  onDeleteBeatsBatch,
  onReorderBeats,
  onDeleteScene,
  onSelectScene,
  onUploadReference,
  onDeleteReference,
  castMap,
  referenceMap,
  locationReferenceMap,
  products = [],
  toolbarPortalRef,
  onReorderScenes,
  scriptTitle,
  scriptVersion,
  onAllFramesDeleted,
  onImageMove,
  groupShares,
  selectedShareId,
  onSelectShare,
  commentsMap,
  commentsLoading,
  onRefreshComments,
  getCellLock,
  onCellFocus,
  onCellBlur,
  onBatchComplete,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dndId = useId();
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(new Set());
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [selectedBeatIds, setSelectedBeatIds] = useState<Set<string>>(new Set());
  const lastSelectedBeatId = useRef<string | null>(null);
  const skipScrollRef = useRef(false);
  const selectionModeRef = useRef(false);
  const [showVisualTips, setShowVisualTips] = useState(false);
  const visualTipsRef = useRef<HTMLDivElement>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

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

  // Close visual tips popover on outside click
  useEffect(() => {
    if (!showVisualTips) return;
    const handler = (e: MouseEvent) => {
      if (visualTipsRef.current && !visualTipsRef.current.contains(e.target as Node)) {
        setShowVisualTips(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showVisualTips]);

  // Scroll to active scene when it changes — only from sidebar navigation
  useEffect(() => {
    if (!activeSceneId || !scrollRef.current) return;
    // Skip scroll when scene was selected from within the canvas (collapse toggle, etc.)
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    // Ensure scene is uncollapsed so beats are visible
    setCollapsedScenes(prev => {
      if (!prev.has(activeSceneId)) return prev;
      const next = new Set(prev);
      next.delete(activeSceneId);
      return next;
    });
    // Defer scroll to next frame so uncollapse renders first
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      const colH = colHeaderRef.current?.offsetHeight ?? 0;
      // Find the scene header — then get its outer scene wrapper (parent of sticky header + beats)
      const sceneEl = document.getElementById(`scene-${activeSceneId}`);
      if (!sceneEl) return;
      // Walk up to the outer scene wrapper div (direct child of the scrollable container)
      let outerWrapper = sceneEl.parentElement;
      while (outerWrapper && outerWrapper.parentElement !== container) {
        outerWrapper = outerWrapper.parentElement;
      }
      if (!outerWrapper) return;
      const elTop = outerWrapper.getBoundingClientRect().top;
      const containerTop = container.getBoundingClientRect().top;
      const scrollTarget = container.scrollTop + (elTop - containerTop) - colH;
      container.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
    });
  }, [activeSceneId]);

  // Scroll to active beat when selected from sidebar
  useEffect(() => {
    if (!activeBeatId || !scrollRef.current) return;
    const container = scrollRef.current;
    const colH = colHeaderRef.current?.offsetHeight ?? 0;
    // Uncollapse the scene containing this beat
    const sceneForBeat = scenes.find(s => s.beats.some(b => b.id === activeBeatId));
    if (sceneForBeat) {
      setCollapsedScenes(prev => {
        if (!prev.has(sceneForBeat.id)) return prev;
        const next = new Set(prev);
        next.delete(sceneForBeat.id);
        return next;
      });
    }
    requestAnimationFrame(() => {
      const beatEl = container.querySelector(`[data-beat-id="${activeBeatId}"]`) as HTMLElement | null;
      if (!beatEl) return;
      const elTop = beatEl.getBoundingClientRect().top;
      const containerTop = container.getBoundingClientRect().top;
      const scrollTarget = container.scrollTop + (elTop - containerTop) - colH;
      container.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
    });
  }, [activeBeatId, scenes]);

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
        setSelectionMode(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedBeatIds, onDeleteBeat]);

  // Click on canvas background clears selection, exits selection mode,
  // and snaps back if user clicked into dead space below content
  const handleCanvasClick = useCallback(() => {
    setSelectedBeatIds(new Set());
    setSelectionMode(false);

    if (!scrollRef.current) return;
    const container = scrollRef.current;
    // Find the last actual scene wrapper (direct child, not the spacer)
    const children = Array.from(container.children);
    // Last scene wrapper is the one before the bottom spacer div
    const spacer = children[children.length - 1];
    const lastContent = children[children.length - 2]; // scenes wrapper or empty state
    if (!lastContent || !spacer) return;
    const lastContentBottom = lastContent.getBoundingClientRect().bottom;
    const containerTop = container.getBoundingClientRect().top;
    const colH = colHeaderRef.current?.offsetHeight ?? 0;
    const visibleTop = containerTop + colH;
    // If the bottom of all content is above the midpoint of the visible area, snap back
    const visibleHeight = container.clientHeight - colH;
    if (lastContentBottom < visibleTop + visibleHeight * 0.4) {
      // Scroll so the last content's bottom sits near the bottom of the visible area
      const targetScroll = container.scrollTop - (visibleTop + visibleHeight * 0.8 - lastContentBottom);
      container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
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
      } else if (metaKey || selectionModeRef.current) {
        // Toggle individual — always toggle in selection mode (checkboxes)
        if (next.has(beatId)) next.delete(beatId);
        else next.add(beatId);
      } else {
        // Single select (outside selection mode)
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
    // In selection mode, checkboxes handle selection via onClick — skip drag-select
    if (selectionModeRef.current) return;
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

  const handleSceneDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderScenes) return;
    const oldIndex = scenes.findIndex(s => s.id === active.id);
    const newIndex = scenes.findIndex(s => s.id === over.id);
    const reordered = arrayMove(scenes.map(s => s.id), oldIndex, newIndex);
    onReorderScenes(reordered);
  }, [scenes, onReorderScenes]);

  const sceneDndId = useId();
  const sceneSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const order = columnOrder ?? DEFAULT_COLUMN_ORDER;
  const visibleColumns = getOrderedVisibleColumns(columnConfig, order);
  const visibleKeys = getOrderedVisibleColumnKeys(columnConfig, order);
  const gridTemplate = getOrderedGridTemplateFromFractions(columnConfig, columnFractions, order);

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateForScenes = useCallback(async (targetScenes: ComputedScene[], scope: string) => {
    if (!scriptStyle || generatingScope) return;

    // Fresh controller for this batch — abort() cancels the current in-flight request immediately
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setGeneratingScope(scope);

    // Collect all beat IDs that need generation — skip beats that already have an active slotted frame
    const queuedIds = new Set<string>();
    for (const scene of targetScenes) {
      for (const beat of scene.beats) {
        if (!storyboardFrames.some(f => f.beat_id === beat.id && f.is_active && f.slot !== null)) {
          queuedIds.add(beat.id);
        }
      }
    }
    setGeneratingBeatIds(queuedIds);

    // Local accumulator so each beat sees frames generated earlier in THIS batch run
    // (React state won't update mid-loop — this ref is the source of truth for consistency URLs)
    const batchFramesByBeatId = new Map<string, string>(); // beatId → image_url
    let successCount = 0;
    let failCount = 0;

    try {
      for (const scene of targetScenes) {
        for (let i = 0; i < scene.beats.length; i++) {
          if (controller.signal.aborted) break;
          const beat = scene.beats[i];
          if (storyboardFrames.some(f => f.beat_id === beat.id && f.is_active && f.slot !== null)) continue;
          const contentPrompt = buildRichPrompt(beat, i, scene, characters, locations, castMap, referenceMap, tags);
          const beatRefs = references[beat.id] ?? [];

          // Collect location reference URLs if location is in 'references' mode
          const locationRefUrls: string[] = [];
          const loc = locations.find(l => l.id === scene.location_id);
          if (loc?.location_mode === 'references' && scene.location_id) {
            (locationReferenceMap?.[scene.location_id] ?? []).slice(0, 2)
              .forEach((r: LocationReferenceRow) => locationRefUrls.push(r.image_url));
          }

          // Collect visual reference URLs + labels for mentioned characters (respects cast_mode)
          const castRefUrls: string[] = [];
          const castRefLabels: string[] = [];
          if (castMap || referenceMap) {
            const mentionPat = new RegExp('\\]\\(([0-9a-f-]{36})\\)', 'g');
            const beatText = `${beat.audio_content} ${beat.visual_content} ${beat.notes_content}`;
            let found;
            while ((found = mentionPat.exec(beatText)) !== null) {
              const charId = found[1];
              const char = characters.find(c => c.id === charId);
              if (char?.cast_mode === 'references') {
                const refs = (referenceMap?.[charId] ?? []).slice(0, 2);
                for (const r of refs) { castRefUrls.push(r.image_url); castRefLabels.push(char.name); }
              } else {
                const feat = castMap?.[charId]?.find(c => c.is_featured);
                if (feat?.contact.headshot_url) { castRefUrls.push(feat.contact.headshot_url); castRefLabels.push(char?.name ?? 'Unknown'); }
              }
            }
          }

          // Consistency frames: up to 2 before + up to 2 after current beat (i) in scene order
          const beforeUrls = [
            ...storyboardFrames
              .filter(f => { const bi = scene.beats.findIndex(b => b.id === f.beat_id); return bi >= 0 && bi < i; })
              .map(f => f.image_url),
            ...scene.beats
              .filter((b, bi) => bi < i && batchFramesByBeatId.has(b.id))
              .map(b => batchFramesByBeatId.get(b.id)!),
          ].slice(-2);
          const afterUrls = storyboardFrames
            .filter(f => { const bi = scene.beats.findIndex(b => b.id === f.beat_id); return bi > i; })
            .map(f => f.image_url)
            .slice(0, 2);
          const priorSceneFrameUrls = [...beforeUrls, ...afterUrls];

          try {
            const res = await fetch('/api/admin/storyboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
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
                castReferenceLabels: castRefLabels,
                locationReferenceUrls: locationRefUrls,
                consistencyFrameUrls: priorSceneFrameUrls,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.frame) {
                onFrameGenerated(data.frame, beat.id);
                batchFramesByBeatId.set(beat.id, data.frame.image_url);
                successCount++;
              } else {
                failCount++;
              }
            } else {
              failCount++;
            }
          } catch (err) {
            if (controller.signal.aborted) break;
            failCount++;
            console.error('Batch gen beat failed:', beat.id, err);
          }
          setGeneratingBeatIds(prev => {
            const next = new Set(prev);
            next.delete(beat.id);
            return next;
          });
        }
        if (controller.signal.aborted) break;
      }
    } finally {
      setGeneratingScope(null);
      setGeneratingBeatIds(new Set());
      abortControllerRef.current = null;
      if (successCount > 0 || failCount > 0) onBatchComplete?.(successCount, failCount);
    }
  }, [scriptStyle, styleReferences, scriptId, storyboardFrames, onFrameGenerated, generatingScope, references, characters, locations, castMap, referenceMap, locationReferenceMap, onBatchComplete]);

  const handleGenerateAll = useCallback(() => {
    generateForScenes(scenes, 'all');
  }, [scenes, generateForScenes]);

  const handleDownloadAll = useCallback(() => {
    const frames = storyboardFrames.map(frame => {
      let filename = `${frame.beat_id}.jpg`;
      for (const scene of scenes) {
        const beatIdx = scene.beats.findIndex(b => b.id === frame.beat_id);
        if (beatIdx !== -1) {
          let letter = '';
          let n = beatIdx + 1;
          while (n > 0) { n--; letter = String.fromCharCode(65 + (n % 26)) + letter; n = Math.floor(n / 26); }
          filename = buildStoryboardFilename(scriptTitle, scriptVersion, scene.sceneNumber, letter);
          break;
        }
      }
      return { imageUrl: frame.image_url, filename };
    });
    void downloadStoryboardZip(frames, buildFullZipName(scriptTitle, scriptVersion));
  }, [storyboardFrames, scenes, scriptTitle, scriptVersion]);

  const handleDeleteAll = useCallback(async () => {
    await deleteAllStoryboardFrames(scriptId);
    onAllFramesDeleted?.();
    setConfirmDeleteAll(false);
  }, [scriptId, onAllFramesDeleted]);

  const handleGenerateScene = useCallback((sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    generateForScenes([scene], sceneId);
  }, [scenes, generateForScenes]);

  // Batch delete handler for toolbar portal button
  const handleBatchDelete = useCallback(() => {
    if (selectedBeatIds.size === 0) return;
    if (onDeleteBeatsBatch) {
      void onDeleteBeatsBatch(selectedBeatIds);
    } else {
      for (const id of selectedBeatIds) {
        onDeleteBeat(id);
      }
    }
    setSelectedBeatIds(new Set());
  }, [selectedBeatIds, onDeleteBeat, onDeleteBeatsBatch]);

  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [selectionMode, _setSelectionMode] = useState(false);
  const setSelectionMode = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    _setSelectionMode(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      selectionModeRef.current = next;
      return next;
    });
  }, []);
  const allBeatIds = scenes.flatMap(s => s.beats.map(b => b.id));
  const allSelected = allBeatIds.length > 0 && allBeatIds.every(id => selectedBeatIds.has(id));

  // 3-stage header checkbox: off → reveal checkboxes → select all → off
  const handleSelectAll = useCallback(() => {
    if (!selectionMode) {
      // Stage 1: enter selection mode (checkboxes visible, nothing selected)
      setSelectionMode(true);
    } else if (!allSelected) {
      // Stage 2: select all
      const all = scenes.flatMap(s => s.beats.map(b => b.id));
      setSelectedBeatIds(new Set(all));
    } else {
      // Stage 3: deselect all and exit selection mode
      setSelectedBeatIds(new Set());
      setSelectionMode(false);
    }
  }, [selectionMode, allSelected, scenes]);

  // Double-click gutter: enter selection mode and select that beat
  const handleActivateSelection = useCallback((beatId: string) => {
    setSelectionMode(true);
    setSelectedBeatIds(new Set([beatId]));
    lastSelectedBeatId.current = beatId;
  }, []);

  // Click content cell: exit selection mode
  const handleExitSelection = useCallback(() => {
    setSelectedBeatIds(new Set());
    setSelectionMode(false);
  }, []);

  // Reset confirm state when selection clears
  useEffect(() => {
    if (selectedBeatIds.size === 0) setConfirmBatchDelete(false);
  }, [selectedBeatIds.size]);

  return (
    <>
    {/* Portal: toolbar delete button when beats are selected */}
    {toolbarPortalRef?.current && generatingScope && createPortal(
      <button
        onClick={e => { e.stopPropagation(); abortControllerRef.current?.abort(); }}
        className="btn-ghost-danger w-8 h-8"
        title="Cancel batch generation"
      >
        <X size={14} strokeWidth={2} />
      </button>,
      toolbarPortalRef.current,
    )}
    {toolbarPortalRef?.current && selectedBeatIds.size > 0 && createPortal(
      <div className="relative w-8 h-8 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {confirmBatchDelete ? (
          <div className="absolute right-0 top-0 flex items-center gap-0.5">
            <button
              onClick={e => { e.stopPropagation(); handleBatchDelete(); setConfirmBatchDelete(false); }}
              className="btn-ghost-danger w-8 h-8"
              title="Confirm delete"
            >
              <Check size={14} strokeWidth={2} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmBatchDelete(false); }}
              className="btn-ghost w-8 h-8"
              title="Cancel"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setConfirmBatchDelete(true); }}
            className="btn-ghost-danger w-8 h-8"
            title={`Delete ${selectedBeatIds.size} selected`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>,
      toolbarPortalRef.current,
    )}
    <div ref={scrollRef} className="relative flex-1 overflow-y-auto admin-scrollbar" onClick={handleCanvasClick}>
      {/* Persistent right border — above scene headers */}
      <div className="absolute top-0 bottom-0 right-0 w-px bg-admin-border z-[18] pointer-events-none" style={{ right: 0, left: 'auto' }} />
      {/* Column headers */}
      <div ref={colHeaderRef} className="sticky top-0 z-20 bg-admin-bg-base border-b border-admin-border">
        <div className="flex">
          {/* Select-all checkbox */}
          <div
            className="w-10 flex items-center justify-center flex-shrink-0 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleSelectAll(); }}
          >
            <div
              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                allSelected
                  ? 'bg-white border-white'
                  : 'border-admin-text-ghost hover:border-admin-text-faint'
              }`}
            >
              {allSelected && <Check size={10} className="text-black" strokeWidth={3} />}
            </div>
          </div>
        <div ref={headerGridRef} className="grid flex-1 border-r border-admin-border" style={{ gridTemplateColumns: gridTemplate }}>
          {visibleColumns.map((col, idx) => (
            <div
              key={col.key}
              className={`${['storyboard', 'visual'].includes(col.key) ? '@container ' : ''}group/colhdr relative px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${col.color} border-l ${col.borderColor}`}
            >
              {col.key === 'comments' ? (
                <>
                  <span className="opacity-60">{col.label}</span>
                  <ScriptCommentsVersionPicker
                    shares={groupShares}
                    selectedShareId={selectedShareId}
                    currentMajorVersion={scriptVersion}
                    onSelect={onSelectShare}
                  />
                </>
              ) : (
                <span className={`opacity-60 ${['storyboard', 'visual'].includes(col.key) ? 'hidden @[140px]:inline' : 'block truncate'}`}>{col.label}</span>
              )}
              <div className="hidden @[50px]:block">
              {col.key === 'visual' && (
                <div ref={visualTipsRef} className="contents">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowVisualTips(v => !v); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity p-1"
                    title="Visual content best practices"
                  >
                    <Info size={14} />
                  </button>
                  {showVisualTips && (
                    <div className="absolute top-full right-0 mt-1 z-30 w-80 bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-xl p-3">
                      <p className="text-admin-sm font-semibold text-admin-text-primary mb-2">Visual content tips</p>
                      <ul className="space-y-1.5 text-admin-text-muted text-admin-sm">
                        <li>Describe what the <strong className="text-admin-text-primary">camera sees</strong> — not the audio or dialogue</li>
                        <li>Use <strong className="text-admin-text-primary">framing language:</strong> wide shot, close-up, medium shot</li>
                        <li>Use <strong className="text-admin-text-primary">lighting language:</strong> natural window light, warm evening glow, overhead fluorescent</li>
                        <li>Use <strong className="text-admin-text-primary">spatial anchors:</strong> seated beside, standing at, foreground/background</li>
                        <li>Use <strong className="text-admin-text-primary">action verbs:</strong> reaching for, gesturing toward, looking at</li>
                        <li><strong className="text-admin-text-primary">Interview scenes:</strong> show the person being interviewed on camera. Only describe B-roll if you want B-roll instead.</li>
                        <li><strong className="text-admin-text-primary">Avoid numbers/stats</strong> — describe the concept visually instead</li>
                        <li><strong className="text-admin-text-primary">Avoid text on screens</strong> or whiteboards — describe the visual metaphor</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              </div>
              <div className="hidden @[75px]:block">
              {col.key === 'storyboard' && scriptStyle && (
                generatingScope ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); abortControllerRef.current?.abort(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-admin-danger"
                    title="Cancel generation"
                  >
                    <X size={14} />
                  </button>
                ) : confirmDeleteAll ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); void handleDeleteAll(); }}
                      className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-admin-danger"
                      title="Confirm — delete all storyboards"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteAll(false); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    {storyboardFrames.length > 0 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteAll(true); }}
                          className="absolute right-[3.5rem] top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity p-1"
                          title="Delete all storyboards"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadAll(); }}
                          className="absolute right-8 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity p-1"
                          title="Download all storyboards"
                        >
                          <Download size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGenerateAll(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity p-1"
                      title="Generate all storyboards"
                    >
                      <Sparkles size={14} />
                    </button>
                  </>
                )
              )}
              </div>
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
        </div>{/* /flex */}
      </div>

      {/* Scenes */}
      {scenes.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-admin-text-faint text-sm">
          No scenes yet. Add one to start writing.
        </div>
      ) : (
        <DndContext id={sceneDndId} sensors={sceneSensors} collisionDetection={closestCenter} onDragEnd={handleSceneDragEnd}>
          <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {(() => {
          // Build all-script lightbox slides — one per beat with layout + frames
          const allScriptSlides: LightboxSlide[] = [];
          for (const s of scenes) {
            for (let beatIdx = 0; beatIdx < s.beats.length; beatIdx++) {
              const beat = s.beats[beatIdx];
              const beatFrames = (storyboardFrames
                .filter(f => f.beat_id === beat.id && f.slot !== null) as StoryboardSlotFrame[])
                .sort((a, b) => a.slot - b.slot);
              if (beatFrames.length === 0) continue;
              let letter = '';
              let n = beatIdx + 1;
              while (n > 0) { n--; letter = String.fromCharCode(65 + (n % 26)) + letter; n = Math.floor(n / 26); }
              allScriptSlides.push({
                label: `Scene ${s.sceneNumber} — Beat ${letter}`,
                filename: buildStoryboardFilename(scriptTitle, scriptVersion, s.sceneNumber, letter),
                layout: beat.storyboard_layout ?? null,
                frames: beatFrames,
                beatId: beat.id,
              });
            }
          }
          return scenes.map((scene, sceneIdx) => {
          const isCollapsed = collapsedScenes.has(scene.id);
          const isEditing = editingSceneId === scene.id;
          return (
            <SortableSceneItem key={scene.id} sceneId={scene.id}>
            {(sceneDragListeners) => (
            <div
              onClick={(e) => { e.stopPropagation(); skipScrollRef.current = true; onSelectScene(scene.id); }}
            >
              {/* Scene heading — click to collapse/expand, sticky below column headers */}
              <div
                className={`sticky ${isEditing ? 'z-[20]' : 'z-[15]'} flex items-center bg-admin-bg-raised border-b border-admin-border cursor-pointer ${sceneIdx > 0 ? 'border-t -mt-px' : ''}`}
                style={{ top: colHeaderHeight }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isEditing) {
                    toggleCollapse(scene.id);
                    skipScrollRef.current = true;
                    onSelectScene(scene.id);
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <ScriptSceneHeader
                    scene={scene}
                    scriptGroupId={scriptGroupId}
                    locations={locations}
                    onUpdate={(id, data) => onUpdateScene(id, data)}
                    onDelete={onDeleteScene}
                    editing={isEditing}
                    onEditingChange={(editing) => setEditingSceneId(editing ? scene.id : null)}
                    onGenerate={columnConfig.storyboard && scriptStyle ? () => handleGenerateScene(scene.id) : undefined}
                    generating={generatingScope === scene.id}
                    isGenerating={generatingScope !== null && generatingScope !== scene.id && scene.beats.some(b => generatingBeatIds.has(b.id))}
                    lockedBy={getCellLock?.(scene.id, 'scene')}
                    onSceneFocus={() => onCellFocus?.(scene.id, 'scene')}
                    onSceneBlur={() => onCellBlur?.(scene.id, 'scene')}
                  />
                </div>
                <div className="flex-shrink-0 flex items-center justify-center py-3 px-2 text-admin-text-faint cursor-grab hover:text-white transition-colors" {...sceneDragListeners}>
                  <GripVertical size={12} />
                </div>
                <div className="flex-shrink-0 text-admin-text-faint pl-1 pr-3 hover:text-white transition-colors">
                  {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
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
                    {(() => {
                      // Frames already generated for this scene, sorted by beat order
                      const thisSceneFrames = storyboardFrames
                        .filter(f => scene.beats.some(beat => beat.id === f.beat_id))
                        .sort((fa, fb) => {
                          const ai = scene.beats.findIndex(beat => beat.id === fa.beat_id);
                          const bi = scene.beats.findIndex(beat => beat.id === fb.beat_id);
                          return ai - bi;
                        });
                      const sceneFramesForLightbox = thisSceneFrames.map(f => {
                        const beatIdx = scene.beats.findIndex(b => b.id === f.beat_id);
                        const beat = scene.beats[beatIdx];
                        let letter = '';
                        let n = beatIdx + 1;
                        while (n > 0) { n--; letter = String.fromCharCode(65 + (n % 26)) + letter; n = Math.floor(n / 26); }
                        return {
                          imageUrl: f.image_url,
                          label: `Scene ${scene.sceneNumber} — Beat ${letter}`,
                          filename: buildStoryboardFilename(scriptTitle, scriptVersion, scene.sceneNumber, letter),
                          audioContent: beat?.audio_content ?? '',
                          visualContent: beat?.visual_content ?? '',
                        };
                      });
                      return scene.beats.map((beat, i) => {
                        const beatComments = commentsMap.get(beat.id) ?? [];
                        return (
                      <ScriptBeatRow
                        key={beat.id}
                        beat={beat}
                        columnConfig={columnConfig}
                        columnOrder={order}
                        gridTemplate={gridTemplate}
                        characters={characters}
                        tags={tags}
                        references={references[beat.id] ?? []}
                        storyboardFrames={storyboardFrames.filter(f => f.beat_id === beat.id)}
                        storyboardLayout={beat.storyboard_layout ?? null}
                        scriptStyle={scriptStyle}
                        styleReferences={styleReferences}
                        scriptId={scriptId}
                        sceneId={scene.id}
                        onFramesChange={(updatedFrames) => {
                          if (onFramesBatchChange) {
                            onFramesBatchChange(updatedFrames, beat.id);
                          } else {
                            const latest = updatedFrames[updatedFrames.length - 1] ?? null;
                            onFrameGenerated(latest, beat.id);
                          }
                        }}
                        onLayoutChange={(newLayout) => onUpdateBeat(beat.id, 'storyboard_layout', newLayout)}
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
                        onActivateSelection={handleActivateSelection}
                        onExitSelection={handleExitSelection}
                        selectionActive={selectionMode}
                        batchGenerating={generatingBeatIds.has(beat.id)}
                        onCancelGeneration={() => { abortControllerRef.current?.abort(); }}
                        scene={scene}
                        locations={locations}
                        castMap={castMap}
                        referenceMap={referenceMap}
                        locationReferenceMap={locationReferenceMap}
                        products={products}
                        scriptTitle={scriptTitle}
                        scriptVersion={scriptVersion}
                        sceneFrames={sceneFramesForLightbox}
                        allScriptSlides={allScriptSlides}
                        onImageMove={onImageMove}
                        scenes={scenes}
                        beatComments={beatComments}
                        commentsLoading={commentsLoading}
                        commentShareId={selectedShareId ?? undefined}
                        onRefreshComments={onRefreshComments}
                        getCellLock={getCellLock}
                        onCellFocus={onCellFocus}
                        onCellBlur={onCellBlur}
                      />
                        );
                      });
                    })()}
                  </SortableContext>
                </DndContext>
              )}
            </div>
            )}
            </SortableSceneItem>
          );
        });
        })()}
          </SortableContext>
        </DndContext>
      )}

      {/* Bottom padding — fill 90% of viewport so any scene can scroll to top */}
      <div style={{ height: '95vh' }} />
    </div>
    </>
  );
}

function SortableSceneItem({ sceneId, children }: {
  sceneId: string;
  children: (listeners: ReturnType<typeof useSortable>['listeners']) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sceneId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
}
