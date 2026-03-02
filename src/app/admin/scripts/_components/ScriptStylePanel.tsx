'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Upload, Trash2, Loader2, Save, Info } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import {
  updateScriptStyle,
  uploadStyleReference,
  deleteStyleReference,
} from '@/app/admin/actions';
import type {
  ScriptStyleRow,
  ScriptStyleReferenceRow,
  StoryboardGenerationMode,
  StoryboardStylePreset,
} from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  style: ScriptStyleRow | null;
  references: ScriptStyleReferenceRow[];
  onStyleChange: (style: ScriptStyleRow) => void;
  onReferencesChange: (refs: ScriptStyleReferenceRow[]) => void;
}

export const STYLE_PRESETS: Record<StoryboardStylePreset, { label: string; prompt: string; image: string }> = {
  sketch: {
    label: 'Sketch',
    prompt: 'Black and white pencil storyboard sketch. Hand-drawn with confident, loose strokes and cross-hatching for shading. Minimal detail — focus on composition, character blocking, and camera framing rather than fine detail. Rough perspective lines visible. No color whatsoever, purely graphite on white paper. Evokes the feel of a traditional storyboard artist\'s rapid visualization work — the kind of pre-production sketches taped to a corkboard on set. Slightly unfinished edges, imperfect but expressive linework. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
    image: '/images/storyboard-presets/sketch.png',
  },
  comic: {
    label: 'Comic',
    prompt: 'Full-color comic book illustration with bold, confident ink outlines and cel-shaded coloring. The image must be BORDERLESS and FULL-BLEED — content extends to every edge with NO panel borders, frames, rounded corners, or outer edges visible. Dynamic composition with dramatic angles and foreshortening. Rich, saturated color palette with strong complementary color choices. Dramatic directional lighting with deep shadows rendered in darker hues rather than black. Thick-to-thin line weight variation for depth and emphasis. Background elements simplified but present, with atmospheric color washes. Feels like a single frame pulled from a high-end graphic novel — think Moebius meets modern Marvel concept art. Expressive, stylized but grounded in real human proportions. ABSOLUTELY NO text, letters, words, captions, labels, titles, speech bubbles, sound effects, onomatopoeia, or watermarks of any kind. NO panel borders or frames around the image.',
    image: '/images/storyboard-presets/comic.png',
  },
  studio: {
    label: 'Studio',
    prompt: 'Clean professional studio photography look. Crisp edge-to-edge focus with a controlled studio lighting setup — key light, fill light, and subtle rim lighting. Vibrant but naturalistic color palette with punchy saturation. Perfectly balanced composition following rule of thirds. Soft, diffused shadows with clean falloff. Neutral or subtly textured backgrounds. Colors pop without being oversaturated — think high-end advertising or editorial photography. Skin tones are natural and well-lit. Every element feels intentional and art-directed. The overall feel is polished, premium, and commercially viable — like the final selects from a professional photo shoot. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
    image: '/images/storyboard-presets/studio.png',
  },
  cinematic: {
    label: 'Cinematic',
    prompt: 'Cinematic 35mm film photograph with the texture and character of analog filmmaking. Shallow depth of field with creamy bokeh from a fast prime lens (f/1.4–f/2.0). Rich, warm color grading reminiscent of golden hour — ambers, deep teals in the shadows, warm highlights. Natural available light with motivated practical sources visible in frame. Subtle film grain texture throughout. Anamorphic lens characteristics — gentle horizontal flares, slightly oval bokeh, mild barrel distortion at edges. Atmospheric haze or dust particles catching light. Feels like a still frame pulled from a Terrence Malick or Roger Deakins-shot film. Contemplative mood, cinematic aspect ratio framing with purposeful negative space. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
    image: '/images/storyboard-presets/cinematic.png',
  },
};

const PRESET_KEYS = Object.keys(STYLE_PRESETS) as StoryboardStylePreset[];

const ASPECT_RATIOS = ['16:9', '2:3', '1:1', '4:3'] as const;
const MODE_OPTIONS: { value: StoryboardGenerationMode; label: string }[] = [
  { value: 'beat', label: 'Per Beat' },
  { value: 'scene', label: 'Per Scene' },
];

export function ScriptStylePanel({
  open,
  onClose,
  style,
  references,
  onStyleChange,
  onReferencesChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Local editable state — only saved on explicit Save
  const [localPrompt, setLocalPrompt] = useState(style?.prompt ?? '');
  const [localPreset, setLocalPreset] = useState<StoryboardStylePreset | null>(style?.style_preset ?? null);
  const [localAspectRatio, setLocalAspectRatio] = useState(style?.aspect_ratio ?? '16:9');
  const [localMode, setLocalMode] = useState<StoryboardGenerationMode>(style?.generation_mode ?? 'beat');

  // Sync local state when style changes externally (e.g., opening a different script)
  useEffect(() => {
    if (!style) return;
    setLocalPrompt(style.prompt);
    setLocalPreset(style.style_preset);
    setLocalAspectRatio(style.aspect_ratio);
    setLocalMode(style.generation_mode);
  }, [style?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dirty detection
  const isDirty = useMemo(() => {
    if (!style) return false;
    return (
      localPrompt !== style.prompt ||
      localPreset !== style.style_preset ||
      localAspectRatio !== style.aspect_ratio ||
      localMode !== style.generation_mode
    );
  }, [style, localPrompt, localPreset, localAspectRatio, localMode]);

  // Save all changes
  const handleSave = useCallback(async () => {
    if (!style || !isDirty) return;
    setSaving(true);
    try {
      await updateScriptStyle(style.id, {
        prompt: localPrompt,
        style_preset: localPreset,
        aspect_ratio: localAspectRatio,
        generation_mode: localMode,
      });
      onStyleChange({
        ...style,
        prompt: localPrompt,
        style_preset: localPreset,
        aspect_ratio: localAspectRatio,
        generation_mode: localMode,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [style, isDirty, localPrompt, localPreset, localAspectRatio, localMode, onStyleChange, onClose]);

  // Close guard
  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleDiscard = useCallback(() => {
    // Reset local state to saved
    if (style) {
      setLocalPrompt(style.prompt);
      setLocalPreset(style.style_preset);
      setLocalAspectRatio(style.aspect_ratio);
      setLocalMode(style.generation_mode);
    }
    setConfirmClose(false);
    onClose();
  }, [style, onClose]);

  // Reference image handlers (these save immediately — not part of dirty tracking)
  const handleUpload = async (files: FileList | null) => {
    if (!files || !style) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const result = await uploadStyleReference(style.id, fd);
        const newRef: ScriptStyleReferenceRow = {
          id: result.id,
          style_id: style.id,
          image_url: result.image_url,
          storage_path: result.storage_path,
          sort_order: references.length,
          created_at: new Date().toISOString(),
        };
        onReferencesChange([...references, newRef]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRef = async (refId: string) => {
    await deleteStyleReference(refId);
    onReferencesChange(references.filter((r) => r.id !== refId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  if (!style) return null;

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[620px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight">Style</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto admin-scrollbar p-6 space-y-6">
          {/* Style Presets — horizontal slider */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
              Style Preset
            </label>
            <div className="flex gap-3 overflow-x-auto admin-scrollbar py-1 -mx-6 pl-6">
              {/* None option */}
              <div className="relative flex-shrink-0 w-[260px]">
                <button
                  onClick={() => setLocalPreset(null)}
                  className={`relative w-full flex flex-col items-center justify-center gap-2 rounded-lg p-2.5 transition-all h-full ${
                    localPreset === null
                      ? 'ring-2 ring-admin-accent bg-admin-bg-active'
                      : 'bg-admin-bg-hover hover:bg-admin-bg-active/50'
                  }`}
                >
                  <div className="w-full aspect-video rounded-md flex items-center justify-center bg-admin-bg-base border border-admin-border-subtle">
                    <span className="text-admin-text-ghost text-sm">No preset</span>
                  </div>
                  <span className={`text-xs font-medium ${localPreset === null ? 'text-admin-text-primary' : 'text-admin-text-muted'}`}>
                    None
                  </span>
                </button>
              </div>
              {PRESET_KEYS.map((key) => {
                const preset = STYLE_PRESETS[key];
                const isActive = localPreset === key;
                return (
                  <div key={key} className="relative flex-shrink-0 w-[260px]">
                    <button
                      onClick={() => setLocalPreset(key)}
                      className={`relative w-full flex flex-col items-center gap-2 rounded-lg p-2.5 transition-all ${
                        isActive
                          ? 'ring-2 ring-admin-accent bg-admin-bg-active'
                          : 'bg-admin-bg-hover hover:bg-admin-bg-active/50'
                      }`}
                    >
                      <div className="w-full aspect-video rounded-md overflow-hidden">
                        <img
                          src={preset.image}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className={`text-xs font-medium ${isActive ? 'text-admin-text-primary' : 'text-admin-text-muted'}`}>
                        {preset.label}
                      </span>
                    </button>
                    {/* Info icon — hover to reveal prompt */}
                    <div className="group/info absolute top-3 right-3 z-10">
                      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-colors cursor-default">
                        <Info size={10} />
                      </div>
                      <div className="hidden group-hover/info:block absolute right-0 top-full mt-1 w-64 p-3 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl z-50">
                        <p className="text-[11px] text-admin-text-secondary leading-relaxed">
                          {preset.prompt}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Right-edge padding spacer */}
              <div className="flex-shrink-0 w-3" aria-hidden />
            </div>
          </div>

          {/* Additional Style Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
              Additional Style Notes
            </label>
            <textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              placeholder="Extra style instructions appended after preset. Describe lighting, color palette, mood, camera angles, textures, art direction references…"
              rows={4}
              className="admin-input w-full text-sm resize-vertical py-3 px-3 leading-relaxed"
            />
          </div>

          {/* Reference Images */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
              Reference Images
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                dragOver
                  ? 'border-admin-info bg-admin-info-bg/20'
                  : 'border-admin-border hover:border-admin-text-ghost'
              }`}
            >
              {references.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {references.map((ref) => (
                    <div key={ref.id} className="group/img relative aspect-video rounded-lg overflow-hidden bg-admin-bg-hover">
                      <img
                        src={ref.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleDeleteRef(ref.id)}
                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-admin-danger"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                  {/* Add more button */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="aspect-video rounded-lg border-2 border-dashed border-admin-border flex items-center justify-center text-admin-text-ghost hover:text-admin-text-muted hover:border-admin-text-ghost transition-colors"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-6 flex flex-col items-center gap-2 text-admin-text-ghost hover:text-admin-text-muted transition-colors"
                >
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                  <span className="text-xs">Drop images or click to upload</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
              Aspect Ratio
            </label>
            <div className="flex items-center gap-1">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setLocalAspectRatio(ratio)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    localAspectRatio === ratio
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Mode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
              Generation Mode
            </label>
            <div className="flex items-center gap-1">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLocalMode(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    localMode === opt.value
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — Save action bar */}
        <div className="px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
          <span className="text-xs text-admin-text-faint">
            {isDirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>

        {/* Discard changes dialog */}
        <DiscardChangesDialog
          open={confirmClose}
          onKeepEditing={() => setConfirmClose(false)}
          onDiscard={handleDiscard}
        />
      </div>
    </PanelDrawer>
  );
}
