'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Settings, Users, Hash, MapPin, Save, Loader2, CopyPlus, ChevronRight, ChevronDown, Expand } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateScript, createScene, updateScene, deleteScene, reorderScenes,
  createBeat, updateBeat, deleteBeat, reorderBeats,
  createScriptVersion, getScriptVersions,
  uploadBeatReference, deleteBeatReference,
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
import { ScriptFocusMode } from './ScriptFocusMode';
import type {
  ScriptRow, ScriptSceneRow, ScriptBeatRow,
  ScriptCharacterRow, ScriptTagRow, ScriptLocationRow,
  ScriptColumnConfig, ScriptBeatReferenceRow,
} from '@/types/scripts';

interface Props {
  script: ScriptRow & { project?: { id: string; title: string } | null };
  initialScenes: ScriptSceneRow[];
  initialBeats: ScriptBeatRow[];
  initialCharacters: ScriptCharacterRow[];
  initialTags: ScriptTagRow[];
  initialLocations: ScriptLocationRow[];
  initialReferences: ScriptBeatReferenceRow[];
}

/** Rainbow version pill colors — cycles red → orange → yellow → green → cyan → blue → violet */
const VERSION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
];
function versionColor(version: number): string {
  return VERSION_COLORS[(version - 1) % VERSION_COLORS.length];
}

export function ScriptEditorClient({
  script: initialScript,
  initialScenes,
  initialBeats,
  initialCharacters,
  initialTags,
  initialLocations,
  initialReferences,
}: Props) {
  const [script, setScript] = useState(initialScript);
  const [scenes, setScenes] = useState(initialScenes);
  const [beats, setBeats] = useState(initialBeats);
  const [characters, setCharacters] = useState(initialCharacters);
  const [tags, setTags] = useState(initialTags);
  const [locations, setLocations] = useState(initialLocations);
  const [references, setReferences] = useState(initialReferences);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(scenes[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [focusTransition, setFocusTransition] = useState<'idle' | 'pushing-out' | 'bringing-in' | 'active' | 'pushing-focus-out' | 'bringing-back'>('idle');
  const [versioning, setVersioning] = useState(false);
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; status: string; created_at: string }[]>([]);
  const router = useRouter();

  const defaultColumns: ScriptColumnConfig = { audio: true, visual: true, notes: false, reference: false };
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
    const existing = saveTimers.current.get(beatId);
    if (existing) clearTimeout(existing);
    saveTimers.current.set(beatId, setTimeout(async () => {
      await updateBeat(beatId, { [field]: value });
      saveTimers.current.delete(beatId);
    }, 1500));
  }, []);

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

  // ── Save all (flush pending beat debounces + touch updated_at) ──
  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      for (const [beatId, timer] of saveTimers.current.entries()) {
        clearTimeout(timer);
        const beat = beats.find(b => b.id === beatId);
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
    } finally {
      setSaving(false);
    }
  }, [beats, script.id]);

  // ── Auto-save: flush pending changes every 30 seconds ──
  const handleSaveAllRef = useRef(handleSaveAll);
  handleSaveAllRef.current = handleSaveAll;

  useEffect(() => {
    const interval = setInterval(() => {
      if (saveTimers.current.size > 0) {
        handleSaveAllRef.current();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

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
          onShowSettings={() => setShowSettings(true)}
          onNewVersion={handleNewVersion}
          onSave={handleSaveAll}
          saving={saving}
          versioning={versioning}
          scriptVersion={script.version}
          scriptStatus={script.status}
          exiting={focusTransition === 'pushing-focus-out'}
          onExit={exitFocusMode}
        />
      )}

      {/* Header + Toolbar — slides up when entering focus, down when returning */}
      <div className={`relative z-20 flex-shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${uiOut ? '-translate-y-full' : 'translate-y-0'}`}>
      <AdminPageHeader
        title=""
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
                  style={{ borderColor: versionColor(script.version) + '40', backgroundColor: versionColor(script.version) + '15', color: versionColor(script.version) }}
                >
                  v{String(script.version).padStart(2, '0')}
                  <ChevronDown size={10} />
                </button>
                {versionPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setVersionPickerOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl min-w-[180px] py-1 animate-dropdown-in">
                      {versions.map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setVersionPickerOpen(false);
                            if (v.id !== script.id) router.push(`/admin/scripts/${v.id}`);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                            v.id === script.id
                              ? 'bg-admin-bg-active text-admin-text-primary'
                              : 'text-admin-text-secondary hover:bg-admin-bg-hover'
                          }`}
                        >
                          <span
                            className="font-mono font-bold px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ backgroundColor: versionColor(v.version) + '20', color: versionColor(v.version) }}
                          >
                            v{String(v.version).padStart(2, '0')}
                          </span>
                          <span className="text-admin-text-ghost">{new Date(v.created_at).toLocaleDateString()}</span>
                        </button>
                      ))}
                      {versions.length === 0 && (
                        <div className="px-3 py-2 text-xs text-admin-text-faint">Loading...</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* Status pill */}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize border ${
                script.status === 'locked' ? 'border-admin-success-border bg-admin-success-bg text-admin-success'
                  : script.status === 'review' ? 'border-admin-info-border bg-admin-info-bg text-admin-info'
                  : 'border-admin-border bg-admin-bg-active text-admin-text-secondary'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  script.status === 'locked' ? 'bg-admin-success'
                    : script.status === 'review' ? 'bg-admin-info'
                    : 'bg-admin-text-faint'
                }`} />
                {script.status}
              </span>
            </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCharacters(true)}
              className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
            >
              <Users size={14} />
              Characters
            </button>
            <button
              onClick={() => setShowLocations(true)}
              className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
            >
              <MapPin size={14} />
              Locations
            </button>
            <button
              onClick={() => setShowTags(true)}
              className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
            >
              <Hash size={14} />
              Tags
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary p-2"
              title="Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={handleNewVersion}
              disabled={versioning}
              className="btn-secondary p-2"
              title="New version"
            >
              {versioning ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} />}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="btn-primary px-4 py-1.5 text-sm flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        }
      />

      {/* Toolbar row — focus + sidebar toggle (left) + column toggles (right) */}
      <div className="flex-shrink-0 h-[3rem] flex items-center justify-between px-4 border-b border-admin-border bg-admin-bg-inset">
        <div className="flex items-center gap-1">
          <button
            onClick={enterFocusMode}
            className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors"
            title="Focus mode"
          >
            <Expand size={16} />
          </button>
          <button
            onClick={() => setShowSidebar(prev => !prev)}
            className="text-admin-text-muted hover:text-admin-text-primary p-1.5 rounded hover:bg-admin-bg-hover transition-colors"
            title={showSidebar ? 'Hide scenes' : 'Show scenes'}
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>
        <ScriptColumnToggle config={columnConfig} onChange={handleColumnConfigChange} />
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

        {/* Main editor canvas — gentle upward shift + fades */}
        <div className={`flex-1 min-w-0 min-h-0 h-full flex flex-col transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${uiOut ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <ScriptEditorCanvas
            scenes={computedScenes}
            columnConfig={columnConfig}
            columnFractions={columnFractions}
            onColumnFractionsChange={setColumnFractions}
            characters={characters}
            tags={tags}
            locations={locations}
            references={refsByBeat}
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
          />
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
      />
      <ScriptSettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        script={script}
        onScriptChange={setScript}
      />
    </div>
  );
}
