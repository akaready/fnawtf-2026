'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, ChevronRight, ChevronLeft, Check, X, MapPin, Users, Eye, AlertCircle, Trash2 } from 'lucide-react';
import { StylePresetCard } from './StylePresetCard';
import { ColorPicker } from './ColorPicker';
import { STYLE_PRESETS } from './ScriptStylePanel';
import { createScriptFromExtract } from '@/app/admin/actions';
import type { ExtractedScriptData } from '@/app/admin/actions';
import type { ScriptCharacterRow, ScriptLocationRow, ScriptCharacterType, StoryboardStylePreset, IntExt } from '@/types/scripts';
import type { RewriteLevel } from '@/app/api/admin/script-extract/route';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  scratchContent: string;
  existingCharacters: ScriptCharacterRow[];
  existingLocations: ScriptLocationRow[];
  nextVersionLabel: string;
  onVersionCreated: (newScriptId: string) => void;
}

type Step = 'rewrite-level' | 'loading' | 'characters' | 'locations' | 'style' | 'preview' | 'confirming' | 'error';

interface EditableCharacter {
  name: string;
  description: string;
  color: string;
  character_type: ScriptCharacterType;
  isExisting: boolean;
}

interface EditableLocation {
  name: string;
  description: string;
  color: string;
  isExisting: boolean;
}

interface ExtractedScene {
  location_name: string;
  int_ext: IntExt;
  time_of_day: string;
  beats: Array<{ audio_content: string; visual_content: string; notes_content: string }>;
}

interface StyleChoice {
  style_preset: StoryboardStylePreset | null;
  aspect_ratio: string;
  prompt: string;
}

const REWRITE_OPTIONS: { value: RewriteLevel; label: string; description: string }[] = [
  { value: 'preserve', label: 'Preserve Original', description: 'No changes at all, just moves content to the right place' },
  { value: 'grammar', label: 'Grammar Only', description: 'Capitalizing, adding periods, basic punctuation fixes' },
  { value: 'light', label: 'Light Cleanup', description: 'Grammar and clarity improvements, keeps your voice' },
  { value: 'production', label: 'Production Rewrite', description: 'Expand and add detail while preserving your intent' },
];

const ASPECT_RATIOS = ['16:9', '2:3', '1:1', '4:3'] as const;
const PRESET_KEYS = Object.keys(STYLE_PRESETS) as StoryboardStylePreset[];

const STEPS: Step[] = ['rewrite-level', 'characters', 'locations', 'style', 'preview'];

export function ScriptExtractModal({ open, onClose, scriptId, scratchContent, existingCharacters, existingLocations, nextVersionLabel, onVersionCreated }: Props) {
  const [step, setStep] = useState<Step>('rewrite-level');
  const [rewriteLevel, setRewriteLevel] = useState<RewriteLevel>('light');
  const [characters, setCharacters] = useState<EditableCharacter[]>([]);
  const [locations, setLocations] = useState<EditableLocation[]>([]);
  const [scenes, setScenes] = useState<ExtractedScene[]>([]);
  const [styleChoice, setStyleChoice] = useState<StyleChoice>({ style_preset: null, aspect_ratio: '16:9', prompt: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [hasExtracted, setHasExtracted] = useState(false);
  const [confirmDeleteChar, setConfirmDeleteChar] = useState<number | null>(null);
  const [confirmDeleteLoc, setConfirmDeleteLoc] = useState<number | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('rewrite-level');
      setRewriteLevel('light');
      setCharacters([]);
      setLocations([]);
      setScenes([]);
      setStyleChoice({ style_preset: null, aspect_ratio: '16:9', prompt: '' });
      setErrorMessage('');
      setHasExtracted(false);
      setConfirmDeleteChar(null);
      setConfirmDeleteLoc(null);
    }
  }, [open]);

  const runExtraction = useCallback(async () => {
    setStep('loading');
    try {
      const res = await fetch('/api/admin/script-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          scratchContent,
          rewriteLevel,
          existingCharacters: existingCharacters.map(c => ({ name: c.name, color: c.color, character_type: c.character_type })),
          existingLocations: existingLocations.map(l => ({ name: l.name, color: l.color })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMessage(err.error ?? 'Extraction failed');
        setStep('error');
        return;
      }

      const { extracted } = await res.json();

      // Pre-match characters to existing ones
      const editableChars: EditableCharacter[] = (extracted.characters ?? []).map((ch: EditableCharacter) => {
        const existing = existingCharacters.find(e => e.name.toLowerCase() === ch.name.toLowerCase());
        return {
          name: ch.name,
          description: ch.description ?? '',
          color: existing?.color ?? ch.color ?? '#a14dfd',
          character_type: existing?.character_type ?? ch.character_type ?? 'vo',
          isExisting: !!existing,
        };
      });

      // Pre-match locations
      const editableLocs: EditableLocation[] = (extracted.locations ?? []).map((loc: EditableLocation) => {
        const existing = existingLocations.find(e => e.name.toLowerCase() === loc.name.toLowerCase());
        return {
          name: loc.name,
          description: loc.description ?? '',
          color: existing?.color ?? loc.color ?? '#38bdf8',
          isExisting: !!existing,
        };
      });

      setCharacters(editableChars);
      setLocations(editableLocs);
      setScenes(extracted.scenes ?? []);
      setHasExtracted(true);
      setStep('characters');
    } catch (err) {
      setErrorMessage(String(err));
      setStep('error');
    }
  }, [scriptId, scratchContent, rewriteLevel, existingCharacters, existingLocations]);

  const handleConfirm = useCallback(async () => {
    setStep('confirming');
    try {
      const data: ExtractedScriptData = {
        characters: characters.map(c => ({
          name: c.name,
          description: c.description,
          color: c.color,
          character_type: c.character_type,
        })),
        locations: locations.map(l => ({
          name: l.name,
          description: l.description,
          color: l.color,
        })),
        scenes,
        style: styleChoice.style_preset ? styleChoice : null,
      };

      const newScriptId = await createScriptFromExtract(scriptId, data);
      onVersionCreated(newScriptId);
    } catch (err) {
      setErrorMessage(String(err));
      setStep('error');
    }
  }, [scriptId, characters, locations, scenes, styleChoice, onVersionCreated]);

  const updateCharacter = (idx: number, updates: Partial<EditableCharacter>) => {
    setCharacters(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c));
  };

  const removeCharacter = (idx: number) => {
    setCharacters(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLocation = (idx: number, updates: Partial<EditableLocation>) => {
    setLocations(prev => prev.map((l, i) => i === idx ? { ...l, ...updates } : l));
  };

  const removeLocation = (idx: number) => {
    setLocations(prev => prev.filter((_, i) => i !== idx));
  };

  if (!open) return null;

  const totalBeats = scenes.reduce((sum, s) => sum + s.beats.length, 0);
  const currentStepIdx = STEPS.indexOf(step as Step);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step !== 'loading' && step !== 'confirming' ? onClose : undefined} />

      {/* Modal card — constant size */}
      <div className="relative bg-admin-bg-overlay border border-admin-border rounded-admin-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-raised">
          <h2 className="text-admin-lg font-admin-display font-semibold text-admin-text-primary">
            {step === 'rewrite-level' && 'Convert to Table'}
            {step === 'loading' && 'Analyzing Script...'}
            {step === 'characters' && 'Review Characters'}
            {step === 'locations' && 'Review Locations'}
            {step === 'style' && 'Style Preset'}
            {step === 'preview' && 'Scene Preview'}
            {step === 'confirming' && 'Creating Version...'}
            {step === 'error' && 'Error'}
          </h2>
          {step !== 'loading' && step !== 'confirming' && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-4">
          {/* Step: Rewrite Level */}
          {step === 'rewrite-level' && (
            <div className="space-y-4">
              <p className="text-sm text-admin-text-secondary">
                How should the AI handle your writing when organizing it into scenes and beats?
              </p>
              <div className="space-y-2">
                {REWRITE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRewriteLevel(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-admin-md border transition-colors ${
                      rewriteLevel === opt.value
                        ? 'border-admin-text-primary bg-admin-bg-active'
                        : 'border-admin-border hover:bg-admin-bg-hover'
                    }`}
                  >
                    <div className="text-sm font-semibold text-admin-text-primary">{opt.label}</div>
                    <div className="text-xs text-admin-text-muted mt-0.5">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={32} className="animate-spin text-admin-text-muted" />
              <p className="text-sm text-admin-text-muted">Analyzing your scratchpad and extracting structure...</p>
            </div>
          )}

          {/* Step: Characters */}
          {step === 'characters' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                <Users size={14} />
                <span>{characters.length} character{characters.length !== 1 ? 's' : ''} found</span>
              </div>
              {characters.length === 0 && (
                <p className="text-sm text-admin-text-faint italic">No characters detected. You can add them later.</p>
              )}
              {characters.map((ch, i) => (
                <div key={i} className="rounded-admin-md overflow-hidden" style={{ borderTop: `1px solid ${ch.color}40`, borderRight: `1px solid ${ch.color}40`, borderBottom: `1px solid ${ch.color}40`, borderLeft: `3px solid ${ch.color}` }}>
                  <div className="flex items-center justify-between px-4 py-3 bg-admin-bg-inset" style={{ borderBottom: `1px solid ${ch.color}20` }}>
                    <div className="flex items-center gap-2.5">
                      <ColorPicker value={ch.color} onChange={color => updateCharacter(i, { color })} />
                      <input
                        value={ch.name}
                        onChange={e => updateCharacter(i, { name: e.target.value })}
                        className="admin-input px-3 py-1.5 text-sm font-semibold w-48"
                      />
                      {ch.isExisting && (
                        <span className="text-[10px] uppercase tracking-wider text-admin-text-faint bg-admin-bg-inset px-1.5 py-0.5 rounded border border-admin-border">
                          Existing
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* OS / VO toggle */}
                      <div className="flex rounded-admin-sm border border-admin-border overflow-hidden">
                        <button
                          onClick={() => updateCharacter(i, { character_type: 'actor' })}
                          className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            ch.character_type === 'actor'
                              ? 'bg-admin-bg-active text-admin-text-primary'
                              : 'text-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover'
                          }`}
                        >
                          OS
                        </button>
                        <button
                          onClick={() => updateCharacter(i, { character_type: 'vo' })}
                          className={`px-2.5 py-1 text-[11px] font-semibold border-l border-admin-border transition-colors ${
                            ch.character_type === 'vo'
                              ? 'bg-admin-bg-active text-admin-text-primary'
                              : 'text-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover'
                          }`}
                        >
                          VO
                        </button>
                      </div>
                      {/* Two-state delete */}
                      {confirmDeleteChar === i ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { removeCharacter(i); setConfirmDeleteChar(null); }} className="btn-ghost-danger w-7 h-7 flex items-center justify-center">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setConfirmDeleteChar(null)} className="btn-ghost w-7 h-7 flex items-center justify-center">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteChar(i)} className="btn-ghost-danger w-7 h-7 flex items-center justify-center">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <textarea
                      value={ch.description}
                      onChange={e => updateCharacter(i, { description: e.target.value })}
                      placeholder="Character description..."
                      rows={2}
                      className="admin-input w-full px-3 py-2.5 text-sm resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step: Locations */}
          {step === 'locations' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                <MapPin size={14} />
                <span>{locations.length} location{locations.length !== 1 ? 's' : ''} found</span>
              </div>
              {locations.length === 0 && (
                <p className="text-sm text-admin-text-faint italic">No locations detected. You can add them later.</p>
              )}
              {locations.map((loc, i) => (
                <div key={i} className="rounded-admin-md overflow-hidden" style={{ borderTop: `1px solid ${loc.color}40`, borderRight: `1px solid ${loc.color}40`, borderBottom: `1px solid ${loc.color}40`, borderLeft: `3px solid ${loc.color}` }}>
                  <div className="flex items-center justify-between px-4 py-3 bg-admin-bg-inset" style={{ borderBottom: `1px solid ${loc.color}20` }}>
                    <div className="flex items-center gap-2.5">
                      <ColorPicker value={loc.color} onChange={color => updateLocation(i, { color })} />
                      <input
                        value={loc.name}
                        onChange={e => updateLocation(i, { name: e.target.value.toUpperCase() })}
                        className="admin-input px-3 py-1.5 text-sm font-semibold uppercase w-48"
                      />
                      {loc.isExisting && (
                        <span className="text-[10px] uppercase tracking-wider text-admin-text-faint bg-admin-bg-inset px-1.5 py-0.5 rounded border border-admin-border">
                          Existing
                        </span>
                      )}
                    </div>
                    {/* Two-state delete */}
                    {confirmDeleteLoc === i ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { removeLocation(i); setConfirmDeleteLoc(null); }} className="btn-ghost-danger w-7 h-7 flex items-center justify-center">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setConfirmDeleteLoc(null)} className="btn-ghost w-7 h-7 flex items-center justify-center">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteLoc(i)} className="btn-ghost-danger w-7 h-7 flex items-center justify-center">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <textarea
                      value={loc.description}
                      onChange={e => updateLocation(i, { description: e.target.value })}
                      placeholder="Location description..."
                      rows={2}
                      className="admin-input w-full px-3 py-2.5 text-sm resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step: Style */}
          {step === 'style' && (
            <div className="space-y-6">
              <p className="text-sm text-admin-text-secondary">
                Optionally choose a storyboard style. You can skip this and set it later.
              </p>

              {/* Preset grid — 3 columns */}
              <div className="grid grid-cols-3 gap-3">
                {PRESET_KEYS.map(key => {
                  const preset = STYLE_PRESETS[key];
                  const isActive = styleChoice.style_preset === key;
                  return (
                    <StylePresetCard
                      key={key}
                      presetKey={key}
                      label={preset.label}
                      image={preset.image}
                      prompt={preset.prompt}
                      isActive={isActive}
                      onClick={() => setStyleChoice(prev => ({ ...prev, style_preset: isActive ? null : key }))}
                    />
                  );
                })}
                {/* None option */}
                <button
                  onClick={() => setStyleChoice(prev => ({ ...prev, style_preset: null }))}
                  className={`relative rounded-admin-md overflow-hidden border-2 transition-colors aspect-video ${
                    styleChoice.style_preset === null ? 'border-admin-text-primary' : 'border-admin-border hover:border-admin-border-subtle'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-admin-bg-inset">
                    <span className="text-admin-text-faint text-xs">No preset</span>
                  </div>
                  {styleChoice.style_preset === null && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-admin-text-primary rounded-full flex items-center justify-center z-10">
                      <Check size={11} className="text-admin-bg-base" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2.5 py-2 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-xs font-semibold text-white leading-none">None</span>
                  </div>
                </button>
              </div>

              {/* Aspect ratio */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Aspect Ratio</label>
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map(ar => (
                    <button
                      key={ar}
                      onClick={() => setStyleChoice(prev => ({ ...prev, aspect_ratio: ar }))}
                      className={`px-3 py-1.5 text-xs rounded-admin-md border transition-colors ${
                        styleChoice.aspect_ratio === ar
                          ? 'border-admin-text-primary bg-admin-bg-active text-admin-text-primary'
                          : 'border-admin-border text-admin-text-muted hover:bg-admin-bg-hover'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Custom Style Notes</label>
                <textarea
                  value={styleChoice.prompt}
                  onChange={e => setStyleChoice(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Additional style instructions (optional)..."
                  rows={2}
                  className="admin-input w-full px-3 py-2.5 text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Step: Preview — mini column layout mimicking the script editor */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                <Eye size={14} />
                <span>{scenes.length} scene{scenes.length !== 1 ? 's' : ''}, {totalBeats} beat{totalBeats !== 1 ? 's' : ''}</span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[40px_1fr_1fr] gap-0 text-[10px] uppercase tracking-widest font-semibold text-admin-text-faint">
                <div />
                <div className="px-3 py-1.5 border-b-2 border-admin-border">Audio</div>
                <div className="px-3 py-1.5 border-b-2" style={{ borderColor: 'var(--admin-info)' }}>Visual</div>
              </div>

              {scenes.map((scene, i) => {
                const locMatch = locations.find(l => l.name.toLowerCase() === scene.location_name.toLowerCase());
                const locColor = locMatch?.color ?? 'var(--admin-info)';
                return (
                  <div key={i} className="border border-admin-border rounded-admin-md overflow-hidden">
                    {/* Scene header */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-admin-bg-inset border-b border-admin-border">
                      <span className="text-xs font-admin-mono text-admin-text-faint">{i + 1}</span>
                      <MapPin size={12} style={{ color: locColor }} />
                      <span className="text-xs font-semibold text-admin-text-primary">
                        {scene.int_ext}. {scene.location_name} &mdash; {scene.time_of_day}
                      </span>
                    </div>
                    {/* Beats in column layout */}
                    {scene.beats.map((beat, j) => (
                      <div key={j} className="grid grid-cols-[40px_1fr_1fr] gap-0 border-b border-admin-border-subtle last:border-b-0">
                        {/* Beat letter gutter */}
                        <div className="flex items-start justify-center pt-2 text-[10px] font-admin-mono text-admin-text-faint">
                          {String.fromCharCode(65 + j)}
                        </div>
                        {/* Audio column */}
                        <div className="px-3 py-2 text-xs text-admin-text-secondary border-l-2 border-admin-border">
                          {beat.audio_content || <span className="text-admin-text-faint italic">&mdash;</span>}
                        </div>
                        {/* Visual column */}
                        <div className="px-3 py-2 text-xs text-admin-text-secondary border-l-2" style={{ borderColor: 'var(--admin-info)' }}>
                          {beat.visual_content || <span className="text-admin-text-faint italic">&mdash;</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step: Confirming */}
          {step === 'confirming' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={32} className="animate-spin text-admin-text-muted" />
              <p className="text-sm text-admin-text-muted">Creating {nextVersionLabel} with structured content...</p>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertCircle size={32} className="text-admin-danger" />
              <p className="text-sm text-admin-text-primary text-center max-w-md">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer — navigation buttons */}
        {step !== 'loading' && step !== 'confirming' && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-admin-border bg-admin-bg-raised">
            <div>
              {step === 'rewrite-level' && (
                <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              )}
              {step === 'characters' && (
                <button onClick={() => setStep('rewrite-level')} className="btn-secondary px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              {step === 'locations' && (
                <button onClick={() => setStep('characters')} className="btn-secondary px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronLeft size={14} /> Characters
                </button>
              )}
              {step === 'style' && (
                <button onClick={() => setStep('locations')} className="btn-secondary px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronLeft size={14} /> Locations
                </button>
              )}
              {step === 'preview' && (
                <button onClick={() => setStep('style')} className="btn-secondary px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronLeft size={14} /> Style
                </button>
              )}
              {step === 'error' && (
                <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Close</button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Step indicators */}
              {STEPS.includes(step as Step) && (
                <div className="flex items-center gap-1 mr-4">
                  {STEPS.map((s, i) => (
                    <div
                      key={s}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        s === step ? 'bg-admin-text-primary' : i < currentStepIdx ? 'bg-admin-text-muted' : 'bg-admin-border'
                      }`}
                    />
                  ))}
                </div>
              )}

              {step === 'rewrite-level' && (
                <div className="flex items-center gap-2">
                  {hasExtracted && (
                    <button onClick={() => setStep('characters')} className="btn-secondary px-4 py-2 text-sm">
                      Skip to Review
                    </button>
                  )}
                  <button onClick={runExtraction} className="btn-primary px-5 py-2 text-sm">
                    {hasExtracted ? 'Re-analyze' : 'Analyze'}
                  </button>
                </div>
              )}
              {step === 'characters' && (
                <button onClick={() => setStep('locations')} className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
                  Locations <ChevronRight size={14} />
                </button>
              )}
              {step === 'locations' && (
                <button onClick={() => setStep('style')} className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
                  Style <ChevronRight size={14} />
                </button>
              )}
              {step === 'style' && (
                <button onClick={() => setStep('preview')} className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
                  Preview <ChevronRight size={14} />
                </button>
              )}
              {step === 'preview' && (
                <button onClick={handleConfirm} className="btn-primary px-5 py-2 text-sm">
                  Create {nextVersionLabel}
                </button>
              )}
              {step === 'error' && (
                <button onClick={() => setStep('rewrite-level')} className="btn-primary px-4 py-2 text-sm">
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
