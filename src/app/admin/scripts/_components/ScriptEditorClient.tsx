'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Settings, Users, Hash, MapPin, Save, Loader2, CopyPlus, ChevronRight, ChevronDown, Expand, Shrink, SeparatorVertical, Paintbrush, StickyNote, ScrollText, Table2, X, Check } from 'lucide-react';
import { ToolbarButton } from '@/app/admin/_components/table/TableToolbar';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateScript, createScene, updateScene, deleteScene, reorderScenes,
  createBeat, updateBeat, deleteBeat, reorderBeats,
  createScriptVersion, publishScriptVersion, unpublishScriptVersion, getScriptVersions,
  uploadBeatReference, deleteBeatReference,
  getScriptStyle, getStyleReferences, getStoryboardFrames,
  getScriptCastMap, saveScratchContent, createModeVersion,
} from '@/app/admin/actions';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { ViewSwitcher } from '@/app/admin/_components/ViewSwitcher';
import { computeSceneNumbers } from '@/lib/scripts/sceneNumbers';
import { DEFAULT_FRACTIONS } from './gridUtils';
import { ScriptEditorCanvas } from './ScriptEditorCanvas';
import { ScriptSceneSidebar } from './ScriptSceneSidebar';
import { ScriptColumnToggle } from './ScriptColumnToggle';
import { ScriptCharactersPanel } from './ScriptCharactersPanel';
import { ScriptTagsPanel } from './ScriptTagsPanel';
import { ScriptLocationsPanel } from './ScriptLocationsPanel';
import { ScriptSettingsPanel } from './ScriptSettingsPanel';
import { ScriptStylePanel } from './ScriptStylePanel';
import { ScriptScratchPad, type ScratchScene, type ScriptScratchPadHandle } from './ScriptScratchPad';
import { ScriptExtractModal } from './ScriptExtractModal';
import { formatScriptVersion } from '@/types/scripts';
import type { ContentMode } from '@/types/scripts';
import type {
  ScriptRow, ScriptSceneRow, ScriptBeatRow,
  ScriptCharacterRow, ScriptTagRow, ScriptLocationRow,
  ScriptColumnConfig, ScriptBeatReferenceRow,
  ScriptStyleRow, ScriptStyleReferenceRow, ScriptStoryboardFrameRow,
  CharacterCastWithContact,
} from '@/types/scripts';

interface Props {
  script: ScriptRow & { project?: { id: string; title: string } | null };
  initialScenes: ScriptSceneRow[];
  initialBeats: ScriptBeatRow[];
  initialCharacters: ScriptCharacterRow[];
  initialTags: ScriptTagRow[];
  initialLocations: ScriptLocationRow[];
  initialReferences: ScriptBeatReferenceRow[];
  globalLocations?: { id: string; name: string; featured_image: string | null }[];
}

/** Rainbow version pill colors — cycles red → orange → yellow → green → cyan → blue → violet */
const VERSION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
];
function versionColor(majorVersion: number): string {
  return VERSION_COLORS[majorVersion % VERSION_COLORS.length];
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
}: Props) {
  const [script, setScript] = useState(initialScript);
  const [scenes, setScenes] = useState(initialScenes);
  const [beats, setBeats] = useState(initialBeats);
  const [characters, setCharacters] = useState(initialCharacters);
  const [tags, setTags] = useState(initialTags);
  const [locations, setLocations] = useState(initialLocations);
  const [references, setReferences] = useState(initialReferences);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(scenes[0]?.id ?? null);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const [scriptStyle, setScriptStyle] = useState<ScriptStyleRow | null>(null);
  const [styleReferences, setStyleReferences] = useState<ScriptStyleReferenceRow[]>([]);
  const [storyboardFrames, setStoryboardFrames] = useState<ScriptStoryboardFrameRow[]>([]);
  const [castMap, setCastMap] = useState<Record<string, CharacterCastWithContact[]>>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const CONTAINER_WIDTHS = ['', 'max-w-7xl', 'max-w-5xl', 'max-w-3xl'] as const;
  const CONTAINER_LABELS = ['Full', 'Wide', 'Medium', 'Narrow'] as const;
  const [containerIdx, setContainerIdx] = useState(0);
  const [versioning, setVersioning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; status: string; created_at: string; major_version: number; minor_version: number; is_published: boolean; content_mode?: string }[]>([]);
  const [contentMode, setContentMode] = useState<ContentMode>(initialScript.content_mode ?? 'table');
  const [scratchContent, setScratchContent] = useState(initialScript.scratch_content ?? '');
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [scratchScenes, setScratchScenes] = useState<ScratchScene[]>([]);
  const scratchPadRef = useRef<ScriptScratchPadHandle>(null);
  const [modeConfirm, setModeConfirm] = useState<{ message: string; targetMode: 'table' | 'scratchpad' } | null>(null);
  const router = useRouter();

  const defaultColumns: ScriptColumnConfig = { audio: true, visual: true, notes: false, reference: false, storyboard: false };
  const [columnConfig, setColumnConfig] = useState<ScriptColumnConfig>(defaultColumns);
  const [columnFractions, setColumnFractions] = useState<Record<string, number>>(DEFAULT_FRACTIONS);

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
        const [style, frames, castData] = await Promise.all([
          getScriptStyle(script.id),
          getStoryboardFrames(script.id),
          getScriptCastMap(script.id),
        ]);
        if (style) {
          setScriptStyle(style as ScriptStyleRow);
          const refs = await getStyleReferences(style.id);
          setStyleReferences(refs as ScriptStyleReferenceRow[]);
        }
        setStoryboardFrames(frames as ScriptStoryboardFrameRow[]);
        setCastMap(castData);
      } catch { /* tables may not exist yet */ }
    })();
  }, [script.id]);

  // Reset fractions to defaults when column visibility changes
  const handleColumnConfigChange = useCallback((config: ScriptColumnConfig) => {
    setColumnConfig(config);
    setColumnFractions({ ...DEFAULT_FRACTIONS });
  }, []);

  // Load versions when picker opens
  useEffect(() => {
    if (versionPickerOpen && script.script_group_id) {
      getScriptVersions(script.script_group_id).then(setVersions).catch(() => {});
    }
  }, [versionPickerOpen, script.script_group_id]);

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
    }
  }, []);

  const handleDeleteReference = useCallback(async (refId: string) => {
    await deleteBeatReference(refId);
    setReferences(prev => prev.filter(r => r.id !== refId));
  }, []);

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

  // Compute next minor version from loaded versions
  const nextMinor = versions
    .filter(v => v.major_version === script.major_version)
    .reduce((max, v) => Math.max(max, v.minor_version), 0) + 1;
  const nextVersionLabel = `v${script.major_version}.${nextMinor}`;

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

  // ── Create new version ──
  const handleNewVersion = useCallback(async () => {
    setVersioning(true);
    try {
      await handleSaveAll();
      const newId = await createScriptVersion(script.id);
      router.push(`/admin/scripts/${newId}`);
    } finally {
      setVersioning(false);
    }
  }, [handleSaveAll, script.id, router]);

  // ── Publish / Unpublish (toggle client-portal visibility) ──
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      await handleSaveAll();
      await publishScriptVersion(script.id);
      // Optimistic: compute next major and update local state
      const nextMajor = versions.length > 0
        ? Math.max(...versions.map(v => v.major_version)) + 1
        : 1;
      setScript(prev => ({ ...prev, major_version: nextMajor, minor_version: 0, is_published: true }));
      setVersions(prev => prev.map(v => v.id === script.id ? { ...v, major_version: nextMajor, minor_version: 0, is_published: true } : v));
    } finally {
      setPublishing(false);
    }
  }, [handleSaveAll, script.id, versions]);

  const handleUnpublish = useCallback(async () => {
    setPublishing(true);
    try {
      await unpublishScriptVersion(script.id);
      setScript(prev => ({ ...prev, is_published: false }));
      setVersions(prev => prev.map(v => v.id === script.id ? { ...v, is_published: false } : v));
    } finally {
      setPublishing(false);
    }
  }, [script.id]);

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
                <ChevronRight size={10} className="text-admin-text-ghost" />
                <span className="text-xs text-admin-text-muted">{script.title}</span>
                {script.project && (
                  <>
                    <span className="text-admin-text-ghost mx-0.5">·</span>
                    <span className="text-xs text-admin-text-faint">{script.project.title}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-admin-text-primary">
                  {script.title}
                </h1>
              {/* Version picker */}
              <div className={`relative ${versionPickerOpen ? 'z-50' : ''}`}>
                <button
                  onClick={() => setVersionPickerOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-admin-mono font-bold rounded-full border transition-colors"
                  style={{ borderColor: versionColor(script.major_version) + '40', backgroundColor: versionColor(script.major_version) + '15', color: versionColor(script.major_version) }}
                >
                  {formatScriptVersion(script.major_version, script.minor_version, script.is_published)}
                  <ChevronDown size={10} />
                </button>
                {versionPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setVersionPickerOpen(false)} />
                    <div
                      className="absolute top-full left-0 mt-1 z-50 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl py-1 animate-dropdown-in"
                    >
                      {versions
                        .slice()
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setVersionPickerOpen(false);
                            if (v.id !== script.id) router.push(`/admin/scripts/${v.id}`);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                            v.id === script.id
                              ? 'bg-admin-bg-active text-admin-text-primary'
                              : 'text-admin-text-secondary hover:bg-admin-bg-hover'
                          }`}
                        >
                          <span
                            className="font-admin-mono font-bold px-2 py-0.5 rounded-full text-xs"
                            style={{ backgroundColor: versionColor(v.major_version) + '20', color: versionColor(v.major_version) }}
                          >
                            {formatScriptVersion(v.major_version, v.minor_version, v.is_published)}
                          </span>
                          {v.content_mode === 'scratchpad' ? <StickyNote size={14} className="text-admin-text-faint" /> : <Table2 size={14} className="text-admin-text-faint" />}
                          {v.is_published && (
                            <span className="text-[10px] font-medium text-admin-success">Published</span>
                          )}
                          <span className="text-admin-text-ghost font-admin-mono ml-auto">{new Date(v.created_at).toLocaleDateString()}</span>
                        </button>
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
            <button
              onClick={handleNewVersion}
              disabled={versioning}
              className="btn-secondary px-2.5"
              title="New version"
            >
              {versioning ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} />}
            </button>
            <button onClick={() => setShowSettings(true)} className="btn-secondary px-2.5" title="Settings">
              <Settings size={14} />
            </button>
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(p => !p)}
                className={`${script.is_published ? 'btn-success' : 'btn-secondary'} gap-1.5 px-4 text-sm font-medium`}
              >
                {script.is_published ? 'Published' : 'Internal Draft'}
                <ChevronDown size={12} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl min-w-[160px] py-1">
                    <button
                      onClick={() => { setShowStatusDropdown(false); if (script.is_published) handleUnpublish(); }}
                      disabled={publishing || !script.is_published}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        !script.is_published ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-muted hover:bg-admin-bg-hover disabled:opacity-40'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-admin-text-faint" />
                        Internal Draft
                      </span>
                      {!script.is_published && <Check size={12} />}
                    </button>
                    <button
                      onClick={() => { setShowStatusDropdown(false); handlePublish(); }}
                      disabled={publishing || script.is_published}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        script.is_published ? 'text-admin-success bg-admin-success-bg/30' : 'text-admin-text-muted hover:bg-admin-bg-hover disabled:opacity-40'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-admin-success" />
                        Published
                      </span>
                      {script.is_published && <Check size={12} />}
                    </button>
                  </div>
                </>
              )}
            </div>
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
              { key: 'table' as ContentMode, icon: Table2, label: 'Table' },
              { key: 'scratchpad' as ContentMode, icon: ScrollText, label: 'Scratchpad' },
            ]}
            activeView={contentMode}
            onChange={(mode) => {
              if (mode === 'scratchpad' && contentMode === 'table') handleModeSwitch();
              if (mode === 'table' && contentMode === 'scratchpad') setShowExtractModal(true);
            }}
          />
          <div className="w-2" />
          {/* Shared toolbar buttons */}
          <button
            onClick={toggleFocus}
            className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors"
            title={isFocused ? 'Exit focus mode' : 'Focus mode'}
          >
            {isFocused ? <Shrink size={16} /> : <Expand size={16} />}
          </button>
          <button
            onClick={() => setShowSidebar(prev => !prev)}
            className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors"
            title={showSidebar ? 'Hide scenes' : 'Show scenes'}
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <button
            onClick={() => setContainerIdx(prev => (prev + 1) % CONTAINER_WIDTHS.length)}
            className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors"
            title={`Width: ${CONTAINER_LABELS[containerIdx]} → ${CONTAINER_LABELS[(containerIdx + 1) % CONTAINER_WIDTHS.length]}`}
          >
            <SeparatorVertical size={16} />
          </button>
        </div>
        {/* Center zone */}
        <div className="flex-1 flex justify-center items-center gap-4">
          {contentMode === 'table' && (
            <ScriptColumnToggle config={columnConfig} onChange={handleColumnConfigChange} compact />
          )}
        </div>
        {/* Right zone — panel toggles */}
        <div className="flex items-center gap-0">
          <div ref={toolbarSlotRef} className="w-8 h-8 flex-shrink-0" />
          <ToolbarButton icon={Users} label="" onClick={() => setShowCharacters(true)} />
          <ToolbarButton icon={MapPin} label="" onClick={() => setShowLocations(true)} />
          <ToolbarButton icon={Hash} label="" onClick={() => setShowTags(true)} />
          <ToolbarButton icon={Paintbrush} label="" onClick={() => setShowStyle(true)} />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Scene sidebar — always flush left */}
        <div
          className={`flex-shrink-0 h-full border-r border-admin-border bg-admin-bg-sidebar overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showSidebar ? 'w-48' : 'w-0'}`}
        >
          <ScriptSceneSidebar
            scenes={computedScenes}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
            onAddScene={handleAddScene}
            onReorderScenes={handleReorderScenes}
            onDeleteScene={handleDeleteScene}
            scratchpadMode={contentMode === 'scratchpad'}
            scratchScenes={scratchScenes}
            onScrollToScene={(label, sceneIndex) => scratchPadRef.current?.scrollToScene(label, sceneIndex)}
          />
        </div>

        {/* Main editor — constrained by container width toggle */}
        <div className="flex-1 min-w-0 min-h-0 h-full">
          <div className={`h-full flex flex-col transition-[max-width,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] border-l border-r ${containerIdx > 0 ? `${CONTAINER_WIDTHS[containerIdx]} mx-auto border-admin-border` : 'border-transparent'}`}>
            {contentMode === 'table' ? (
              <ScriptEditorCanvas
                scenes={computedScenes}
                columnConfig={columnConfig}
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
                onFrameGenerated={handleFrameChange}
                activeSceneId={activeSceneId}
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
                toolbarPortalRef={toolbarSlotRef}
                onReorderScenes={handleReorderScenes}
              />
            ) : (
              <ScriptScratchPad
                ref={scratchPadRef}
                scriptId={script.id}
                initialContent={scratchContent}
                characters={characters}
                tags={tags}
                locations={locations}
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
        scriptId={script.id}
        characters={characters}
        beats={beats}
        onCharactersChange={setCharacters}
        castMap={castMap}
        onCastMapChange={setCastMap}
      />
      <ScriptTagsPanel
        open={showTags}
        onClose={() => setShowTags(false)}
        scriptId={script.id}
        tags={tags}
        onTagsChange={setTags}
      />
      <ScriptLocationsPanel
        open={showLocations}
        onClose={() => setShowLocations(false)}
        scriptId={script.id}
        locations={locations}
        scenes={scenes}
        onLocationsChange={setLocations}
        globalLocations={globalLocations}
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
      <ScriptExtractModal
        open={showExtractModal}
        onClose={() => setShowExtractModal(false)}
        scriptId={script.id}
        scratchContent={scratchContent}
        existingCharacters={characters}
        existingLocations={locations}
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
