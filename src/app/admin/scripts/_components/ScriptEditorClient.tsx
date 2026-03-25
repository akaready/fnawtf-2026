'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Settings, User, Hash, MapPin, Save, CopyPlus, ChevronRight, ChevronDown, Expand, Shrink, SeparatorVertical, Paintbrush, StickyNote, ScrollText, Table2, X, Package, Share2, Play } from 'lucide-react';
import { ToolbarButton } from '@/app/admin/_components/table/TableToolbar';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateScript, createScene, updateScene, deleteScene, reorderScenes,
  createBeat, updateBeat, deleteBeat, reorderBeats,
  getScriptVersions,
  uploadBeatReference, deleteBeatReference,
  moveReference, moveStoryboardFrame, swapStoryboardFrames, convertRefToStoryboard, convertStoryboardToRef,
  getScriptStyle, getStyleReferences, getStoryboardFrames,
  getScriptCastMap, getScriptLocationOptionsMap, saveScratchContent, createModeVersion,
  getCharacterReferenceMap, getLocationReferenceMap,
  getScriptProducts, getProductReferenceMap,
  getScriptSharesByGroup, getShareComments, getSnapshotBeats,
} from '@/app/admin/actions';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { ViewSwitcher } from '@/app/admin/_components/ViewSwitcher';
import { computeSceneNumbers } from '@/lib/scripts/sceneNumbers';
import { DEFAULT_FRACTIONS, DEFAULT_COLUMN_ORDER } from './gridUtils';
import { ScriptEditorCanvas } from './ScriptEditorCanvas';
import { ScriptSceneSidebar } from './ScriptSceneSidebar';
import { SceneNav } from './SceneNav';
import { SceneSidebarShell } from './SceneSidebarShell';
import { ScriptColumnToggle } from './ScriptColumnToggle';
import { ScriptStoryEditor } from './ScriptStoryEditor';
import { ScriptCharactersPanel } from './ScriptCharactersPanel';
import { ScriptTagsPanel } from './ScriptTagsPanel';
import { ScriptLocationsPanel } from './ScriptLocationsPanel';
import { ScriptProductsPanel } from './ScriptProductsPanel';
import { ScriptSettingsPanel } from './ScriptSettingsPanel';
import { ScriptStylePanel } from './ScriptStylePanel';
import { ScriptSharePanel } from './ScriptSharePanel';
import { ScriptVersionsPanel } from './ScriptVersionsPanel';
import { ScriptScratchPad, type ScratchScene, type ScriptScratchPadHandle } from './ScriptScratchPad';
import { ScriptExtractModal } from './ScriptExtractModal';
import { useAdminToast } from '@/app/admin/_components/AdminToast';
import { formatScriptVersion, versionColor } from '@/types/scripts';
import type { ContentMode } from '@/types/scripts';
import type { ScriptShareRow, ScriptShareCommentRow } from '@/types/scripts';
import type {
  ScriptRow, ScriptSceneRow, ScriptBeatRow,
  ScriptCharacterRow, ScriptTagRow, ScriptLocationRow,
  ScriptColumnConfig, ScriptBeatReferenceRow,
  ScriptStyleRow, ScriptStyleReferenceRow, ScriptStoryboardFrameRow,
  CharacterCastWithContact, CharacterReferenceRow,
  LocationOptionWithLocation, LocationReferenceRow,
  ScriptProductRow, ProductReferenceRow,
} from '@/types/scripts';

interface Props {
  script: ScriptRow & { project?: { id: string; title: string; client_name?: string; client?: { logo_url: string | null } | null } | null };
  initialScenes: ScriptSceneRow[];
  initialBeats: ScriptBeatRow[];
  initialCharacters: ScriptCharacterRow[];
  initialTags: ScriptTagRow[];
  initialLocations: ScriptLocationRow[];
  initialReferences: ScriptBeatReferenceRow[];
  globalLocations?: { id: string; name: string; featured_image: string | null }[];
  initialProducts?: ScriptProductRow[];
}

export function ScriptEditorClient({
  script: initialScript,
  initialScenes,
  initialBeats,
  initialCharacters,
  initialTags,
  initialLocations,
  initialReferences,
  globalLocations = [],
  initialProducts = [],
}: Props) {
  const { showError } = useAdminToast();
  const [script, setScript] = useState(initialScript);
  const [scenes, setScenes] = useState(initialScenes);
  const [beats, setBeats] = useState(initialBeats);
  const [characters, setCharacters] = useState(initialCharacters);
  const [tags, setTags] = useState(initialTags);
  const [locations, setLocations] = useState(initialLocations);
  const [references, setReferences] = useState(initialReferences);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(scenes[0]?.id ?? null);
  const [activeBeatId, setActiveBeatId] = useState<string | null>(null);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const [scriptStyle, setScriptStyle] = useState<ScriptStyleRow | null>(null);
  const [styleReferences, setStyleReferences] = useState<ScriptStyleReferenceRow[]>([]);
  const [storyboardFrames, setStoryboardFrames] = useState<ScriptStoryboardFrameRow[]>([]);
  const [castMap, setCastMap] = useState<Record<string, CharacterCastWithContact[]>>({});
  const [referenceMap, setReferenceMap] = useState<Record<string, CharacterReferenceRow[]>>({});
  const [locationOptionsMap, setLocationOptionsMap] = useState<Record<string, LocationOptionWithLocation[]>>({});
  const [locationReferenceMap, setLocationReferenceMap] = useState<Record<string, LocationReferenceRow[]>>({});
  const [showProducts, setShowProducts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [products, setProducts] = useState<ScriptProductRow[]>(initialProducts);
  const [productReferenceMap, setProductReferenceMap] = useState<Record<string, ProductReferenceRow[]>>({});
  const [showSidebar, setShowSidebar] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem(`script-sidebar-${script.id}`);
    if (stored === 'true') setShowSidebar(true);
  }, [script.id]);
  const [isFocused, setIsFocused] = useState(false);
  const CONTAINER_WIDTHS = ['', 'max-w-7xl', 'max-w-5xl', 'max-w-3xl'] as const;
  const CONTAINER_LABELS = ['Full', 'Wide', 'Medium', 'Narrow'] as const;
  const [containerIdx, setContainerIdx] = useState(0);
  const [switchingVersion, setSwitchingVersion] = useState(false);

  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; status: string; created_at: string; major_version: number; minor_version: number; is_published: boolean; content_mode?: string }[]>([]);
  const [contentMode, setContentMode] = useState<ContentMode>(initialScript.content_mode ?? 'table');
  const [scratchContent, setScratchContent] = useState(initialScript.scratch_content ?? '');
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [scratchScenes, setScratchScenes] = useState<ScratchScene[]>([]);
  const scratchPadRef = useRef<ScriptScratchPadHandle>(null);
  const [modeConfirm, setModeConfirm] = useState<{ message: string; targetMode: 'table' | 'scratchpad' } | null>(null);
  const router = useRouter();

  const defaultColumns: ScriptColumnConfig = { audio: true, visual: true, notes: false, reference: false, storyboard: false, comments: false };
  const [columnConfig, setColumnConfig] = useState<ScriptColumnConfig>(defaultColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [columnFractions, setColumnFractions] = useState<Record<string, number>>(DEFAULT_FRACTIONS);
  const [groupShares, setGroupShares] = useState<ScriptShareRow[]>([]);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Map<string, ScriptShareCommentRow[]>>(new Map());
  const [commentsLoading, setCommentsLoading] = useState(false);
  const sharesLoadedRef = useRef(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fna-script-columns');
      if (saved) setColumnConfig(JSON.parse(saved));
      const savedFr = localStorage.getItem('fna-script-col-widths');
      if (savedFr) setColumnFractions(JSON.parse(savedFr));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem('fna-script-columns', JSON.stringify(columnConfig));
  }, [columnConfig]);

  useEffect(() => {
    localStorage.setItem('fna-script-col-widths', JSON.stringify(columnFractions));
  }, [columnFractions]);

  // Load style + storyboard + cast data on mount
  useEffect(() => {
    (async () => {
      try {
        const groupId = script.script_group_id!;
        const [style, frames, castData, locOptionsData, refData, locRefData, productsData, prodRefData] = await Promise.all([
          getScriptStyle(script.id),
          getStoryboardFrames(script.id),
          getScriptCastMap(groupId),
          getScriptLocationOptionsMap(groupId),
          getCharacterReferenceMap(groupId),
          getLocationReferenceMap(groupId),
          getScriptProducts(groupId),
          getProductReferenceMap(groupId),
        ]);
        if (style) {
          setScriptStyle(style as ScriptStyleRow);
          const refs = await getStyleReferences(style.id);
          setStyleReferences(refs as ScriptStyleReferenceRow[]);
        }
        setStoryboardFrames(frames as unknown as ScriptStoryboardFrameRow[]);
        setCastMap(castData);
        setReferenceMap(refData);
        setLocationOptionsMap(locOptionsData);
        setLocationReferenceMap(locRefData);
        setProducts(productsData as ScriptProductRow[]);
        setProductReferenceMap(prodRefData as Record<string, ProductReferenceRow[]>);
      } catch { /* tables may not exist yet */ }
    })();
  }, [script.id]);

  // Load share list on mount
  useEffect(() => {
    if (!script.script_group_id) return;
    if (sharesLoadedRef.current) return;
    sharesLoadedRef.current = true;

    getScriptSharesByGroup(script.script_group_id).then((shares) => {
      setGroupShares(shares);
      const defaultShare = shares.find(s => s.snapshot_major_version === script.major_version)
        ?? shares.find(s => s.snapshot_major_version !== null)
        ?? shares[0]
        ?? null;
      if (!defaultShare) return;
      setSelectedShareId(defaultShare.id);
      // Preload comments immediately for the default share
      getShareComments(defaultShare.id).then((comments) => {
        const map = new Map<string, ScriptShareCommentRow[]>();
        for (const comment of comments) {
          if (!map.has(comment.beat_id)) map.set(comment.beat_id, []);
          map.get(comment.beat_id)!.push(comment);
        }
        setCommentsMap(map);
      }).catch(err => console.error('[Comments] preload failed:', err));
    }).catch((err) => {
      console.error('[ScriptCommentsCell] Failed to load shares:', err);
      showError('Failed to load shares');
    });
  }, [script.script_group_id, script.major_version]);

  // Load comments for a given share — maps snapshot beat IDs to current beat IDs by position
  const loadCommentsForShare = useCallback(async (shareId: string) => {
    const share = groupShares.find(s => s.id === shareId);
    if (!share) { setCommentsMap(new Map()); return; }

    setCommentsLoading(true);
    try {
      const comments = await getShareComments(share.id);
      if (comments.length === 0) { setCommentsMap(new Map()); return; }

      // Build position map: snapshot beat ID → position key ("sceneIdx:beatIdx")
      const snapshotScriptId = (share as unknown as Record<string, unknown>).snapshot_script_id as string | null;
      let beatIdMap: Map<string, string> | null = null; // snapshot beat ID → current beat ID

      if (snapshotScriptId && snapshotScriptId !== script.id) {
        const snapshot = await getSnapshotBeats(snapshotScriptId);
        // Map snapshot beats to position keys
        const snapshotPositions = new Map<string, string>(); // beat ID → "sceneIdx:beatIdx"
        const snapshotSceneBeatCounts = new Map<string, number>();
        for (const scene of snapshot.scenes) snapshotSceneBeatCounts.set(scene.id, 0);
        const sortedSnapshotScenes = [...snapshot.scenes].sort((a, b) => a.sort_order - b.sort_order);
        for (const beat of snapshot.beats) {
          const sceneIdx = sortedSnapshotScenes.findIndex(s => s.id === beat.scene_id);
          const beatIdx = snapshotSceneBeatCounts.get(beat.scene_id) ?? 0;
          snapshotSceneBeatCounts.set(beat.scene_id, beatIdx + 1);
          snapshotPositions.set(beat.id, `${sceneIdx}:${beatIdx}`);
        }

        // Map current beats to same position keys
        const currentPositions = new Map<string, string>(); // "sceneIdx:beatIdx" → current beat ID
        const sortedCurrentScenes = [...scenes].sort((a, b) => a.sort_order - b.sort_order);
        const currentSceneBeatCounts = new Map<string, number>();
        for (const scene of sortedCurrentScenes) currentSceneBeatCounts.set(scene.id, 0);
        for (const beat of beats) {
          const sceneIdx = sortedCurrentScenes.findIndex(s => s.id === beat.scene_id);
          const beatIdx = currentSceneBeatCounts.get(beat.scene_id) ?? 0;
          currentSceneBeatCounts.set(beat.scene_id, beatIdx + 1);
          currentPositions.set(`${sceneIdx}:${beatIdx}`, beat.id);
        }

        // Build mapping: snapshot beat ID → current beat ID
        beatIdMap = new Map();
        for (const [snapshotBeatId, posKey] of snapshotPositions) {
          const currentBeatId = currentPositions.get(posKey);
          if (currentBeatId) beatIdMap.set(snapshotBeatId, currentBeatId);
        }
      }

      const map = new Map<string, ScriptShareCommentRow[]>();
      for (const comment of comments) {
        const mappedBeatId = beatIdMap?.get(comment.beat_id) ?? comment.beat_id;
        if (!map.has(mappedBeatId)) map.set(mappedBeatId, []);
        map.get(mappedBeatId)!.push(comment);
      }
      setCommentsMap(map);
    } catch (err) {
      console.error('[Comments] Failed to load comments:', err);
      showError('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }, [groupShares, script.id, scenes, beats]);

  const handleRefreshComments = useCallback(() => {
    if (selectedShareId) loadCommentsForShare(selectedShareId);
  }, [selectedShareId, loadCommentsForShare]);

  // Build comments map when selected share changes
  useEffect(() => {
    if (!selectedShareId) { setCommentsMap(new Map()); return; }
    loadCommentsForShare(selectedShareId);
  }, [selectedShareId, loadCommentsForShare]);

  // Reset fractions to defaults when column visibility changes
  const handleColumnConfigChange = useCallback((config: ScriptColumnConfig) => {
    setColumnConfig(config);
    setColumnFractions({ ...DEFAULT_FRACTIONS });
  }, []);

  // Load versions when picker opens
  useEffect(() => {
    if (versionPickerOpen && script.script_group_id) {
      getScriptVersions(script.script_group_id).then(v => setVersions(v as typeof versions)).catch(() => {});
    }
  }, [versionPickerOpen, script.script_group_id]);

  // Also load versions when extract modal opens (for accurate version label)
  useEffect(() => {
    if (showExtractModal && script.script_group_id) {
      getScriptVersions(script.script_group_id).then(v => setVersions(v as typeof versions)).catch(() => {});
    }
  }, [showExtractModal, script.script_group_id]);

  // Group references by beat ID
  const refsByBeat: Record<string, ScriptBeatReferenceRow[]> = {};
  for (const ref of references) {
    if (!refsByBeat[ref.beat_id]) refsByBeat[ref.beat_id] = [];
    refsByBeat[ref.beat_id].push(ref);
  }

  // Debounced save refs
  const saveTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const toolbarSlotRef = useRef<HTMLDivElement>(null);

  // Ref to capture latest beats for the autoSave closure
  const beatsRef = useRef(beats);
  useEffect(() => { beatsRef.current = beats; }, [beats]);

  const autoSave = useAutoSave(async () => {
    // Flush all pending beat debounce timers
    for (const [beatId, timer] of saveTimers.current.entries()) {
      clearTimeout(timer);
      const beat = beatsRef.current.find(b => b.id === beatId);
      if (beat) {
        await updateBeat(beatId, {
          audio_content: beat.audio_content,
          visual_content: beat.visual_content,
          notes_content: beat.notes_content,
        });
      }
    }
    saveTimers.current.clear();
    await updateScript(script.id, { updated_at: new Date().toISOString() });
  });

  // Compute scene numbers
  const beatsByScene: Record<string, ScriptBeatRow[]> = {};
  for (const beat of beats) {
    if (!beatsByScene[beat.scene_id]) beatsByScene[beat.scene_id] = [];
    beatsByScene[beat.scene_id].push(beat);
  }
  const computedScenes = computeSceneNumbers(scenes, beatsByScene);

  // ── Scene operations ──
  const handleAddScene = useCallback(async () => {
    const maxOrder = scenes.reduce((max, s) => Math.max(max, s.sort_order), -1);
    const id = await createScene(script.id, {
      sort_order: maxOrder + 1,
      location_name: '',
      time_of_day: 'DAY',
      int_ext: 'INT',
    });
    const newScene: ScriptSceneRow = {
      id,
      script_id: script.id,
      sort_order: maxOrder + 1,
      location_name: '',
      location_id: null,
      time_of_day: 'DAY',
      int_ext: 'INT',
      scene_notes: null,
      scene_description: null,
      created_at: new Date().toISOString(),
    };
    setScenes(prev => [...prev, newScene]);
    const beatId = await createBeat(id, { sort_order: 0 });
    const newBeat: ScriptBeatRow = {
      id: beatId,
      scene_id: id,
      sort_order: 0,
      audio_content: '',
      visual_content: '',
      notes_content: '',
      storyboard_layout: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBeats(prev => [...prev, newBeat]);
    setActiveSceneId(id);
    // Focus the first cell of the new beat
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cell = document.querySelector(`[data-beat-id="${beatId}"]`) as HTMLElement;
        if (cell) cell.focus();
      });
    });
  }, [script.id, scenes]);

  const handleUpdateScene = useCallback(async (sceneId: string, data: Partial<ScriptSceneRow>) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...data } : s));
    await updateScene(sceneId, data);
  }, []);

  const handleDeleteScene = useCallback(async (sceneId: string) => {
    await deleteScene(sceneId);
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    setBeats(prev => prev.filter(b => b.scene_id !== sceneId));
    if (activeSceneId === sceneId) {
      setActiveSceneId(scenes.find(s => s.id !== sceneId)?.id ?? null);
    }
  }, [activeSceneId, scenes]);

  const handleReorderScenes = useCallback(async (orderedIds: string[]) => {
    setScenes(prev => {
      const mapped = new Map(prev.map(s => [s.id, s]));
      return orderedIds.map((id, i) => ({ ...mapped.get(id)!, sort_order: i }));
    });
    await reorderScenes(script.id, orderedIds);
  }, [script.id]);

  // ── Beat operations ──
  const handleAddBeat = useCallback(async (sceneId: string) => {
    const sceneBeats = beats.filter(b => b.scene_id === sceneId);
    const maxOrder = sceneBeats.reduce((max, b) => Math.max(max, b.sort_order), -1);
    const id = await createBeat(sceneId, { sort_order: maxOrder + 1 });
    const newBeat: ScriptBeatRow = {
      id,
      scene_id: sceneId,
      sort_order: maxOrder + 1,
      audio_content: '',
      visual_content: '',
      notes_content: '',
      storyboard_layout: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBeats(prev => [...prev, newBeat]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cell = document.querySelector(`[data-beat-id="${id}"]`) as HTMLElement;
        if (cell) cell.focus();
      });
    });
  }, [beats]);

  const handleUpdateBeat = useCallback((beatId: string, field: string, value: string) => {
    setBeats(prev => prev.map(b => b.id === beatId ? { ...b, [field]: value } : b));
    autoSave.trigger();
    const existing = saveTimers.current.get(beatId);
    if (existing) clearTimeout(existing);
    saveTimers.current.set(beatId, setTimeout(async () => {
      await updateBeat(beatId, { [field]: value });
      saveTimers.current.delete(beatId);
    }, 1500));
  }, [autoSave]);

  const handleDeleteBeat = useCallback(async (beatId: string) => {
    await deleteBeat(beatId);
    setBeats(prev => prev.filter(b => b.id !== beatId));
  }, []);

  const handleReorderBeats = useCallback(async (sceneId: string, orderedIds: string[]) => {
    setBeats(prev => {
      const sceneBeats = prev.filter(b => b.scene_id === sceneId);
      const otherBeats = prev.filter(b => b.scene_id !== sceneId);
      const mapped = new Map(sceneBeats.map(b => [b.id, b]));
      const reordered = orderedIds.map((id, i) => ({ ...mapped.get(id)!, sort_order: i }));
      return [...otherBeats, ...reordered];
    });
    await reorderBeats(sceneId, orderedIds);
  }, []);

  // ── Reference operations ──
  const handleUploadReference = useCallback(async (beatId: string, files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadBeatReference(beatId, formData);
        setReferences(prev => [...prev, {
          id: result.id,
          beat_id: beatId,
          image_url: result.image_url,
          storage_path: result.storage_path,
          sort_order: prev.filter(r => r.beat_id === beatId).length,
          created_at: new Date().toISOString(),
        }]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        showError('Reference upload failed', `${file.name}: ${msg}`);
      }
    }
  }, [showError]);

  const handleDeleteReference = useCallback(async (refId: string) => {
    try {
      await deleteBeatReference(refId);
      setReferences(prev => prev.filter(r => r.id !== refId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showError('Failed to delete reference', msg);
    }
  }, [showError]);

  // ── Storyboard frame handler ──
  const handleFrameChange = useCallback((frame: ScriptStoryboardFrameRow | null, beatId?: string) => {
    if (frame) {
      setStoryboardFrames(prev => {
        const filtered = prev.filter(f => {
          if (frame.beat_id && f.beat_id === frame.beat_id) return false;
          if (frame.scene_id && f.scene_id === frame.scene_id) return false;
          return true;
        });
        return [...filtered, frame];
      });
    } else if (beatId) {
      setStoryboardFrames(prev => prev.filter(f => f.beat_id !== beatId));
    }
  }, []);

  // ── Multi-frame batch update (Frames tab save) ──
  const handleFramesBatchChange = useCallback((frames: ScriptStoryboardFrameRow[], beatId: string) => {
    setStoryboardFrames(prev => [
      ...prev.filter(f => f.beat_id !== beatId),
      ...frames,
    ]);
  }, []);

  // ── Image move / swap between beat rows ──
  const handleImageMove = useCallback(async (
    dragData: import('@/types/scripts').ImageDragData,
    dropData: import('@/types/scripts').ImageDropData,
  ) => {
    const { dragType, imageId, sourceBeatId } = dragData;
    const { dropType, beatId: targetBeatId } = dropData;

    // No-op: dropped on same cell
    const sameColumn = (dragType === 'reference' && dropType === 'ref-cell') || (dragType === 'storyboard' && dropType === 'storyboard-cell');
    if (sourceBeatId === targetBeatId && sameColumn) return;

    // Snapshot for rollback
    const prevRefs = references;
    const prevFrames = storyboardFrames;

    try {
      // ── Reference → Reference cell ──
      if (dragType === 'reference' && dropType === 'ref-cell') {
        setReferences(prev => prev.map(r =>
          r.id === imageId ? { ...r, beat_id: targetBeatId, sort_order: prev.filter(x => x.beat_id === targetBeatId).length } : r
        ));
        await moveReference(imageId, targetBeatId);
        return;
      }

      // ── Storyboard → Storyboard cell ──
      if (dragType === 'storyboard' && dropType === 'storyboard-cell') {
        const targetFrame = storyboardFrames.find(f => f.beat_id === targetBeatId);
        if (targetFrame) {
          // Swap: trade beat_ids
          setStoryboardFrames(prev => prev.map(f => {
            if (f.id === imageId) return { ...f, beat_id: targetBeatId };
            if (f.id === targetFrame.id) return { ...f, beat_id: sourceBeatId };
            return f;
          }));
          await swapStoryboardFrames(imageId, targetFrame.id);
        } else {
          // Move to empty beat
          setStoryboardFrames(prev => prev.map(f =>
            f.id === imageId ? { ...f, beat_id: targetBeatId } : f
          ));
          await moveStoryboardFrame(imageId, targetBeatId);
        }
        return;
      }

      // ── Reference → Storyboard cell ──
      if (dragType === 'reference' && dropType === 'storyboard-cell') {
        const targetFrame = storyboardFrames.find(f => f.beat_id === targetBeatId);

        // Remove ref optimistically
        setReferences(prev => prev.filter(r => r.id !== imageId));

        if (targetFrame) {
          // Swap: ref becomes storyboard, existing storyboard becomes ref on source beat
          setStoryboardFrames(prev => prev.filter(f => f.id !== targetFrame.id));

          const [newFrame, newRef] = await Promise.all([
            convertRefToStoryboard(imageId, script.id, targetBeatId),
            convertStoryboardToRef(targetFrame.id, sourceBeatId),
          ]);

          setStoryboardFrames(prev => [...prev, newFrame]);
          setReferences(prev => [...prev, newRef]);
        } else {
          // Convert ref to storyboard on empty target
          const newFrame = await convertRefToStoryboard(imageId, script.id, targetBeatId);
          setStoryboardFrames(prev => [...prev, newFrame]);
        }
        return;
      }

      // ── Storyboard → Reference cell ──
      if (dragType === 'storyboard' && dropType === 'ref-cell') {
        setStoryboardFrames(prev => prev.filter(f => f.id !== imageId));

        const newRef = await convertStoryboardToRef(imageId, targetBeatId);
        setReferences(prev => [...prev, newRef]);
        return;
      }
    } catch (err) {
      // Rollback on error
      setReferences(prevRefs);
      setStoryboardFrames(prevFrames);
      const msg = err instanceof Error ? err.message : 'Move failed';
      showError('Image move failed', msg);
    }
  }, [references, storyboardFrames, script.id, showError]);

  // ── Save all (flush via autoSave) ──
  const handleSaveAll = useCallback(async () => {
    await autoSave.flush();
  }, [autoSave]);

  // Debounced scratch content save
  const scratchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleScratchChange = useCallback((content: string) => {
    setScratchContent(content);
    autoSave.trigger();
    if (scratchTimer.current) clearTimeout(scratchTimer.current);
    scratchTimer.current = setTimeout(async () => {
      await saveScratchContent(script.id, content);
      scratchTimer.current = null;
    }, 1500);
  }, [script.id, autoSave]);

  // Compute next minor version from loaded versions (use highest major across group)
  const maxMajor = versions.reduce((max, v) => Math.max(max, v.major_version), 0);
  const nextMinor = versions
    .filter(v => v.major_version === maxMajor)
    .reduce((max, v) => Math.max(max, v.minor_version), 0) + 1;
  const nextVersionLabel = `v${maxMajor}.${nextMinor}`;

  // Mode switching: table → scratchpad (with confirm dialog)
  const handleModeSwitch = useCallback(() => {
    setModeConfirm({
      message: `This will create a new scratchpad version (${nextVersionLabel}) with your current table content converted to text.`,
      targetMode: 'scratchpad',
    });
  }, [nextVersionLabel]);

  const executeModeSwitch = useCallback(async (targetMode: ContentMode) => {
    setModeConfirm(null);
    try {
      const newId = await createModeVersion(script.id, targetMode);
      router.push(`/admin/scripts/${newId}`);
    } catch (err) {
      console.error('Failed to create mode version:', err);
    }
  }, [script.id, router]);

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveTimers.current.size > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // ── Focus mode toggle ──
  const toggleFocus = useCallback(() => {
    setIsFocused(prev => {
      const next = !prev;
      const shell = document.querySelector('.admin-shell');
      if (next) shell?.classList.add('focus-push');
      else shell?.classList.remove('focus-push');
      return next;
    });
  }, []);

  // Remove focus-push class on unmount (e.g. navigating away)
  useEffect(() => {
    return () => {
      document.querySelector('.admin-shell')?.classList.remove('focus-push');
    };
  }, []);

  // Escape exits focus mode
  useEffect(() => {
    if (!isFocused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleFocus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocused, toggleFocus]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Version switching overlay */}
      {switchingVersion && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-admin-bg-base/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-admin-text-muted text-admin-sm">
            <div className="w-5 h-5 border-2 border-admin-text-faint border-t-transparent rounded-full animate-spin" />
            Loading version...
          </div>
        </div>
      )}
      {/* Header — collapses when focused */}
      <div className={`relative flex-shrink-0 border-b border-admin-border transition-[max-height,border-bottom-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isFocused ? 'max-h-0 border-b-0 overflow-hidden' : 'max-h-[7rem]'} ${versionPickerOpen ? 'z-[999]' : 'z-20'}`}>
      <AdminPageHeader
        title=""
        icon={ScrollText}
        leftContent={
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Link
                  href="/admin/scripts"
                  className="text-xs text-admin-text-faint hover:text-admin-text-primary transition-colors"
                >
                  Scripts
                </Link>
                {script.project?.client_name && (
                  <>
                    <ChevronRight size={10} className="text-admin-text-ghost" />
                    <span className="text-xs text-admin-text-faint">{script.project.client_name}</span>
                  </>
                )}
                <ChevronRight size={10} className="text-admin-text-ghost" />
                <span className="text-xs text-admin-text-muted">{script.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-admin-text-primary">
                  {script.title}
                </h1>
              {/* Version picker */}
              <div className={`relative ${versionPickerOpen ? 'z-50' : ''}`}>
                <button
                  onClick={() => setVersionPickerOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-admin-mono font-bold rounded-full transition-colors ${script.is_published ? 'border' : 'border border-dashed'}`}
                  style={{
                    borderColor: versionColor(script.major_version) + '40',
                    backgroundColor: script.is_published ? versionColor(script.major_version) + '15' : 'transparent',
                    color: versionColor(script.major_version),
                  }}
                >
                  {formatScriptVersion(script.major_version, script.minor_version, script.is_published)} — {script.is_published ? 'SHARED' : 'DRAFT'}
                  <ChevronDown size={10} />
                </button>
                {versionPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setVersionPickerOpen(false)} />
                    <div
                      className="absolute top-full left-0 mt-1 z-50 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl py-1 animate-dropdown-in"
                    >
                      {[...versions].sort((a, b) => b.major_version - a.major_version || b.minor_version - a.minor_version).map(v => (
                        <div
                          key={v.id}
                          role="button"
                          onClick={() => {
                            setVersionPickerOpen(false);
                            if (v.id !== script.id) {
                              setSwitchingVersion(true);
                              router.push(`/admin/scripts/${v.id}`);
                            }
                          }}
                          className={`flex items-center px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                            v.id === script.id
                              ? 'bg-admin-bg-active text-admin-text-primary'
                              : 'text-admin-text-secondary hover:bg-admin-bg-hover'
                          }`}
                        >
                          <span
                            className={`font-admin-mono font-bold px-2 py-0.5 rounded-full text-xs w-[3.5rem] text-center flex-shrink-0 ${v.is_published ? 'border' : 'border border-dashed'}`}
                            style={{
                              backgroundColor: v.is_published ? versionColor(v.major_version) + '20' : 'transparent',
                              color: versionColor(v.major_version),
                              borderColor: versionColor(v.major_version) + '40',
                            }}
                          >
                            {formatScriptVersion(v.major_version, v.minor_version, v.is_published)}
                          </span>
                          <span className="flex justify-center text-admin-text-faint w-6 flex-shrink-0">
                            {v.content_mode === 'scratchpad' ? <StickyNote size={14} /> : <Table2 size={14} />}
                          </span>
                          <span className="text-admin-text-ghost font-admin-mono w-[5.5rem] flex-shrink-0">{new Date(v.created_at).toLocaleDateString()}</span>
                          <span className="text-admin-sm font-medium text-admin-success flex-shrink-0">
                            {v.is_published ? 'SHARED' : ''}
                          </span>
                        </div>
                      ))}
                      {versions.length === 0 && (
                        <div className="px-3 py-2 text-xs text-admin-text-faint">Loading...</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              </div>
            </div>
        }
        rightContent={<SaveDot status={autoSave.status} />}
        actions={
          <>
            <button onClick={() => setShowShare(true)} className="btn-secondary px-2.5" title="Share">
              <Share2 size={14} />
            </button>
            <button
              onClick={() => setShowVersions(true)}
              className="btn-secondary px-2.5"
              title="Versions"
            >
              <CopyPlus size={14} />
            </button>
            <button onClick={() => setShowSettings(true)} className="btn-secondary px-2.5" title="Settings">
              <Settings size={14} />
            </button>
            <button
              onClick={handleSaveAll}
              className="btn-primary px-5 text-sm"
            >
              <Save size={14} />
              Save
            </button>
          </>
        }
      />
      </div>

      {/* Toolbar row — 3-zone: left (sidebar+focus), center (column toggles), right (panels) */}
      <div className="flex-shrink-0 h-[3rem] flex items-center px-4 border-b border-admin-border bg-admin-bg-inset">
        {/* Left zone — mode-conditional */}
        <div className="flex items-center gap-1">
          {/* Mode toggle — table / scratchpad */}
          <ViewSwitcher
            views={[
              { key: 'story' as ContentMode, icon: Play, label: 'Story' },
              { key: 'table' as ContentMode, icon: Table2, label: 'Table' },
              { key: 'scratchpad' as ContentMode, icon: ScrollText, label: 'Scratchpad' },
            ]}
            activeView={contentMode}
            onChange={(mode) => {
              if (mode === 'scratchpad' && contentMode !== 'scratchpad') handleModeSwitch();
              else if (mode !== 'scratchpad' && contentMode === 'scratchpad') setShowExtractModal(true);
              else setContentMode(mode);
            }}
          />
          <div className="w-2" />
          {/* Scenes toggle + Fullscreen — far left */}
          <button
            onClick={() => setShowSidebar(prev => { const next = !prev; localStorage.setItem(`script-sidebar-${script.id}`, String(next)); return next; })}
            className={`text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors inline-flex items-center gap-1.5 ${showSidebar ? 'bg-admin-bg-active text-admin-text-secondary' : ''}`}
            title={showSidebar ? 'Hide scenes' : 'Show scenes'}
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            <span className="text-[10px] font-semibold uppercase tracking-widest">Scenes</span>
          </button>
          <button
            onClick={toggleFocus}
            className={`text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${isFocused ? 'bg-admin-bg-active text-admin-text-secondary' : ''}`}
            title={isFocused ? 'Exit focus mode' : 'Focus mode'}
          >
            {isFocused ? <Shrink size={16} /> : <Expand size={16} />}
          </button>
          <div className="w-2" />
          {/* Shared toolbar buttons */}
          <button
            onClick={() => setContainerIdx(prev => (prev + 1) % CONTAINER_WIDTHS.length)}
            className={`text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${containerIdx !== 0 ? 'bg-admin-bg-active text-admin-text-secondary' : ''}`}
            title={`Width: ${CONTAINER_LABELS[containerIdx]} → ${CONTAINER_LABELS[(containerIdx + 1) % CONTAINER_WIDTHS.length]}`}
          >
            <SeparatorVertical size={16} />
          </button>
        </div>
        {/* Center zone */}
        <div className="flex-1 flex justify-center items-center gap-4">
          {contentMode !== 'scratchpad' && (
            <ScriptColumnToggle config={columnConfig} onChange={handleColumnConfigChange} compact columnOrder={columnOrder} onColumnOrderChange={setColumnOrder} />
          )}
        </div>
        {/* Right zone — panel toggles */}
        <div className="flex items-center gap-0">
          <div ref={toolbarSlotRef} className="w-8 h-8 flex-shrink-0" />
          <ToolbarButton icon={User} label="" onClick={() => setShowCharacters(true)} />
          <ToolbarButton icon={MapPin} label="" onClick={() => setShowLocations(true)} />
          <ToolbarButton icon={Package} label="" onClick={() => setShowProducts(true)} />
          <ToolbarButton icon={Hash} label="" onClick={() => setShowTags(true)} />
          <ToolbarButton icon={Paintbrush} label="" onClick={() => setShowStyle(true)} />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Scene sidebar */}
        <SceneSidebarShell open={showSidebar}>
            {contentMode === 'scratchpad' ? (
              <ScriptSceneSidebar
                scenes={computedScenes}
                activeSceneId={activeSceneId}
                onSelectScene={setActiveSceneId}
                onAddScene={handleAddScene}
                onReorderScenes={handleReorderScenes}
                onDeleteScene={handleDeleteScene}
                scratchpadMode
                scratchScenes={scratchScenes}
                onScrollToScene={(label, sceneIndex) => scratchPadRef.current?.scrollToScene(label, sceneIndex)}
              />
            ) : (
              <SceneNav
                scenes={computedScenes.map(s => ({ id: s.id, sceneNumber: s.sceneNumber, int_ext: s.int_ext, location_name: s.location_name, time_of_day: s.time_of_day, scene_description: (s as unknown as { scene_description?: string | null }).scene_description ?? null, beats: s.beats.map(b => ({ id: b.id, sort_order: b.sort_order })) }))}
                activeSceneId={activeSceneId}
                onSelectScene={setActiveSceneId}
                activeBeatId={activeBeatId}
                onSelectBeat={(beatId) => {
                  setActiveBeatId(beatId);
                  const scene = computedScenes.find(s => s.beats.some(b => b.id === beatId));
                  if (scene) setActiveSceneId(scene.id);
                }}
                draggable
                onReorder={handleReorderScenes}
                showAddButton
                onAddScene={handleAddScene}
              />
            )}
        </SceneSidebarShell>

        {/* Main editor — constrained by container width toggle */}
        <div className="flex-1 min-w-0 min-h-0 h-full">
          <div className={`h-full flex flex-col transition-[max-width,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border-l border-r ${containerIdx > 0 ? `${CONTAINER_WIDTHS[containerIdx]} mx-auto border-admin-border` : 'border-transparent'}`}>
            {contentMode === 'story' ? (
              <ScriptStoryEditor
                scenes={computedScenes}
                columnConfig={columnConfig}
                columnOrder={columnOrder}
                onColumnConfigChange={handleColumnConfigChange}
                onColumnOrderChange={setColumnOrder}
                characters={characters}
                tags={tags}
                locations={locations}
                products={products}
                references={refsByBeat}
                storyboardFrames={storyboardFrames}
                scriptStyle={scriptStyle}
                styleReferences={styleReferences}
                scriptId={script.id}
                scriptGroupId={script.script_group_id!}
                onFrameGenerated={handleFrameChange}
                onFramesBatchChange={handleFramesBatchChange}
                activeSceneId={activeSceneId}
                activeBeatId={activeBeatId}
                onUpdateBeat={handleUpdateBeat}
                onSelectScene={setActiveSceneId}
                onUploadReference={handleUploadReference}
                onDeleteReference={handleDeleteReference}
                castMap={castMap}
                referenceMap={referenceMap}
                locationReferenceMap={locationReferenceMap}
                scriptTitle={script.title}
                scriptVersion={script.major_version}
                onImageMove={handleImageMove}
                groupShares={groupShares}
                selectedShareId={selectedShareId}
                onSelectShare={setSelectedShareId}
                commentsMap={commentsMap}
                commentsLoading={commentsLoading}
                onRefreshComments={handleRefreshComments}
              />
            ) : contentMode === 'table' ? (
              <ScriptEditorCanvas
                scenes={computedScenes}
                columnConfig={columnConfig}
                columnOrder={columnOrder}
                columnFractions={columnFractions}
                onColumnFractionsChange={setColumnFractions}
                characters={characters}
                tags={tags}
                locations={locations}
                references={refsByBeat}
                storyboardFrames={storyboardFrames}
                scriptStyle={scriptStyle}
                styleReferences={styleReferences}
                scriptId={script.id}
                scriptGroupId={script.script_group_id!}
                onFrameGenerated={handleFrameChange}
                onFramesBatchChange={handleFramesBatchChange}
                activeSceneId={activeSceneId}
                activeBeatId={activeBeatId}
                onUpdateScene={handleUpdateScene}
                onAddScene={handleAddScene}
                onAddBeat={handleAddBeat}
                onUpdateBeat={handleUpdateBeat}
                onDeleteBeat={handleDeleteBeat}
                onReorderBeats={handleReorderBeats}
                onDeleteScene={handleDeleteScene}
                onSelectScene={setActiveSceneId}
                onUploadReference={handleUploadReference}
                onDeleteReference={handleDeleteReference}
                castMap={castMap}
                referenceMap={referenceMap}
                locationReferenceMap={locationReferenceMap}
                products={products}
                toolbarPortalRef={toolbarSlotRef}
                onReorderScenes={handleReorderScenes}
                scriptTitle={script.title}
                scriptVersion={script.major_version}
                onAllFramesDeleted={() => setStoryboardFrames([])}
                onImageMove={handleImageMove}
                groupShares={groupShares}
                selectedShareId={selectedShareId}
                onSelectShare={setSelectedShareId}
                commentsMap={commentsMap}
                commentsLoading={commentsLoading}
                onRefreshComments={handleRefreshComments}
              />
            ) : (
              <ScriptScratchPad
                ref={scratchPadRef}
                scriptId={script.id}
                initialContent={scratchContent}
                characters={characters}
                tags={tags}
                locations={locations}
                products={products}
                onContentChange={handleScratchChange}
                onScenesDetected={setScratchScenes}
              />
            )}
          </div>
        </div>
      </div>

      {/* Panels */}
      <ScriptCharactersPanel
        open={showCharacters}
        onClose={() => setShowCharacters(false)}
        scriptGroupId={script.script_group_id!}
        characters={characters}
        beats={beats}
        onCharactersChange={setCharacters}
        castMap={castMap}
        onCastMapChange={setCastMap}
        referenceMap={referenceMap}
        onReferenceMapChange={setReferenceMap}
      />
      <ScriptTagsPanel
        open={showTags}
        onClose={() => setShowTags(false)}
        scriptGroupId={script.script_group_id!}
        tags={tags}
        onTagsChange={setTags}
      />
      <ScriptLocationsPanel
        open={showLocations}
        onClose={() => setShowLocations(false)}
        scriptGroupId={script.script_group_id!}
        locations={locations}
        scenes={scenes}
        onLocationsChange={setLocations}
        globalLocations={globalLocations}
        locationOptionsMap={locationOptionsMap}
        onLocationOptionsMapChange={setLocationOptionsMap}
        locationReferenceMap={locationReferenceMap}
        onLocationReferenceMapChange={setLocationReferenceMap}
      />
      <ScriptProductsPanel
        open={showProducts}
        onClose={() => setShowProducts(false)}
        scriptGroupId={script.script_group_id!}
        products={products}
        onProductsChange={setProducts}
        productReferenceMap={productReferenceMap}
        onProductReferenceMapChange={setProductReferenceMap}
      />
      <ScriptSettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        script={script}
        onScriptChange={setScript}
      />
      <ScriptStylePanel
        open={showStyle}
        onClose={() => setShowStyle(false)}
        style={scriptStyle}
        references={styleReferences}
        onStyleChange={setScriptStyle}
        onReferencesChange={setStyleReferences}
      />
      <ScriptSharePanel
        open={showShare}
        onClose={() => setShowShare(false)}
        scriptId={script.id}
        onVersionChanged={() => router.refresh()}
      />
      <ScriptVersionsPanel
        open={showVersions}
        onClose={() => setShowVersions(false)}
        scriptId={script.id}
        scriptGroupId={script.script_group_id!}
        onNavigate={(id) => { setShowVersions(false); router.push(`/admin/scripts/${id}`); }}
      />
      <ScriptExtractModal
        open={showExtractModal}
        onClose={() => setShowExtractModal(false)}
        scriptId={script.id}
        scratchContent={scratchContent}
        existingCharacters={characters}
        existingLocations={locations}
        globalLocations={globalLocations}
        nextVersionLabel={nextVersionLabel}
        onVersionCreated={(newId) => {
          setShowExtractModal(false);
          setContentMode('table');
          router.push(`/admin/scripts/${newId}`);
        }}
      />

      {/* Mode switch confirmation dialog (table → scratchpad) */}
      {modeConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModeConfirm(null)} />
          <div className="relative bg-admin-bg-overlay border border-admin-border rounded-admin-xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-raised">
              <h2 className="text-admin-lg font-admin-display font-semibold text-admin-text-primary">Convert to Scratchpad</h2>
              <button
                onClick={() => setModeConfirm(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="px-5 py-4 bg-admin-bg-overlay">
              <p className="text-sm text-admin-text-secondary leading-relaxed">Your table content will be flattened to text in a new scratchpad version.</p>
            </div>
            {/* Footer */}
            <div className="flex items-center gap-2 px-5 py-3 bg-admin-bg-raised border-t border-admin-border">
              <button
                onClick={() => executeModeSwitch(modeConfirm.targetMode)}
                className="btn-primary px-4 py-2 text-sm"
              >
                Create {nextVersionLabel}
              </button>
              <button onClick={() => setModeConfirm(null)} className="btn-secondary px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
