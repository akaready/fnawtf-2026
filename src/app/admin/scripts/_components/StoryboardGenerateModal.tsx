'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, Plus, ImageIcon, Info, Wand2, LayoutGrid, Trash2, Download, Clipboard, ArrowRight, Check, EyeOff, Eye, ChevronDown, Copy } from 'lucide-react';
import { getFrameHistoryForBeat, getAllStoryboardFrames as fetchAllScriptFrames, setActiveFrame, setFrameSlot, setBeatLayout, updateFrameCrop, updateBeat, deleteStoryboardFrame, moveFrameToBeat, duplicateFrame, archiveStoryboardFrame, unarchiveStoryboardFrame } from '@/app/admin/actions';
import { buildRichPrompt } from './storyboardUtils';
import { STYLE_PRESETS } from '@/lib/scripts/stylePresets';
import { StoryboardFramesTab } from './StoryboardFramesTab';
import { StoryboardLayoutRenderer } from './StoryboardLayoutRenderer';
import { STORYBOARD_LAYOUTS } from './storyboardLayouts';
import { ScriptBeatCell } from './ScriptBeatCell';
import type {
  ScriptStoryboardFrameRow,
  ScriptStyleRow,
  ScriptStyleReferenceRow,
  StoryboardStylePreset,
  ComputedScene,
  ScriptCharacterRow,
  ScriptLocationRow,
  ScriptTagRow,
  ScriptProductRow,
  CharacterCastWithContact,
  CharacterReferenceRow,
  LocationReferenceRow,
  StoryboardReferenceUsed,
  CropConfig,
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


// ── Types ──

type ModalTab = 'generate' | 'modify' | 'frames';

// Per-beat persistent state (survives modal close/reopen within session)
const beatModalState = new Map<string, { lastTab?: ModalTab; collapsedSections?: Set<string> }>();

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
  products?: ScriptProductRow[];
  castMap?: Record<string, CharacterCastWithContact[]>;
  referenceMap?: Record<string, CharacterReferenceRow[]>;
  locationReferenceMap?: Record<string, LocationReferenceRow[]>;
  sceneFrames?: { imageUrl: string; label: string; filename: string }[];
  allScriptFrames?: { imageUrl: string; label: string; filename: string }[];
  consistencyFrameUrls?: string[];
  onFrameChange: (frame: ScriptStoryboardFrameRow | null) => void;
  // Multi-frame support
  scenes?: ComputedScene[];                           // full script scenes for beat picker
  allBeatFrames?: ScriptStoryboardFrameRow[];         // all frames across entire script
  frames?: ScriptStoryboardFrameRow[];                // all frames for this beat (active + history)
  layout?: string | null;                             // beat's current storyboard_layout
  defaultTab?: ModalTab;                              // which tab to open on
  onFramesChange?: (frames: ScriptStoryboardFrameRow[]) => void;
}

export function StoryboardGenerateModal({
  onClose,
  beatId,
  sceneId,
  scriptId,
  activeFrame,
  audioContent,
  visualContent,
  notesContent,
  beatReferenceUrls,
  style,
  styleReferences,
  scene,
  beatIndex,
  characters,
  locations,
  products = [],
  castMap,
  referenceMap,
  locationReferenceMap,
  sceneFrames: _sceneFrames,
  allScriptFrames: _allScriptFrames,
  consistencyFrameUrls,
  onFrameChange,
  scenes,
  allBeatFrames: _allBeatFrames,
  frames: framesProp,
  layout,
  defaultTab,
  onFramesChange,
}: Props) {
  // ── Core state ──
  const saved = beatModalState.get(beatId);
  const [activeTab, setActiveTabRaw] = useState<ModalTab>(
    defaultTab ?? saved?.lastTab ?? ((framesProp ?? []).some(f => f.slot !== null) ? 'frames' : 'generate')
  );
  const setActiveTab = useCallback((tab: ModalTab) => {
    setActiveTabRaw(tab);
    const s = beatModalState.get(beatId) ?? {};
    beatModalState.set(beatId, { ...s, lastTab: tab });
  }, [beatId]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => saved?.collapsedSections ?? new Set(['hidden'])
  );
  const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      const s = beatModalState.get(beatId) ?? {};
      beatModalState.set(beatId, { ...s, collapsedSections: next });
      return next;
    });
  }, [beatId]);
  const [history, setHistory] = useState<ScriptStoryboardFrameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(activeFrame?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [localAudio, setLocalAudio] = useState(audioContent);
  const [localVisual, setLocalVisual] = useState(visualContent);
  const [localNotes, setLocalNotes] = useState(notesContent);
  const [promptPreviewTab, setPromptPreviewTab] = useState<'text' | 'json'>('text');
  const beatSaveRef = useRef<NodeJS.Timeout | null>(null);

  const saveBeatContent = useCallback((audio: string, visual: string, notes: string) => {
    if (beatSaveRef.current) clearTimeout(beatSaveRef.current);
    beatSaveRef.current = setTimeout(() => {
      void updateBeat(beatId, { audio_content: audio, visual_content: visual, notes_content: notes });
    }, 800);
  }, [beatId]);
  const [modifyPrompt, setModifyPrompt] = useState('');
  // Stable empty array — prevents ScriptBeatCell from re-firing setContent on every render
  const emptyTags = useMemo(() => [] as ScriptTagRow[], []);
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
  const [showModifyInfo, setShowModifyInfo] = useState(false);
  useEffect(() => {
    if (!showModifyInfo) return;
    const handler = (e: MouseEvent) => {
      e.stopPropagation();
      setShowModifyInfo(false);
    };
    // Use capture so it fires before the button's own click handler
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [showModifyInfo]);
  const [allFramesForScript, setAllFramesForScript] = useState<ScriptStoryboardFrameRow[] | null>(null);
  const [loadingOthers, setLoadingOthers] = useState(true);
  const [isDragOverRef, setIsDragOverRef] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Draft state for Frames tab (not persisted until Save)
  const [draftLayout, setDraftLayout] = useState<string>(layout ?? 'single');
  const [draftSlots, setDraftSlots] = useState<Map<number, string>>(() => {
    const map = new Map<number, string>();
    framesProp?.filter(f => f.slot !== null).forEach(f => map.set(f.slot!, f.id));
    return map;
  });
  const [foreignFrameIds, setForeignFrameIds] = useState<Set<string>>(new Set());
  const [draftCrops, setDraftCrops] = useState<Map<string, CropConfig>>(() => {
    const map = new Map<string, CropConfig>();
    framesProp?.filter(f => f.crop_config != null).forEach(f => map.set(f.id, f.crop_config!));
    return map;
  });
  const [selectedSlot, setSelectedSlot] = useState<number>(1);

  // ── Frames tab: layout change handler ──
  const handleLayoutChange = useCallback((newLayout: string) => {
    setDraftLayout(newLayout);
    // Remove slot assignments that exceed the new layout's slot count
    const def = STORYBOARD_LAYOUTS.find(l => l.id === newLayout);
    if (def) {
      setDraftSlots(prev => {
        const next = new Map(prev);
        for (const slot of next.keys()) {
          if (slot > def.slotCount) next.delete(slot);
        }
        return next;
      });
    }
  }, []);

  // Fall back to activeFrame prop if not found in history (e.g., history fetch failed)
  const selectedFrame = selectedFrameId
    ? (history.find(f => f.id === selectedFrameId) ?? null)
    : (activeFrame ?? null);

  // ── Assembled prompt (live preview, updates as user edits fields) ──
  const assembledPrompt = useMemo(() => {
    const beat = scene.beats[beatIndex];
    if (!beat) {
      return [localAudio && `Audio: ${localAudio}`, localVisual && `Visual: ${localVisual}`, localNotes && `Notes: ${localNotes}`]
        .filter(Boolean).join('\n') || 'Empty beat — generate a neutral establishing shot';
    }
    const fakeBeat = { ...beat, audio_content: localAudio, visual_content: localVisual, notes_content: localNotes };
    let prompt = buildRichPrompt(fakeBeat, beatIndex, scene, characters, locations, castMap, referenceMap);
    const presetKey = localStylePreset ?? style?.style_preset;
    if (presetKey && STYLE_PRESETS[presetKey as keyof typeof STYLE_PRESETS]?.prompt) {
      prompt += `\n${STYLE_PRESETS[presetKey as keyof typeof STYLE_PRESETS].prompt}`;
    }
    return prompt;
  }, [localAudio, localVisual, localNotes, scene, beatIndex, characters, locations, castMap, referenceMap, localStylePreset, style]);

  // ── Preview JSON — mirrors server-side promptObj ──
  const previewJson = useMemo(() => {
    const presetKey = localStylePreset ?? style?.style_preset;
    const styleBlock = presetKey && STYLE_PRESETS[presetKey as keyof typeof STYLE_PRESETS]
      ? STYLE_PRESETS[presetKey as keyof typeof STYLE_PRESETS].jsonStyle
      : style?.prompt ? { name: 'Custom style', rendering: style.prompt, depth_of_field: 'f/2.0' } : null;

    const styleRefs       = localReferences.filter(r => r.purpose === 'style').slice(0, 2);
    const consistencyRefs = localReferences.filter(r => r.purpose === 'consistency').slice(0, 4);
    const castRefs        = localReferences.filter(r => r.purpose === 'cast').slice(0, 4);
    const locRefs         = localReferences.filter(r => r.purpose === 'location').slice(0, 2);
    const beatRefs        = localReferences.filter(r => r.purpose === 'beat').slice(0, 2);

    const refDeclarations: object[] = [];
    let imgIdx = 1;
    if (styleRefs.length > 0) {
      refDeclarations.push({ image_ids: Array.from({ length: styleRefs.length }, (_, i) => imgIdx + i), purpose: 'style reference', extract: 'visual rendering technique, line weight, color palette, shading approach, overall feel', apply_to: 'entire output — match this style exactly' });
      imgIdx += styleRefs.length;
    }
    if (consistencyRefs.length > 0) {
      refDeclarations.push({ image_ids: Array.from({ length: consistencyRefs.length }, (_, i) => imgIdx + i), purpose: 'nearby frames from this storyboard sequence', extract: 'visual style, line weight, color palette, rendering technique, character appearances, environment', apply_to: 'entire output — your frame must be visually indistinguishable from these' });
      imgIdx += consistencyRefs.length;
    }
    if (castRefs.length > 0) {
      refDeclarations.push({ image_ids: Array.from({ length: castRefs.length }, (_, i) => imgIdx + i), purpose: 'character appearance reference', extract: 'exact facial structure, hair color and style, eye shape, skin tone, identifying physical features', apply_to: 'character rendering — this specific person, match exactly every frame' });
      imgIdx += castRefs.length;
    }
    if (locRefs.length > 0) {
      refDeclarations.push({ image_ids: Array.from({ length: locRefs.length }, (_, i) => imgIdx + i), purpose: 'location environment reference', extract: 'architecture, surfaces, spatial layout, lighting quality, color palette of this specific place', apply_to: 'environment rendering — this specific location, match exactly every frame' });
      imgIdx += locRefs.length;
    }
    if (beatRefs.length > 0) {
      refDeclarations.push({ image_ids: Array.from({ length: beatRefs.length }, (_, i) => imgIdx + i), purpose: 'product or visual reference for this scene', extract: 'exact appearance, shape, color, and details of this product or object', apply_to: 'product or object rendering — match exactly as shown' });
    }

    return {
      task: 'Generate a single storyboard frame illustration',
      ...(styleBlock && { style: styleBlock }),
      sequence_consistency: consistencyRefs.length > 0
        ? 'CRITICAL: This is one frame in an ongoing storyboard sequence. Your output MUST be visually indistinguishable from the nearby frames provided — same artist, same medium, same rendering technique, same character appearances. Zero drift between frames.'
        : 'This is one frame in an ongoing storyboard sequence. Apply the style parameters above with absolute consistency — same artist, same tools, same rendering every frame.',
      scene: { content: assembledPrompt },
      ...(refDeclarations.length > 0 && { reference_images: refDeclarations }),
      constraints: {
        must_avoid: ['any text, letters, numbers, words, or symbols rendered anywhere in the image', 'borders, panel frames, or rectangular outlines drawn inside the image', 'watermarks, production logos, or frame numbering', 'camera equipment — boom microphones, tripods, light stands, camera rigs', 'crew members, camera operators, sound recordists', 'interviewer presence in interview scenes — subject only on camera, no OTS shots', 'whiteboards or screens with readable content — show them blank or with abstract shapes only'],
        output: 'edge-to-edge illustration filling 100% of canvas with zero internal borders',
      },
      output_specifications: { resolution: '2K', aspect_ratio: style?.aspect_ratio ?? '16:9', format: 'single storyboard frame' },
    };
  }, [localReferences, localStylePreset, style, assembledPrompt]);

  // ── Scene heading (mirrors ScriptSceneHeader) ──
  const sceneHeading = [scene.int_ext, scene.location_name || 'UNTITLED LOCATION', scene.time_of_day ? `— ${scene.time_of_day}` : ''].filter(Boolean).join('. ').replace('. —', ' —');

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

  // ── Load history on mount ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const initFromFrame = (sel: ScriptStoryboardFrameRow | null) => {
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
      // Seed Frames tab draft state from DB data
      setDraftSlots(new Map(frames.filter(f => f.slot !== null).map(f => [f.slot!, f.id])));
      setDraftCrops(new Map(frames.filter(f => f.crop_config != null).map(f => [f.id, f.crop_config!])));
      if (frames.some(f => f.slot !== null) && !defaultTab) setActiveTab('frames');

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
  }, [beatId, activeFrame, buildInitialReferences]);

  // ── Fetch all script frames for sidebar ──
  useEffect(() => {
    setLoadingOthers(true);
    fetchAllScriptFrames(scriptId)
      .then(data => setAllFramesForScript(data as unknown as ScriptStoryboardFrameRow[]))
      .finally(() => setLoadingOthers(false));
  }, [scriptId]);

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
    if (generating) return;
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
          contentPrompt: assembledPrompt,
          promptOverride: assembledPrompt,
          stylePrompt: style?.prompt,
          stylePreset: localStylePreset ?? style?.style_preset,
          aspectRatio: style?.aspect_ratio,
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
  }, [generating, assembledPrompt, localStylePreset, localReferences, scriptId, beatId, style, onFrameChange]);

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
      const updated = await setActiveFrame(frameId, beatId);
      setHistory(prev => prev.map(f => ({ ...f, is_active: f.id === frameId })));
      setSelectedFrameId(frameId);
      onFrameChange(updated);
    } catch (err) {
      console.error('Failed to set active frame:', err);
    }
  }, [beatId, onFrameChange]);

  // ── Delete a frame from history ──

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
    if (activeTab === 'frames') {
      // Frames tab: manage slots directly from draft state
      const savedLayout = layout ?? 'single';
      if (draftLayout !== savedLayout) {
        await setBeatLayout(beatId, draftLayout);
      }
      // Clear ALL current slot assignments first to avoid unique constraint violations
      for (const frame of history) {
        if (frame.slot !== null) {
          await setFrameSlot(frame.id, null);
        }
      }
      // Resolve final slot→frameId map, duplicating cross-beat frames into this beat
      const resolvedSlots = new Map<number, string>(); // slot → final frameId (may be a new copy)
      const extraFrames: import('@/types/scripts').ScriptStoryboardFrameRow[] = [];
      for (const [slot, frameId] of draftSlots) {
        if (foreignFrameIds.has(frameId)) {
          // Frame belongs to another beat — duplicate it into this beat
          const copy = await duplicateFrame(frameId, beatId);
          resolvedSlots.set(slot, copy.id);
          extraFrames.push({ ...copy, slot, is_active: true });
        } else {
          resolvedSlots.set(slot, frameId);
        }
      }
      // Assign slots
      for (const [slot, frameId] of resolvedSlots) {
        await setFrameSlot(frameId, slot);
      }
      // Flush crop changes
      for (const [frameId, crop] of draftCrops) {
        await updateFrameCrop(frameId, crop);
      }
      // Notify parent
      const updatedHistory = history.map(f => {
        const newSlot = [...resolvedSlots.entries()].find(([, id]) => id === f.id)?.[0] ?? null;
        const newCrop = draftCrops.get(f.id) ?? f.crop_config;
        return { ...f, slot: newSlot, is_active: newSlot !== null, crop_config: newCrop };
      });
      onFramesChange?.([...updatedHistory, ...extraFrames]);
    }

    onClose();
  }, [activeTab, selectedFrame, handleUseFrame, layout, draftLayout, draftSlots, draftCrops, foreignFrameIds, history, beatId, onFramesChange, onClose]);

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
        {/* ── Header: Scene title left, tabs right ── */}
        <div className="flex items-center border-b border-admin-border bg-admin-bg-sidebar flex-shrink-0 rounded-t-admin-xl overflow-hidden min-h-[52px]">
          {/* Scene heading — identical to ScriptSceneHeader view mode */}
          <div className="flex items-center gap-0 flex-1 min-w-0 overflow-hidden">
            <span className="text-admin-border font-bebas text-[52px] leading-none flex-shrink-0 translate-y-[2px] pl-2 pr-3">
              {scene.sceneNumber}
            </span>
            <span className="text-admin-base font-medium text-admin-text-faint uppercase tracking-wider truncate">
              {sceneHeading}
              {scene.scene_description && (
                <><span className="text-admin-text-ghost mx-1.5">&bull;</span><span className="text-admin-text-muted font-normal">{scene.scene_description}</span></>
              )}
            </span>
          </div>
          {/* Tab buttons — far right */}
          <div className="flex items-center gap-1 px-3 flex-shrink-0">
            {([
              { id: 'generate' as ModalTab, label: 'Generate', icon: Sparkles },
              { id: 'modify' as ModalTab, label: 'Modify', icon: Wand2 },
              { id: 'frames' as ModalTab, label: 'Frames', icon: LayoutGrid },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 text-admin-base font-medium rounded-admin-sm transition-colors inline-flex items-center gap-2 ${
                  activeTab === id
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-admin-text-ghost" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* ── Left column — changes per tab ── */}
            {activeTab === 'frames' ? (
              <StoryboardFramesTab
                frames={history}
                draftLayout={draftLayout}
                draftSlots={draftSlots}
                draftCrops={draftCrops}
                selectedSlot={selectedSlot}
                onLayoutChange={handleLayoutChange}
                onSlotAssign={(slot, frameId) => {
                  setDraftSlots(prev => new Map(prev).set(slot, frameId));
                  // If frame isn't in history (e.g. from Others), add it so stage can render it
                  const allFrames = allFramesForScript ?? [];
                  const foreign = allFrames.find(f => f.id === frameId);
                  if (foreign && !history.some(h => h.id === frameId)) {
                    setHistory(prev => [...prev, foreign]);
                  }
                }}
                onSlotClick={(slot) => setSelectedSlot(slot)}
                onReframe={(frameId, crop) =>
                  setDraftCrops(prev => new Map(prev).set(frameId, crop))
                }
              />
            ) : (
            <div className="flex-1 admin-scrollbar px-6 py-5 space-y-8" style={{ overflowY: 'scroll' }}>
              {/* Image preview — only shown on modify tab */}
              {activeTab === 'modify' && previewImageUrl && !generating ? (
                <div className="aspect-video rounded-admin-md overflow-hidden">
                  <img src={previewImageUrl} className="w-full h-full object-cover" alt="" />
                </div>
              ) : activeTab === 'modify' && selectedFrame && !generating ? (
                <StoryboardLayoutRenderer
                  layout="single"
                  frames={[{ ...selectedFrame, slot: 1 }]}
                  size="stage"
                  gap={0}
                />
              ) : activeTab === 'modify' && !selectedFrame && !generating ? (
                <div className="aspect-video rounded-admin-md border-[3px] border-dashed border-admin-border bg-admin-bg-inset flex items-center justify-center">
                  <div className="text-center text-admin-text-faint">
                    <ImageIcon size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-admin-sm">Generate an image first, then select it to modify</p>
                  </div>
                </div>
              ) : generating ? (
                <div className="aspect-video rounded-admin-md overflow-hidden relative bg-admin-bg-inset">
                  <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-admin-text-faint">
                      <Loader2 size={24} className="mx-auto mb-2 animate-spin opacity-40" />
                      <p className="text-admin-sm">Generating…</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-admin-md border-[3px] border-dashed border-admin-border bg-admin-bg-inset flex items-center justify-center">
                  <div className="text-center text-admin-text-faint">
                    <ImageIcon size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-admin-sm">
                      {activeTab === 'modify' ? 'Select an image from history to modify' : 'No image generated yet'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'generate' ? (
                <>
                  {/* Content fields — 2-col: Audio+Visual | Notes+References */}
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAddRefFile(e.target.files)} />
                  <div className="border border-[#0e0e0e] overflow-hidden bg-admin-bg-base">
                    {/* Row 1: Audio | Visual */}
                    <div className="grid grid-cols-2">
                      <div className="border-l-[3px] border-l-[var(--admin-accent)] border-r border-r-[#0e0e0e] [&>div]:!border-b-0" onClick={(e) => { const ce = (e.currentTarget as HTMLElement).querySelector('[contenteditable]') as HTMLElement | null; if (ce && !(e.target as HTMLElement).closest('[contenteditable]')) { ce.focus(); const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(ce); range.collapse(false); sel?.removeAllRanges(); sel?.addRange(range); } }}>
                        <div className="px-3 pt-1.5">
                          <span className="text-admin-sm text-admin-text-ghost uppercase tracking-widest">Audio</span>
                        </div>
                        <ScriptBeatCell
                          value={localAudio}
                          field="audio_content"
                          onChange={(v) => { setLocalAudio(v); saveBeatContent(v, localVisual, localNotes); }}
                          characters={characters}
                          tags={emptyTags}
                          locations={locations}
                          products={products}
                          beatId={beatId}
                        />
                      </div>
                      <div className="border-l-[3px] border-l-[var(--admin-info)] [&>div]:!border-b-0" onClick={(e) => { const ce = (e.currentTarget as HTMLElement).querySelector('[contenteditable]') as HTMLElement | null; if (ce && !(e.target as HTMLElement).closest('[contenteditable]')) { ce.focus(); const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(ce); range.collapse(false); sel?.removeAllRanges(); sel?.addRange(range); } }}>
                        <div className="px-3 pt-1.5">
                          <span className="text-admin-sm text-admin-text-ghost uppercase tracking-widest">Visual</span>
                        </div>
                        <ScriptBeatCell
                          value={localVisual}
                          field="visual_content"
                          onChange={(v) => { setLocalVisual(v); saveBeatContent(localAudio, v, localNotes); }}
                          characters={characters}
                          tags={emptyTags}
                          locations={locations}
                          products={products}
                          beatId={beatId}
                        />
                      </div>
                    </div>
                    {/* Row 2: Notes | References */}
                    <div className="grid grid-cols-2 border-t border-t-[#0e0e0e]">
                      <div className="border-l-[3px] border-l-[var(--admin-warning)] border-r border-r-[#0e0e0e] [&>div]:!border-b-0" onClick={(e) => { const ce = (e.currentTarget as HTMLElement).querySelector('[contenteditable]') as HTMLElement | null; if (ce && !(e.target as HTMLElement).closest('[contenteditable]')) { ce.focus(); const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(ce); range.collapse(false); sel?.removeAllRanges(); sel?.addRange(range); } }}>
                        <div className="px-3 pt-1.5">
                          <span className="text-admin-sm text-admin-text-ghost uppercase tracking-widest">Notes</span>
                        </div>
                        <ScriptBeatCell
                          value={localNotes}
                          field="notes_content"
                          onChange={(v) => { setLocalNotes(v); saveBeatContent(localAudio, localVisual, v); }}
                          characters={characters}
                          tags={emptyTags}
                          locations={locations}
                          products={products}
                          beatId={beatId}
                        />
                      </div>
                      <div
                        className={`border-l-[3px] border-l-[var(--admin-danger)] transition-colors ${isDragOverRef ? 'bg-[var(--admin-accent)]/10 ring-1 ring-inset ring-[var(--admin-accent)]' : ''}`}
                        onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-storyboard-ref')) { e.preventDefault(); setIsDragOverRef(true); } }}
                        onDragLeave={() => setIsDragOverRef(false)}
                        onDrop={(e) => {
                          setIsDragOverRef(false);
                          const url = e.dataTransfer.getData('application/x-storyboard-ref');
                          if (url) {
                            e.preventDefault();
                            setLocalReferences(prev => prev.some(r => r.url === url) ? prev : [...prev, { url, purpose: 'beat' }]);
                          }
                        }}
                      >
                        <div className="px-3 pt-1.5 pb-1">
                          <span className="text-admin-sm text-admin-text-ghost uppercase tracking-widest">References</span>
                        </div>
                        <div className="px-3 pb-2">
                          <div className={`grid ${localReferences.filter(r => r.purpose === 'beat').length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5 mb-1`}>
                            {localReferences.filter(r => r.purpose === 'beat').map((ref, i) => (
                              <div key={`${ref.url}-${i}`} className="group/img relative aspect-video rounded overflow-hidden">
                                <img src={ref.url} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/30 rounded">
                                  <button
                                    onClick={() => handleRemoveRef(ref.url)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-admin-danger text-white"
                                    title="Remove"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div
                            className="flex items-center justify-center h-8 cursor-pointer rounded border border-dashed border-admin-border hover:border-admin-border-strong hover:bg-admin-bg-hover transition-colors"
                            onClick={() => fileRef.current?.click()}
                          >
                            <Plus size={13} className="text-admin-text-ghost" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Style selector — below the content fields, with separator */}
                  <div className="border-t border-admin-border pt-4">
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

                  {/* Full prompt preview — tabs between text and JSON */}
                  <div className="border-t border-admin-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="admin-label mb-0">Full Prompt Preview</label>
                      <div className="flex items-center gap-0 border border-admin-border rounded-admin-sm overflow-hidden">
                        <button
                          onClick={() => setPromptPreviewTab('text')}
                          className={`px-3 py-1 text-admin-sm transition-colors ${promptPreviewTab === 'text' ? 'bg-admin-bg-active text-admin-text-primary' : 'text-admin-text-muted hover:bg-admin-bg-hover'}`}
                        >
                          Text
                        </button>
                        <button
                          onClick={() => setPromptPreviewTab('json')}
                          className={`px-3 py-1 text-admin-sm transition-colors border-l border-admin-border ${promptPreviewTab === 'json' ? 'bg-admin-bg-active text-admin-text-primary' : 'text-admin-text-muted hover:bg-admin-bg-hover'}`}
                        >
                          JSON
                        </button>
                      </div>
                    </div>
                    <pre className="text-admin-sm font-admin-mono text-admin-text-muted whitespace-pre-wrap break-words leading-relaxed">
                      {promptPreviewTab === 'text'
                        ? assembledPrompt
                        : JSON.stringify(previewJson, null, 2)
                      }
                    </pre>

                    {/* All reference images sent to AI */}
                    {localReferences.length > 0 && (
                      <div className="border-t border-admin-border mt-4 pt-4">
                        <label className="admin-label mb-2">References</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-5">
                          {Object.entries(refGroups).map(([purpose, refs]) => (
                            <div key={purpose}>
                              <p className={`text-admin-sm mb-1 uppercase tracking-wider ${
                                purpose === 'style' ? 'text-admin-text-muted' :
                                purpose === 'cast' ? 'text-admin-success' :
                                purpose === 'location' ? 'text-admin-warning' :
                                purpose === 'beat' ? 'text-admin-danger' :
                                'text-admin-danger'
                              }`}>{PURPOSE_LABELS[purpose] ?? purpose}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {refs.map((ref, i) => (
                                  <img
                                    key={`${ref.url}-${i}`}
                                    src={ref.url}
                                    alt=""
                                    className="w-16 h-16 object-cover rounded-[2px] border border-[#0e0e0e]"
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ── Modify tab content ── */
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="admin-label mb-0">Modification Prompt</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowModifyInfo(!showModifyInfo)}
                          className="btn-ghost w-4 h-4 flex items-center justify-center"
                          title="How to use"
                        >
                          <Info size={12} />
                        </button>
                        {showModifyInfo && (
                          <div className="absolute bottom-full left-0 mb-2 z-10 w-72 bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-xl overflow-hidden">
                            <div className="px-4 py-3 space-y-3">
                              <p className="text-admin-sm text-admin-text-muted leading-relaxed">
                                Describe changes to make to the selected image. The AI uses the current image as a starting point and applies your edits.
                              </p>
                              <div>
                                <p className="text-admin-sm text-admin-text-muted font-medium mb-1.5">Examples</p>
                                <ul className="space-y-1">
                                  {['Tighter frame on the subject', 'Warmer color grading', 'Add dramatic shadows from the left', 'Remove background clutter', 'Change to a low-angle shot'].map(ex => (
                                    <li key={ex} className="text-admin-sm text-admin-text-faint flex gap-2">
                                      <span className="text-admin-text-muted flex-shrink-0">—</span>
                                      <span>{ex}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={modifyPrompt}
                      onChange={(e) => setModifyPrompt(e.target.value)}
                      placeholder="Describe what to change (e.g., tighter frame, warmer lighting, remove background elements...)"
                      className="admin-input admin-scrollbar w-full text-admin-sm font-admin-mono min-h-[120px] max-h-[300px] resize-none"
                    />
                  </div>

                </>
              )}
            </div>
            )}

            {/* ── Right column: unified frame sidebar ── */}
            <div className="w-[200px] flex-shrink-0 border-l border-admin-border bg-admin-bg-base flex flex-col overflow-hidden">
              {(() => {
                // Compute which image URLs / frame IDs are "active" in the hero
                // For frames tab: all slots. For generate/modify: selectedFrame + previewImageUrl
                const activeUrls = new Set<string>();
                const activeIds = new Set<string>();
                if (activeTab === 'frames') {
                  draftSlots.forEach((frameId) => {
                    const f = history.find(h => h.id === frameId);
                    if (f) { activeUrls.add(f.image_url); activeIds.add(f.id); }
                  });
                } else {
                  if (selectedFrame) { activeIds.add(selectedFrame.id); }
                  else if (previewImageUrl) activeUrls.add(previewImageUrl);
                }

                const handleFrameClick = (frameId: string, imageUrl: string) => {
                  if (activeTab === 'frames') {
                    setDraftSlots(prev => new Map(prev).set(selectedSlot, frameId));
                    if (!history.some(h => h.id === frameId)) {
                      const foreign = allFramesForScript?.find(f => f.id === frameId);
                      if (foreign) {
                        setHistory(prev => [...prev, foreign]);
                        setForeignFrameIds(prev => new Set(prev).add(frameId));
                      }
                    }
                  } else {
                    const inHistory = history.find(f => f.id === frameId);
                    if (inHistory) {
                      // Toggle: clicking already-selected frame deselects it
                      if (selectedFrameId === inHistory.id) { setSelectedFrameId(null); setPreviewImageUrl(null); }
                      else { setSelectedFrameId(inHistory.id); setPreviewImageUrl(null); }
                    } else { setPreviewImageUrl(imageUrl); setSelectedFrameId(null); }
                  }
                };

                const renderFrame = (id: string, imageUrl: string, label?: string, archived?: boolean) => {
                  const isActive = activeIds.has(id) || activeUrls.has(imageUrl);
                  const isSyntheticId = id.startsWith('scene-url-') || id.startsWith('preview-');
                  const refreshAfterChange = () => {
                    setHistory(prev => prev.filter(f => f.id !== id));
                    setDraftSlots(prev => { const n = new Map(prev); for (const [s, fid] of n) { if (fid === id) n.delete(s); } return n; });
                  };
                  return (
                    <SidebarFrameItem
                      key={id}
                      id={id}
                      imageUrl={imageUrl}
                      label={label}
                      isActive={isActive}
                      isSyntheticId={isSyntheticId}
                      isArchived={archived}
                      scenes={scenes}
                      onClick={() => handleFrameClick(id, imageUrl)}
                      onDeleted={() => {
                        refreshAfterChange();
                        if (selectedFrameId === id) setSelectedFrameId(null);
                      }}
                      onMoved={refreshAfterChange}
                      onArchived={() => {
                        refreshAfterChange();
                        fetchAllScriptFrames(scriptId).then(setAllFramesForScript);
                      }}
                    />
                  );
                };

                // Build other-scene groups sorted by scene number
                // Frames may have scene_id=null (beat-level); resolve via beat_id → scene lookup
                const resolveSceneId = (f: ScriptStoryboardFrameRow): string | null => {
                  if (f.scene_id) return f.scene_id;
                  if (f.beat_id && scenes) {
                    const sc = scenes.find(s => s.beats.some(b => b.id === f.beat_id));
                    return sc?.id ?? null;
                  }
                  return null;
                };
                const allOtherFrames = (allFramesForScript ?? []).filter(f => {
                  const sid = resolveSceneId(f);
                  return sid !== sceneId;
                });
                const otherGrouped = new Map<string, ScriptStoryboardFrameRow[]>();
                for (const f of allOtherFrames) {
                  const sid = resolveSceneId(f) ?? 'unknown';
                  if (!otherGrouped.has(sid)) otherGrouped.set(sid, []);
                  otherGrouped.get(sid)!.push(f);
                }
                const sortedOtherSceneIds = [...otherGrouped.keys()].sort((a, b) => {
                  const sa = scenes?.find(s => s.id === a)?.sceneNumber ?? 0;
                  const sb = scenes?.find(s => s.id === b)?.sceneNumber ?? 0;
                  return (typeof sa === 'number' ? sa : parseInt(sa)) - (typeof sb === 'number' ? sb : parseInt(sb));
                });

                // Helper: derive caption for any frame via beat lookup
                const frameCaption = (frameId: string): string => {
                  const f = allFramesForScript?.find(af => af.id === frameId)
                         ?? history.find(hf => hf.id === frameId);
                  if (f) {
                    const sc = scenes?.find(s => s.beats.some(b => b.id === f.beat_id));
                    if (sc) {
                      const beatIdx = sc.beats.findIndex(b => b.id === f.beat_id);
                      let letter = '';
                      if (beatIdx >= 0) {
                        let n = beatIdx + 1;
                        while (n > 0) { n--; letter = String.fromCharCode(65 + (n % 26)) + letter; n = Math.floor(n / 26); }
                      }
                      return letter ? `${sc.sceneNumber}${letter}` : `${sc.sceneNumber}`;
                    }
                  }
                  return '';
                };

                // Selected frames (currently in use across all slots / hero)
                const selectedFrames: { id: string; imageUrl: string; caption: string }[] = [];
                activeIds.forEach(id => {
                  const f = history.find(h => h.id === id);
                  if (f) selectedFrames.push({ id: f.id, imageUrl: f.image_url, caption: frameCaption(f.id) });
                });
                activeUrls.forEach(url => {
                  if (!selectedFrames.some(f => f.imageUrl === url)) {
                    selectedFrames.push({ id: `preview-${url}`, imageUrl: url, caption: frameCaption(`preview-${url}`) });
                  }
                });

                // This scene frames — built from allFramesForScript, sorted by beat order
                const thisSceneBeatIds = new Set(scene.beats.map(b => b.id));
                const thisSceneRaw = (allFramesForScript ?? []).filter(f =>
                  f.beat_id && thisSceneBeatIds.has(f.beat_id)
                ).sort((fa, fb) => {
                  const ai = scene.beats.findIndex(b => b.id === fa.beat_id);
                  const bi = scene.beats.findIndex(b => b.id === fb.beat_id);
                  return ai - bi;
                });
                const thisSceneFrames = thisSceneRaw.filter(f => !f.is_archived).map(f => ({
                  id: f.id,
                  imageUrl: f.image_url,
                  caption: frameCaption(f.id),
                }));

                // Collect all archived frames across all scenes
                const archivedFrames = [
                  ...thisSceneRaw.filter(f => f.is_archived),
                  ...(allFramesForScript ?? []).filter(f => {
                    const sid = resolveSceneId(f);
                    return sid !== sceneId && f.is_archived;
                  }),
                ];

                const sectionHeader = (key: string, label: string, opts?: { colorClass?: string; icon?: React.ReactNode }) => {
                  const collapsed = collapsedSections.has(key);
                  return (
                    <button type="button" onClick={() => toggleSection(key)} className="flex items-center justify-between w-full mb-3 opacity-80 hover:opacity-100 transition-opacity">
                      <span className={`text-xs uppercase tracking-wide ${opts?.colorClass ? opts.colorClass : 'text-admin-text-secondary'}`}>{label}</span>
                      <span className={`flex items-center gap-1 ${opts?.colorClass ? opts.colorClass : 'text-admin-text-faint'}`}>
                        {opts?.icon}
                        <ChevronDown size={12} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
                      </span>
                    </button>
                  );
                };

                return (
                  <div className="flex-1 admin-scrollbar px-3 py-6" style={{ overflowY: 'scroll' }}>
                    {/* THIS SCENE */}
                    <div>
                      {sectionHeader('current-scene', 'Current Scene', { colorClass: 'text-[var(--admin-info)]' })}
                      {!collapsedSections.has('current-scene') && (
                        thisSceneFrames.length === 0 ? (
                          <p className="text-admin-sm text-admin-text-faint text-center pb-2">No frames yet</p>
                        ) : (
                          <div className="space-y-2">
                            {thisSceneFrames.map(f => renderFrame(f.id, f.imageUrl, f.caption || undefined))}
                          </div>
                        )
                      )}
                    </div>

                    {/* ALL OTHER SCENES */}
                    <div className="border-t border-admin-border mt-5 pt-5">
                      {loadingOthers ? (
                        <p className="text-admin-sm text-admin-text-faint text-center">Loading…</p>
                      ) : sortedOtherSceneIds.map(sid => {
                        const sc = scenes?.find(s => s.id === sid);
                        const sceneLabel = sc ? `${sc.sceneNumber}` : '?';
                        const sectionKey = `scene-${sid}`;
                        // Sort frames by beat order within this scene, exclude archived
                        const sortedFrames = [...(otherGrouped.get(sid) ?? [])].filter(f => !f.is_archived).sort((a, b) => {
                          const ai = sc?.beats.findIndex(b2 => b2.id === a.beat_id) ?? -1;
                          const bi = sc?.beats.findIndex(b2 => b2.id === b.beat_id) ?? -1;
                          return ai - bi;
                        });
                        if (sortedFrames.length === 0) return null;
                        return (
                          <div key={sid} className="mb-4">
                            {sectionHeader(sectionKey, `Scene ${sceneLabel}`)}
                            {!collapsedSections.has(sectionKey) && (
                              <div className="space-y-1.5">
                                {sortedFrames.map(f => {
                                  const beatIdx = sc?.beats.findIndex(b => b.id === f.beat_id) ?? -1;
                                  let letter = '';
                                  if (beatIdx >= 0) {
                                    let n = beatIdx + 1;
                                    while (n > 0) { n--; letter = String.fromCharCode(65 + (n % 26)) + letter; n = Math.floor(n / 26); }
                                  }
                                  const beatLabel = letter ? `${sceneLabel}${letter}` : sceneLabel;
                                  return renderFrame(f.id, f.image_url, beatLabel);
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* ARCHIVED */}
                    {archivedFrames.length > 0 && (
                      <div className="border-t border-admin-border mt-5 pt-5">
                        {sectionHeader('hidden', 'Hidden', { colorClass: 'text-[var(--admin-warning)]', icon: <EyeOff size={12} /> })}
                        {!collapsedSections.has('hidden') && (
                          <div className="space-y-1.5">
                            {archivedFrames.map(f => renderFrame(f.id, f.image_url, frameCaption(f.id) || undefined, true))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}


        {/* ── Footer ── */}
        <div className="flex items-center gap-2 border-t border-admin-border bg-admin-bg-wash flex-shrink-0 rounded-b-admin-xl px-6 py-4">
          {activeTab === 'generate' && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? 'Generating...' : 'Generate Frame'}
            </button>
          )}
          {activeTab === 'modify' && (
            <button
              onClick={handleModify}
              disabled={generating || !selectedFrame || !modifyPrompt.trim()}
              className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {generating ? 'Modifying...' : 'Modify Frame'}
            </button>
          )}
          {activeTab === 'frames' && (
            <button
              onClick={handleSaveAndClose}
              className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <LayoutGrid size={14} />
              Apply Layout
            </button>
          )}
          <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── SidebarFrameItem ─────────────────────────────────────────────────────────

function SidebarFrameItem({
  id, imageUrl, label, isActive, isSyntheticId, isArchived, scenes, onClick, onDeleted, onMoved, onArchived,
}: {
  id: string;
  imageUrl: string;
  label?: string;
  isActive: boolean;
  isSyntheticId: boolean;
  isArchived?: boolean;
  scenes?: import('@/types/scripts').ComputedScene[];
  onClick: () => void;
  onDeleted: () => void;
  onMoved: () => void;
  onArchived: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showBeatPicker, setShowBeatPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'move' | 'copy'>('move');
  const [pickerAbove, setPickerAbove] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showBeatPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowBeatPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBeatPicker]);

  const openPicker = (e: React.MouseEvent, mode: 'move' | 'copy') => {
    e.stopPropagation();
    setPickerMode(mode);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPickerAbove(rect.top > 220);
    }
    setShowBeatPicker(v => !v);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteStoryboardFrame(id);
    onDeleted();
  };

  const handleCopyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch {
      // fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frame-${id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isArchived) {
      await unarchiveStoryboardFrame(id);
    } else {
      await archiveStoryboardFrame(id);
    }
    onArchived();
  };

  const btnCls = 'w-5 h-5 flex items-center justify-center text-admin-text-faint hover:text-admin-text-primary transition-colors flex-shrink-0';

  return (
    <div className="group/sf">
      <div
        className={`relative rounded-admin-sm cursor-pointer transition-all overflow-hidden ${isActive ? 'ring-2 ring-[var(--admin-accent)]' : 'hover:ring-1 hover:ring-admin-border'}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-frame-id', id);
          e.dataTransfer.setData('application/x-storyboard-ref', imageUrl);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={onClick}
      >
        <img src={imageUrl} alt="" className="w-full aspect-video object-cover rounded-admin-sm" />
        {/* Tint overlay */}
        {!isActive && <div className="absolute inset-0 rounded-admin-sm bg-black/35" />}
      </div>
      <div className="relative flex items-center justify-between mt-1 px-0.5 min-h-[1.5rem]">
        {/* Floating beat picker — absolutely positioned, doesn't shift layout */}
        {showBeatPicker && (
          <div
            ref={pickerRef}
            className={`absolute ${pickerAbove ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 z-50 bg-admin-bg-overlay border border-admin-border rounded-admin-sm shadow-lg overflow-hidden min-w-[120px]`}
          >
            <div className="px-3 py-1.5 border-b border-admin-border">
              <p className="text-admin-sm text-admin-text-muted">{pickerMode === 'move' ? 'Move to…' : 'Copy to…'}</p>
            </div>
            <div className="max-h-48 overflow-y-auto admin-scrollbar">
              {scenes?.map(sc => sc.beats.map((b, bi) => {
                let letter = '';
                let n = bi + 1;
                while (n > 0) { n--; letter = String.fromCharCode(65 + (n % 26)) + letter; n = Math.floor(n / 26); }
                return (
                  <button
                    key={b.id}
                    className="w-full text-left px-3 py-1.5 text-admin-sm text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                    onMouseDown={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (pickerMode === 'move') {
                        await moveFrameToBeat(id, b.id);
                        onMoved();
                      } else {
                        await duplicateFrame(id, b.id);
                      }
                      setShowBeatPicker(false);
                    }}
                  >{sc.sceneNumber}{letter}</button>
                );
              }))}
            </div>
          </div>
        )}
        <p className="text-admin-sm text-admin-text-faint truncate flex-1">{label ?? ''}</p>
        {/* Right: action buttons */}
        {!isSyntheticId && (
          <div className="flex items-center opacity-0 group-hover/sf:opacity-100 transition-opacity flex-shrink-0 ml-1">
            {confirmDelete ? (
              <>
                <button onClick={handleDelete} title="Confirm delete" className="w-6 h-6 flex items-center justify-center text-admin-danger hover:text-red-400 transition-colors flex-shrink-0"><Check size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} title="Cancel" className={btnCls}><X size={11} /></button>
              </>
            ) : (
              <>
                <button onClick={handleCopyToClipboard} title="Copy to clipboard" className={btnCls}><Clipboard size={11} /></button>
                <button onClick={handleDownload} title="Download" className={btnCls}><Download size={11} /></button>
                <button ref={triggerRef} onClick={(e) => openPicker(e, 'copy')} title="Copy to beat…" className={btnCls}><Copy size={11} /></button>
                <button onClick={(e) => openPicker(e, 'move')} title="Move to beat…" className={btnCls}><ArrowRight size={11} /></button>
                <button onClick={handleArchiveToggle} title={isArchived ? 'Show' : 'Hide'} className={`${btnCls} hover:!text-admin-warning`}>{isArchived ? <Eye size={11} /> : <EyeOff size={11} />}</button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} title="Delete" className={`${btnCls} hover:!text-admin-danger`}><Trash2 size={11} /></button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
