'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, Trash2, Check, Plus, ImageIcon, Info, Undo2, Redo2, Wand2 } from 'lucide-react';
import { getFrameHistoryForBeat, setActiveFrame, deleteStoryboardFrame } from '@/app/admin/actions';
import { buildRichPrompt } from './storyboardUtils';
import { STYLE_PRESETS } from '@/lib/scripts/stylePresets';
import type {
  ScriptStoryboardFrameRow,
  ScriptStyleRow,
  ScriptStyleReferenceRow,
  StoryboardStylePreset,
  ComputedScene,
  ScriptCharacterRow,
  ScriptLocationRow,
  CharacterCastWithContact,
  CharacterReferenceRow,
  LocationReferenceRow,
  StoryboardReferenceUsed,
} from '@/types/scripts';

// ── Helpers ──

const PURPOSE_LABELS: Record<string, string> = {
  style: 'Style',
  cast: 'Cast',
  location: 'Location',
  beat: 'Beat',
  consistency: 'Consistency',
};

function groupByPurpose(refs: StoryboardReferenceUsed[]) {
  const groups: Record<string, StoryboardReferenceUsed[]> = {};
  for (const r of refs) {
    (groups[r.purpose] ??= []).push(r);
  }
  return groups;
}

function formatLA(date: string) {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }),
  };
}

// ── Types ──

type ModalTab = 'generate' | 'modify';

interface Props {
  onClose: () => void;
  beatId: string;
  sceneId: string;
  scriptId: string;
  activeFrame: ScriptStoryboardFrameRow | null;
  audioContent: string;
  visualContent: string;
  notesContent: string;
  beatReferenceUrls: string[];
  style: ScriptStyleRow | null;
  styleReferences: ScriptStyleReferenceRow[];
  scene: ComputedScene;
  beatIndex: number;
  characters: ScriptCharacterRow[];
  locations: ScriptLocationRow[];
  castMap?: Record<string, CharacterCastWithContact[]>;
  referenceMap?: Record<string, CharacterReferenceRow[]>;
  locationReferenceMap?: Record<string, LocationReferenceRow[]>;
  sceneFrames?: { imageUrl: string; label: string; filename: string }[];
  consistencyFrameUrls?: string[];
  onFrameChange: (frame: ScriptStoryboardFrameRow | null) => void;
}

export function StoryboardGenerateModal({
  onClose,
  beatId,
  sceneId: _sceneId,
  scriptId,
  activeFrame,
  audioContent,
  visualContent,
  beatReferenceUrls,
  style,
  styleReferences,
  scene,
  beatIndex,
  characters,
  locations,
  castMap,
  referenceMap,
  locationReferenceMap,
  sceneFrames: _sceneFrames,
  consistencyFrameUrls,
  onFrameChange,
}: Props) {
  // ── Core state ──
  const [activeTab, setActiveTab] = useState<ModalTab>('generate');
  const [history, setHistory] = useState<ScriptStoryboardFrameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(activeFrame?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [localPrompt, setLocalPrompt] = useState('');
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [localReferences, setLocalReferences] = useState<StoryboardReferenceUsed[]>(() => {
    // Pre-populate from props so references show immediately even before history loads
    const refs: StoryboardReferenceUsed[] = [];
    for (const r of styleReferences) refs.push({ url: r.image_url, purpose: 'style' });
    for (const url of beatReferenceUrls) refs.push({ url, purpose: 'beat' });
    if (consistencyFrameUrls) {
      for (const url of consistencyFrameUrls) refs.push({ url, purpose: 'consistency' });
    }
    return refs;
  });
  const [localStylePreset, setLocalStylePreset] = useState<StoryboardStylePreset | null>(style?.style_preset ?? null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showModifyInfo, setShowModifyInfo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Undo/Redo for content prompt ──
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [promptFuture, setPromptFuture] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPromptRef = useRef('');

  const pushPromptHistory = useCallback((oldValue: string) => {
    if (oldValue === lastSavedPromptRef.current) return;
    lastSavedPromptRef.current = oldValue;
    setPromptHistory(prev => [...prev, oldValue]);
    setPromptFuture([]);
  }, []);

  const handlePromptChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const currentVal = localPrompt;
    debounceRef.current = setTimeout(() => pushPromptHistory(currentVal), 500);
    setLocalPrompt(value);
  }, [localPrompt, pushPromptHistory]);

  const handleUndo = useCallback(() => {
    if (promptHistory.length === 0) return;
    setPromptFuture(prev => [localPrompt, ...prev]);
    const prev = [...promptHistory];
    const last = prev.pop()!;
    setPromptHistory(prev);
    setLocalPrompt(last);
    lastSavedPromptRef.current = last;
  }, [promptHistory, localPrompt]);

  const handleRedo = useCallback(() => {
    if (promptFuture.length === 0) return;
    setPromptHistory(prev => [...prev, localPrompt]);
    const future = [...promptFuture];
    const next = future.shift()!;
    setPromptFuture(future);
    setLocalPrompt(next);
    lastSavedPromptRef.current = next;
  }, [promptFuture, localPrompt]);

  // Fall back to activeFrame prop if not found in history (e.g., history fetch failed)
  const selectedFrame = history.find(f => f.id === selectedFrameId) ?? activeFrame;

  // ── Build initial references from cell props ──
  const buildInitialReferences = useCallback((): StoryboardReferenceUsed[] => {
    const refs: StoryboardReferenceUsed[] = [];
    for (const r of styleReferences) refs.push({ url: r.image_url, purpose: 'style' });

    const beat = scene.beats[beatIndex];
    if (beat && (castMap || referenceMap)) {
      const mentionPattern = /\]\(([0-9a-f-]{36})\)/g;
      const beatText = `${beat.audio_content} ${beat.visual_content} ${beat.notes_content}`;
      const mentionedCharIds = new Set<string>();
      let m;
      while ((m = mentionPattern.exec(beatText)) !== null) mentionedCharIds.add(m[1]);
      for (const charId of mentionedCharIds) {
        const char = characters.find(c => c.id === charId);
        if (char?.cast_mode === 'references') {
          (referenceMap?.[charId] ?? []).slice(0, 2).forEach(r => refs.push({ url: r.image_url, purpose: 'cast' }));
        } else {
          const featured = castMap?.[charId]?.find(c => c.is_featured);
          if (featured?.contact.headshot_url) refs.push({ url: featured.contact.headshot_url, purpose: 'cast' });
        }
      }
    }

    const loc = locations.find(l => l.id === scene.location_id);
    if (loc?.location_mode === 'references' && scene.location_id) {
      (locationReferenceMap?.[scene.location_id] ?? []).slice(0, 2)
        .forEach((r: LocationReferenceRow) => refs.push({ url: r.image_url, purpose: 'location' }));
    }

    for (const url of beatReferenceUrls) refs.push({ url, purpose: 'beat' });

    if (consistencyFrameUrls) {
      for (const url of consistencyFrameUrls) refs.push({ url, purpose: 'consistency' });
    }

    return refs;
  }, [styleReferences, scene, beatIndex, castMap, referenceMap, characters, locations, locationReferenceMap, beatReferenceUrls, consistencyFrameUrls]);

  // ── Build initial prompt ──
  const buildInitialPrompt = useCallback((): string => {
    const beat = scene.beats[beatIndex];
    if (beat) return buildRichPrompt(beat, beatIndex, scene, characters, locations, castMap, referenceMap);
    return [audioContent && `Audio: ${audioContent}`, visualContent && `Visual: ${visualContent}`]
      .filter(Boolean).join('\n') || 'Empty beat — generate a neutral establishing shot';
  }, [scene, beatIndex, characters, locations, castMap, referenceMap, audioContent, visualContent]);

  // ── Load history on mount ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const initFromFrame = (sel: ScriptStoryboardFrameRow | null) => {
      if (sel?.prompt_used) {
        try {
          const parsed = JSON.parse(sel.prompt_used);
          const content = parsed?.scene?.content ?? buildInitialPrompt();
          setLocalPrompt(content);
          lastSavedPromptRef.current = content;
        } catch {
          const content = buildInitialPrompt();
          setLocalPrompt(content);
          lastSavedPromptRef.current = content;
        }
      } else {
        const content = buildInitialPrompt();
        setLocalPrompt(content);
        lastSavedPromptRef.current = content;
      }
      const refs = sel?.reference_urls_used?.length
        ? sel.reference_urls_used
        : buildInitialReferences();
      setLocalReferences(refs);
    };

    getFrameHistoryForBeat(beatId).then((data) => {
      if (cancelled) return;

      // If fetch returned empty but we have an activeFrame prop, seed history with it
      const frames = data.length > 0 ? data : (activeFrame ? [activeFrame] : []);
      setHistory(frames);

      const active = frames.find(f => f.is_active);
      const sel = active ?? frames[0] ?? null;
      setSelectedFrameId(sel?.id ?? null);
      initFromFrame(sel);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        // Seed from activeFrame prop on fetch failure
        const frames = activeFrame ? [activeFrame] : [];
        setHistory(frames);
        setSelectedFrameId(activeFrame?.id ?? null);
        initFromFrame(activeFrame);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [beatId, activeFrame, buildInitialPrompt, buildInitialReferences]);

  // ── Keyboard: Escape to close ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !generating) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, generating]);

  // ── Generate (generation mode) ──
  const handleGenerate = useCallback(async () => {
    if (generating || !style) return;
    setGenerating(true);
    try {
      const styleUrls = localReferences.filter(r => r.purpose === 'style').map(r => r.url);
      const castUrls = localReferences.filter(r => r.purpose === 'cast').map(r => r.url);
      const locUrls = localReferences.filter(r => r.purpose === 'location').map(r => r.url);
      const beatUrls = localReferences.filter(r => r.purpose === 'beat').map(r => r.url);
      const consUrls = localReferences.filter(r => r.purpose === 'consistency').map(r => r.url);

      const res = await fetch('/api/admin/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          beatId,
          contentPrompt: buildInitialPrompt(),
          promptOverride: localPrompt,
          stylePrompt: style.prompt,
          stylePreset: localStylePreset ?? style.style_preset,
          aspectRatio: style.aspect_ratio,
          referenceImageUrls: styleUrls,
          castReferenceUrls: castUrls,
          locationReferenceUrls: locUrls,
          beatReferenceUrls: beatUrls,
          consistencyFrameUrls: consUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.frame) {
          const newFrame = data.frame as ScriptStoryboardFrameRow;
          setHistory(prev => [newFrame, ...prev.map(f => f.is_active ? { ...f, is_active: false } : f)]);
          setSelectedFrameId(newFrame.id);
          onFrameChange(newFrame);
        }
      }
    } finally {
      setGenerating(false);
    }
  }, [generating, style, localPrompt, localStylePreset, localReferences, scriptId, beatId, buildInitialPrompt, onFrameChange]);

  // ── Generate (modification mode) ──
  const handleModify = useCallback(async () => {
    if (generating || !selectedFrame) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          beatId,
          contentPrompt: '',
          stylePrompt: '',
          aspectRatio: style?.aspect_ratio ?? '16:9',
          modifyMode: true,
          modifyImageUrl: selectedFrame.image_url,
          promptOverride: modifyPrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.frame) {
          const newFrame = data.frame as ScriptStoryboardFrameRow;
          setHistory(prev => [newFrame, ...prev.map(f => f.is_active ? { ...f, is_active: false } : f)]);
          setSelectedFrameId(newFrame.id);
          onFrameChange(newFrame);
        }
      }
    } finally {
      setGenerating(false);
    }
  }, [generating, selectedFrame, modifyPrompt, scriptId, beatId, style, onFrameChange]);

  // ── Select a historical frame as active ──
  const handleUseFrame = useCallback(async (frameId: string) => {
    try {
      await setActiveFrame(frameId, beatId);
      setHistory(prev => prev.map(f => ({ ...f, is_active: f.id === frameId, slot: f.id === frameId ? 1 : null })));
      setSelectedFrameId(frameId);
      const frame = history.find(f => f.id === frameId);
      if (frame) onFrameChange({ ...frame, is_active: true, slot: 1 });
    } catch (err) {
      console.error('Failed to set active frame:', err);
    }
  }, [beatId, history, onFrameChange]);

  // ── Delete a frame from history ──
  const handleDeleteFrame = useCallback(async (frameId: string) => {
    try {
      await deleteStoryboardFrame(frameId);
      setHistory(prev => {
        const updated = prev.filter(f => f.id !== frameId);
        if (selectedFrameId === frameId) {
          const next = updated[0] ?? null;
          setSelectedFrameId(next?.id ?? null);
          if (prev.find(f => f.id === frameId)?.is_active && next) {
            onFrameChange(next.is_active ? next : null);
          }
        }
        return updated;
      });
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete frame:', err);
    }
  }, [selectedFrameId, onFrameChange]);

  // ── Click a history thumbnail to preview ──
  const handleSelectFrame = useCallback((frame: ScriptStoryboardFrameRow) => {
    setSelectedFrameId(frame.id);
    if (frame.prompt_used) {
      try {
        const parsed = JSON.parse(frame.prompt_used);
        const content = parsed?.scene?.content ?? buildInitialPrompt();
        setLocalPrompt(content);
        lastSavedPromptRef.current = content;
      } catch {
        const content = buildInitialPrompt();
        setLocalPrompt(content);
        lastSavedPromptRef.current = content;
      }
    }
    const refs = frame.reference_urls_used?.length
      ? frame.reference_urls_used
      : buildInitialReferences();
    setLocalReferences(refs);
    setPromptHistory([]);
    setPromptFuture([]);
  }, [buildInitialPrompt, buildInitialReferences]);

  // ── Remove / add reference ──
  const handleRemoveRef = useCallback((url: string) => {
    setLocalReferences(prev => prev.filter(r => r.url !== url));
  }, []);

  const handleAddRefFile = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('file', files[0]);
    try {
      const { uploadStyleReference, getScriptStyle } = await import('@/app/admin/actions');
      const scriptStyle = await getScriptStyle(scriptId);
      if (!scriptStyle) return;
      const ref = await uploadStyleReference(scriptStyle.id, formData);
      setLocalReferences(prev => [...prev, { url: ref.image_url, purpose: 'beat' }]);
    } catch (err) {
      console.error('Failed to upload reference:', err);
    }
  }, [scriptId]);

  // ── Save selection and close ──
  const handleSaveAndClose = useCallback(async () => {
    // If the selected frame isn't already the active one, make it active
    if (selectedFrame && !selectedFrame.is_active) {
      await handleUseFrame(selectedFrame.id);
    }
    onClose();
  }, [selectedFrame, handleUseFrame, onClose]);

  // ── Derived ──
  const refGroups = groupByPurpose(localReferences);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={() => !generating && onClose()}
    >
      <div
        className="bg-admin-bg-overlay border border-admin-border rounded-admin-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header: Tab strip + close ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-admin-border bg-admin-bg-sidebar flex-shrink-0 rounded-t-admin-xl">
          <div className="flex items-center gap-1">
            {([
              { id: 'generate' as ModalTab, label: 'Generate', icon: Sparkles },
              { id: 'modify' as ModalTab, label: 'Modify', icon: Wand2 },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 ${
                  activeTab === id
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center" title="Close">
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-admin-text-ghost" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* ── Left column ── */}
            <div className="flex-1 overflow-y-auto admin-scrollbar-auto px-6 py-5 space-y-5">
              {/* Image preview */}
              <div>
                {selectedFrame ? (
                  <img
                    src={selectedFrame.image_url}
                    alt=""
                    className="w-full rounded-admin-md border border-admin-border"
                  />
                ) : (
                  <div className="aspect-video rounded-admin-md border border-dashed border-admin-border-subtle bg-admin-bg-base flex items-center justify-center">
                    <div className="text-center text-admin-text-faint">
                      <ImageIcon size={24} className="mx-auto mb-2 opacity-40" />
                      <p className="text-admin-sm">No image generated yet</p>
                    </div>
                  </div>
                )}
              </div>

              {activeTab === 'generate' ? (
                <>
                  {/* Style selector strip */}
                  <div>
                    <label className="admin-label">Style</label>
                    <div className="grid grid-cols-8 gap-2 p-1 -m-1">
                      {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => setLocalStylePreset(key as StoryboardStylePreset)}
                          className={`rounded-admin-sm overflow-hidden border transition-all ${
                            localStylePreset === key
                              ? 'ring-2 ring-[var(--admin-accent)] border-transparent'
                              : 'border-admin-border hover:border-admin-text-muted'
                          }`}
                          title={preset.label}
                        >
                          <img src={preset.image} alt={preset.label} className="w-full aspect-video object-cover" />
                          <p className="text-admin-sm text-admin-text-muted text-center py-1 truncate px-1">
                            {preset.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content prompt with undo/redo */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="admin-label mb-0">Content Prompt</label>
                      <div className="flex items-center gap-1">
                        <button onClick={handleUndo} disabled={promptHistory.length === 0}
                          className="btn-ghost w-7 h-7 flex items-center justify-center disabled:opacity-30" title="Undo">
                          <Undo2 size={12} />
                        </button>
                        <button onClick={handleRedo} disabled={promptFuture.length === 0}
                          className="btn-ghost w-7 h-7 flex items-center justify-center disabled:opacity-30" title="Redo">
                          <Redo2 size={12} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={localPrompt}
                      onChange={(e) => handlePromptChange(e.target.value)}
                      onBlur={() => pushPromptHistory(localPrompt)}
                      className="admin-input admin-scrollbar w-full text-admin-sm font-admin-mono min-h-[160px] max-h-[300px]"
                    />
                  </div>

                  {/* Reference images */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="admin-label mb-0">Reference Images</label>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="btn-ghost-add w-7 h-7 flex items-center justify-center"
                        title="Add reference image"
                      >
                        <Plus size={12} />
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAddRefFile(e.target.files)}
                      />
                    </div>

                    {Object.keys(refGroups).length === 0 ? (
                      <p className="text-admin-sm text-admin-text-faint">No reference images</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(refGroups).map(([purpose, refs]) => (
                          <div key={purpose}>
                            <p className="text-admin-sm text-admin-text-muted mb-1.5">{PURPOSE_LABELS[purpose] ?? purpose}</p>
                            <div className="flex flex-wrap gap-2">
                              {refs.map((ref, i) => (
                                <div key={`${ref.url}-${i}`} className="group/ref relative w-16 h-16">
                                  <img
                                    src={ref.url}
                                    alt=""
                                    className="w-full h-full object-cover rounded-admin-sm border border-admin-border"
                                  />
                                  <button
                                    onClick={() => handleRemoveRef(ref.url)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-admin-danger text-white opacity-0 group-hover/ref:opacity-100 transition-opacity"
                                    title="Remove"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generate action */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !style}
                    className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2 w-full justify-center"
                  >
                    {generating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </>
              ) : (
                /* ── Modify tab content ── */
                <>
                  {!selectedFrame && (
                    <div className="bg-admin-warning/10 border border-admin-warning/30 rounded-admin-md px-4 py-3">
                      <p className="text-admin-sm text-admin-warning">Select or generate an image first to use modification mode.</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="admin-label mb-0">Modification Prompt</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowModifyInfo(!showModifyInfo)}
                          className="btn-ghost w-6 h-6 flex items-center justify-center"
                          title="How to use"
                        >
                          <Info size={12} />
                        </button>
                        {showModifyInfo && (
                          <div className="absolute top-full left-0 mt-1 z-10 w-72 bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-xl p-4 space-y-2">
                            <p className="text-admin-sm text-admin-text-primary font-medium">How modification works</p>
                            <p className="text-admin-sm text-admin-text-muted">
                              Describe changes to make to the selected image. The AI uses the current image as a starting point and applies your edits.
                            </p>
                            <div className="space-y-1">
                              <p className="text-admin-sm text-admin-text-muted font-medium">Examples:</p>
                              <ul className="text-admin-sm text-admin-text-faint space-y-0.5 list-none">
                                <li>&bull; Tighter frame on the subject</li>
                                <li>&bull; Warmer color grading</li>
                                <li>&bull; Add dramatic shadows from the left</li>
                                <li>&bull; Remove background clutter</li>
                                <li>&bull; Change to a low-angle shot</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={modifyPrompt}
                      onChange={(e) => setModifyPrompt(e.target.value)}
                      placeholder="Describe what to change (e.g., tighter frame, warmer lighting, remove background elements...)"
                      className="admin-input admin-scrollbar w-full text-admin-sm font-admin-mono min-h-[120px] max-h-[300px]"
                    />
                  </div>

                  {/* Modify action */}
                  <button
                    onClick={handleModify}
                    disabled={generating || !selectedFrame || !modifyPrompt.trim()}
                    className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2 w-full justify-center"
                  >
                    {generating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    {generating ? 'Modifying...' : 'Modify Image'}
                  </button>
                </>
              )}
            </div>

            {/* ── Right column: history ── */}
            <div className="w-[200px] flex-shrink-0 border-l border-admin-border bg-admin-bg-base overflow-y-auto admin-scrollbar-auto">
              <div className="px-4 pt-4 pb-2">
                <label className="admin-label mb-0">History</label>
              </div>

              {history.length === 0 ? (
                <div className="px-4 py-8 text-center text-admin-text-faint">
                  <p className="text-admin-sm">No generations yet</p>
                </div>
              ) : (
                <div className="px-3 pb-3 space-y-2">
                  {history.map((frame) => {
                    const ts = formatLA(frame.created_at);
                    return (
                      <div
                        key={frame.id}
                        className={`group/hist relative rounded-admin-sm cursor-pointer transition-all ${
                          frame.id === selectedFrameId
                            ? 'ring-2 ring-[var(--admin-accent)]'
                            : 'hover:ring-1 hover:ring-admin-border'
                        }`}
                        onClick={() => handleSelectFrame(frame)}
                      >
                        <img
                          src={frame.image_url}
                          alt=""
                          className="w-full aspect-video object-cover rounded-admin-sm"
                        />
                        {/* Active dot — top right */}
                        {frame.is_active && (
                          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-admin-success ring-1 ring-black/30" />
                        )}
                        {/* Hover actions */}
                        <div
                          className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/hist:opacity-100 transition-opacity bg-black/40 rounded-admin-sm"
                          onMouseLeave={() => setConfirmDeleteId(null)}
                        >
                          {!frame.is_active && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUseFrame(frame.id); }}
                              className="px-2 py-1 text-[11px] font-medium rounded bg-white/90 text-black hover:bg-white transition-colors"
                              title="Set as active"
                            >
                              Use
                            </button>
                          )}
                          {confirmDeleteId === frame.id ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteFrame(frame.id); }}
                                className="w-6 h-6 flex items-center justify-center rounded bg-red-500/90 text-white hover:bg-red-500"
                                title="Confirm delete"
                              >
                                <Check size={10} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                className="w-6 h-6 flex items-center justify-center rounded bg-black/50 text-white/80 hover:bg-zinc-500"
                                title="Cancel"
                              >
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(frame.id); }}
                              className="w-6 h-6 flex items-center justify-center rounded bg-black/50 text-white/80 hover:bg-red-500"
                              title="Delete"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                        {/* Timestamp — LA timezone */}
                        <p className="text-admin-sm text-admin-text-faint text-center mt-1">
                          {ts.date} {ts.time}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center border-t border-admin-border bg-admin-bg-wash flex-shrink-0 rounded-b-admin-xl">
          <div className="flex-1 flex items-center gap-2 px-6 py-4">
            <button
              onClick={handleSaveAndClose}
              className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              Save
            </button>
            <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">
              Close
            </button>
          </div>
          <div className="w-[200px] flex-shrink-0 px-4 py-4 text-center">
            <span className="text-admin-sm text-admin-text-muted">
              {history.length} generation{history.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
