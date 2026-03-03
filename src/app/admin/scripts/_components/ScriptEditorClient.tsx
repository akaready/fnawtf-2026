'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Settings, Users, Hash, MapPin, Save, Loader2, CopyPlus, ChevronRight, ChevronDown, Expand, Paintbrush, Upload, StickyNote, Table2, X } from 'lucide-react';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateScript, createScene, updateScene, deleteScene, reorderScenes,
  createBeat, updateBeat, deleteBeat, reorderBeats,
  createScriptVersion, publishScriptVersion, getScriptVersions,
  uploadBeatReference, deleteBeatReference,
  getScriptStyle, getStyleReferences, getStoryboardFrames,
  getScriptCastMap, saveScratchContent, createModeVersion,
} from '@/app/admin/actions';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
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
import { ScriptFocusMode } from './ScriptFocusMode';
import { ScriptScratchPad } from './ScriptScratchPad';
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
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [focusTransition, setFocusTransition] = useState<'idle' | 'pushing-out' | 'bringing-in' | 'active' | 'pushing-focus-out' | 'bringing-back'>('idle');
  const [versioning, setVersioning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; status: string; created_at: string; major_version: number; minor_version: number; is_published: boolean; content_mode?: string }[]>([]);
  const [contentMode, setContentMode] = useState<ContentMode>(initialScript.content_mode ?? 'table');
  const [scratchContent, setScratchContent] = useState(initialScript.scratch_content ?? '');
  const [showExtractModal, setShowExtractModal] = useState(false);
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

  // ── Publish (create client-visible version) ──
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      await handleSaveAll();
      const newId = await publishScriptVersion(script.id);
      router.push(`/admin/scripts/${newId}`);
    } finally {
      setPublishing(false);
    }
  }, [handleSaveAll, script.id, router]);

  // ── Focus mode transition ──
  // ENTER: Everything exits simultaneously, then mount focus mode
  // EXIT:  Focus UI out → everything returns simultaneously
  const enterFocusMode = useCallback(() => {
    document.querySelector('.admin-shell')?.classList.add('focus-push');
    setFocusTransition('pushing-out');
    setTimeout(() => {
      setShowFocusMode(true);
      setFocusTransition('bringing-in');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFocusTransition('active');
        });
      });
    }, 700);
  }, []);

  const exitFocusMode = useCallback(() => {
    setFocusTransition('pushing-focus-out');
    setTimeout(() => {
      setShowFocusMode(false);
      document.querySelector('.admin-shell')?.classList.remove('focus-push');
      setFocusTransition('bringing-back');
      setTimeout(() => {
        setFocusTransition('idle');
      }, 700);
    }, 500);
  }, []);

  // Derived animation states — everything moves together
  const uiOut = focusTransition === 'pushing-out' || focusTransition === 'bringing-in' || focusTransition === 'active' || focusTransition === 'pushing-focus-out';

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Focus mode overlay */}
      {showFocusMode && (
        <ScriptFocusMode
          scenes={computedScenes}
          columnConfig={columnConfig}
          onColumnConfigChange={handleColumnConfigChange}
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
          onUpdateBeat={handleUpdateBeat}
          onDeleteBeat={handleDeleteBeat}
          onAddBeat={handleAddBeat}
          onAddScene={handleAddScene}
          onReorderBeats={handleReorderBeats}
          onUploadReference={handleUploadReference}
          onDeleteReference={handleDeleteReference}
          onUpdateScene={handleUpdateScene}
          onDeleteScene={handleDeleteScene}
          onShowCharacters={() => setShowCharacters(true)}
          onShowTags={() => setShowTags(true)}
          onShowLocations={() => setShowLocations(true)}
          onShowStyle={() => setShowStyle(true)}
          onShowSettings={() => setShowSettings(true)}
          onPublish={handlePublish}
          onNewVersion={handleNewVersion}
          onSave={handleSaveAll}
          publishing={publishing}
          versioning={versioning}
          scriptMajorVersion={script.major_version}
          scriptMinorVersion={script.minor_version}
          scriptIsPublished={script.is_published}
          exiting={focusTransition === 'pushing-focus-out'}
          onExit={exitFocusMode}
          castMap={castMap}
        />
      )}

      {/* Header + Toolbar — slides up when entering focus, down when returning */}
      <div className={`relative z-20 flex-shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${uiOut ? '-translate-y-full' : 'translate-y-0'}`}>
      <AdminPageHeader
        title=""
        icon={contentMode === 'scratchpad' ? StickyNote : Table2}
        topContent={
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
        }
        leftContent={
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-admin-text-primary">
                {script.title}
              </h1>
              {/* Version picker */}
              <div className="relative">
                <button
                  onClick={() => setVersionPickerOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-full border transition-colors"
                  style={{ borderColor: versionColor(script.major_version) + '40', backgroundColor: versionColor(script.major_version) + '15', color: versionColor(script.major_version) }}
                >
                  {formatScriptVersion(script.major_version, script.minor_version, script.is_published)}
                  <ChevronDown size={10} />
                </button>
                {versionPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setVersionPickerOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl min-w-[220px] py-1 animate-dropdown-in">
                      {versions.map(v => (
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
                          } ${!v.is_published ? 'pl-6' : ''}`}
                        >
                          <span
                            className="font-mono font-bold px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ backgroundColor: versionColor(v.major_version) + '20', color: versionColor(v.major_version) }}
                          >
                            {formatScriptVersion(v.major_version, v.minor_version, v.is_published)}
                          </span>
                          {v.content_mode === 'scratchpad' ? <StickyNote size={11} className="text-admin-text-faint" /> : <Table2 size={11} className="text-admin-text-faint" />}
                          {v.is_published && (
                            <span className="text-[10px] font-medium text-admin-success">Published</span>
                          )}
                          <span className="text-admin-text-ghost ml-auto">{new Date(v.created_at).toLocaleDateString()}</span>
                        </button>
                      ))}
                      {versions.length === 0 && (
                        <div className="px-3 py-2 text-xs text-admin-text-faint">Loading...</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* Draft / Published pill */}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                script.is_published
                  ? 'border-admin-success-border bg-admin-success-bg text-admin-success'
                  : 'border-admin-border bg-admin-bg-active text-admin-text-secondary'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  script.is_published ? 'bg-admin-success' : 'bg-admin-text-faint'
                }`} />
                {script.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            <SaveDot status={autoSave.status} />
            <button
              onClick={handlePublish}
              disabled={publishing || script.is_published}
              className="btn-ghost p-2"
              title={script.is_published ? 'Already published' : 'Publish version'}
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            </button>
            <button
              onClick={handleNewVersion}
              disabled={versioning}
              className="btn-ghost p-2"
              style={{ color: versionColor(script.major_version) }}
              title="New version"
            >
              {versioning ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} />}
            </button>
            <button onClick={() => setShowSettings(true)} className="btn-secondary p-2" title="Settings">
              <Settings size={14} />
            </button>
            {contentMode === 'scratchpad' && scratchContent.trim() && (
              <button
                onClick={() => setShowExtractModal(true)}
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
              >
                Extract to Scenes
              </button>
            )}
            <button
              onClick={handleSaveAll}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Save size={13} />
              Save
            </button>
          </div>
        }
      />

      {/* Toolbar row — 3-zone: left (sidebar+focus), center (column toggles), right (panels) */}
      <div className="flex-shrink-0 h-[3rem] flex items-center px-4 border-b border-admin-border bg-admin-bg-inset">
        {/* Left zone — mode-conditional */}
        <div className="flex items-center gap-1">
          {contentMode === 'table' ? (
            <>
              <button
                onClick={() => setShowSidebar(prev => !prev)}
                className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors"
                title={showSidebar ? 'Hide scenes' : 'Show scenes'}
              >
                {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
              <button
                onClick={enterFocusMode}
                className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors"
                title="Focus mode"
              >
                <Expand size={16} />
              </button>
              <button
                onClick={handleModeSwitch}
                className="text-admin-toolbar-yellow hover:bg-admin-bg-hover p-1.5 rounded transition-colors"
                title="Convert to Scratchpad"
              >
                <StickyNote size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowExtractModal(true)}
                disabled={!scratchContent.trim()}
                className="text-admin-toolbar-yellow p-1.5 rounded transition-colors hover:bg-admin-bg-hover disabled:opacity-40 disabled:cursor-not-allowed"
                title="Convert to Table"
              >
                <Table2 size={16} />
              </button>
              <div className="flex items-center gap-3 ml-2 border-l border-admin-border pl-3">
                <span className="text-admin-text-faint text-admin-xs"><strong className="text-admin-text-muted">**bold**</strong></span>
                <span className="text-admin-text-faint text-admin-xs"><strong className="text-admin-text-muted">@</strong> characters</span>
                <span className="text-admin-text-faint text-admin-xs"><strong className="text-admin-text-muted">#</strong> tags</span>
              </div>
            </>
          )}
        </div>
        {/* Center zone */}
        <div className="flex-1 flex justify-center items-center gap-4">
          <div ref={toolbarSlotRef} />
          {contentMode === 'table' && (
            <ScriptColumnToggle config={columnConfig} onChange={handleColumnConfigChange} />
          )}
        </div>
        {/* Right zone — panel toggles */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowCharacters(true)} className="p-1.5 rounded transition-colors text-admin-toolbar-blue hover:bg-admin-bg-hover" title="Characters">
            <Users size={16} />
          </button>
          <button onClick={() => setShowLocations(true)} className="p-1.5 rounded transition-colors text-admin-toolbar-green hover:bg-admin-bg-hover" title="Locations">
            <MapPin size={16} />
          </button>
          <button onClick={() => setShowTags(true)} className="p-1.5 rounded transition-colors text-admin-toolbar-orange hover:bg-admin-bg-hover" title="Tags">
            <Hash size={16} />
          </button>
          <button onClick={() => setShowStyle(true)} className="p-1.5 rounded transition-colors text-admin-toolbar-violet hover:bg-admin-bg-hover" title="Style">
            <Paintbrush size={16} />
          </button>
        </div>
      </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Scene sidebar — border attached, slides left together */}
        <div
          className={`flex-shrink-0 h-full border-r border-admin-border bg-admin-bg-sidebar transition-[width,transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${uiOut ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'} ${showSidebar ? 'w-48' : 'w-0'}`}
        >
          <ScriptSceneSidebar
            scenes={computedScenes}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
            onAddScene={handleAddScene}
            onReorderScenes={handleReorderScenes}
            onDeleteScene={handleDeleteScene}
          />
        </div>

        {/* Main editor — gentle upward shift + fades */}
        <div className={`flex-1 min-w-0 min-h-0 h-full flex flex-col transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${uiOut ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'}`}>
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
            />
          ) : (
            <ScriptScratchPad
              scriptId={script.id}
              initialContent={scratchContent}
              characters={characters}
              tags={tags}
              locations={locations}
              onContentChange={handleScratchChange}
            />
          )}
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
