'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import {
  updateScriptStyle,
  uploadStyleReference,
  deleteStyleReference,
} from '@/app/admin/actions';
import type {
  ScriptStyleRow,
  ScriptStyleReferenceRow,
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
  watercolor: {
    label: 'Watercolor',
    prompt: 'Soft watercolor painting with translucent washes of color bleeding into wet paper. Loose, expressive brushwork with visible paper texture. Colors blend organically at edges with beautiful granulation effects. Warm and cool tones coexist naturally. Composition is suggested rather than rigidly defined — some areas left as white paper for breathing room. Feels like a fine art storyboard from a Hayao Miyazaki pre-production bible. Dreamy, atmospheric, with a handmade quality that digital art cannot replicate. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
    image: '/images/storyboard-presets/watercolor.png',
  },
  noir: {
    label: 'Noir',
    prompt: 'High-contrast black and white film noir aesthetic. Deep, inky blacks and bright, blown-out highlights with minimal midtones. Dramatic chiaroscuro lighting — hard shadows cast by venetian blinds, streetlamps, or single overhead bulbs. Moody, atmospheric compositions with strong diagonal lines and Dutch angles. Smoke, rain, or fog catching shafts of light. Feels like a still from a 1940s detective film — Double Indemnity, The Third Man, or Touch of Evil. Gritty film grain, slightly soft focus. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
    image: '/images/storyboard-presets/noir.png',
  },
  documentary: {
    label: 'Documentary',
    prompt: 'Naturalistic documentary photography with an observational, fly-on-the-wall quality. Available light only — no studio setups. Slightly desaturated, true-to-life color palette. Medium depth of field keeping subject and environment both legible. Candid, unposed compositions that feel captured rather than constructed. Subtle motion blur on peripheral elements suggesting real-time observation. Feels like a frame from a Frederick Wiseman or Werner Herzog documentary — honest, unflinching, deeply human. Mild lens distortion from a wide-angle zoom. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
    image: '/images/storyboard-presets/documentary.png',
  },
  anime: {
    label: 'Anime',
    prompt: 'High-quality anime illustration in the style of modern theatrical anime production. Clean, precise linework with consistent line weights. Vibrant, saturated color palette with beautiful gradient shading. Detailed backgrounds with atmospheric perspective — lush environments rendered with care. Characters have expressive features with large, detailed eyes. Dynamic lighting with visible light rays, lens flares, and bloom effects. Feels like a key frame from a Studio Ghibli, Makoto Shinkai, or Ufotable production. Rich environmental storytelling with attention to small details. NEVER include any text, letters, words, captions, labels, titles, or watermarks of any kind.',
    image: '/images/storyboard-presets/anime.png',
  },
};

const PRESET_KEYS = Object.keys(STYLE_PRESETS) as StoryboardStylePreset[];

const ASPECT_RATIOS = ['16:9', '2:3', '1:1', '4:3'] as const;

type Tab = 'presets' | 'settings';

export function ScriptStylePanel({
  open,
  onClose,
  style,
  references,
  onStyleChange,
  onReferencesChange,
}: Props) {
  const [tab, setTab] = useState<Tab>('presets');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Local editable state
  const [localPrompt, setLocalPrompt] = useState(style?.prompt ?? '');
  const [localPreset, setLocalPreset] = useState<StoryboardStylePreset | null>(style?.style_preset ?? 'sketch');
  const [localAspectRatio, setLocalAspectRatio] = useState(style?.aspect_ratio ?? '16:9');

  // Keep a ref to latest local values so the autosave closure is always current
  const localRef = useRef({ localPrompt, localPreset, localAspectRatio });
  localRef.current = { localPrompt, localPreset, localAspectRatio };

  // Autosave
  const { status, trigger, flush } = useAutoSave(
    useCallback(async () => {
      if (!style) return;
      const { localPrompt: p, localPreset: pr, localAspectRatio: ar } = localRef.current;
      await updateScriptStyle(style.id, {
        prompt: p,
        style_preset: pr,
        aspect_ratio: ar,
        generation_mode: style.generation_mode,
      });
      onStyleChange({
        ...style,
        prompt: p,
        style_preset: pr,
        aspect_ratio: ar,
      });
    }, [style, onStyleChange]),
  );

  // Sync local state when style changes externally (e.g., opening a different script)
  useEffect(() => {
    if (!style) return;
    setLocalPrompt(style.prompt);
    setLocalPreset(style.style_preset ?? 'sketch');
    setLocalAspectRatio(style.aspect_ratio);
  }, [style?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chat panel context
  const { setPanelContext } = useChatContext();

  useEffect(() => {
    if (!style?.id) return;
    const lines: string[] = [];
    if (localPreset) lines.push(`Style Preset: ${STYLE_PRESETS[localPreset].label}`);
    else lines.push('Style Preset: None');
    lines.push(`Aspect Ratio: ${localAspectRatio}`);
    if (localPreset) lines.push(`Pre-prompt: ${STYLE_PRESETS[localPreset].prompt.slice(0, 200)}...`);
    if (localPrompt) lines.push(`Additional Style Notes: ${localPrompt}`);
    if (style.generation_mode) lines.push(`Generation Mode: ${style.generation_mode}`);
    if (references.length > 0) lines.push(`Reference Images: ${references.length}`);
    setPanelContext({
      recordType: 'script-style',
      recordId: style.id,
      recordLabel: localPreset ? `Style — ${STYLE_PRESETS[localPreset].label}` : 'Style — Custom',
      summary: lines.join('\n'),
    });
    return () => setPanelContext(null);
  }, [style, localPreset, localPrompt, localAspectRatio, references, setPanelContext]);

  // Close — flush pending saves, then close
  const handleClose = useCallback(async () => {
    await flush();
    onClose();
  }, [flush, onClose]);

  // Field updaters that trigger autosave
  const updatePreset = (v: StoryboardStylePreset | null) => { setLocalPreset(v); trigger(); };
  const updatePrompt = (v: string) => { setLocalPrompt(v); trigger(); };
  const updateAspectRatio = (v: string) => { setLocalAspectRatio(v); trigger(); };

  // Reference image handlers (save immediately)
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

  const presetPrompt = localPreset ? STYLE_PRESETS[localPreset].prompt : '';

  if (!style) return null;

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[620px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight">Style</h2>
          <div className="flex items-center">
            <SaveDot status={status} />
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
          {(['presets', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t
                  ? 'bg-admin-bg-active text-admin-text-primary'
                  : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
              }`}
            >
              {t === 'presets' ? 'Presets' : 'Settings'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-5">
          {tab === 'presets' ? (
            <>
              {/* 3x3 Preset Grid */}
              <div className="grid grid-cols-3 gap-3">
                {PRESET_KEYS.map((key) => {
                  const preset = STYLE_PRESETS[key];
                  const isActive = localPreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => updatePreset(key)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all ${
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
                  );
                })}
                {/* None — bottom right (9th cell) */}
                <button
                  onClick={() => updatePreset(null)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 rounded-lg p-2 transition-all ${
                    localPreset === null
                      ? 'ring-2 ring-admin-accent bg-admin-bg-active'
                      : 'bg-admin-bg-hover hover:bg-admin-bg-active/50'
                  }`}
                >
                  <div className="w-full aspect-video rounded-md flex items-center justify-center bg-admin-bg-base border border-admin-border-subtle">
                    <span className="text-admin-text-ghost text-xs">No preset</span>
                  </div>
                  <span className={`text-xs font-medium ${localPreset === null ? 'text-admin-text-primary' : 'text-admin-text-muted'}`}>
                    None
                  </span>
                </button>
              </div>

              {/* Pre-prompt Preview */}
              <div>
                <label className="admin-label">Pre-prompt Preview</label>
                <p className="text-sm leading-relaxed text-admin-text-muted mt-1">
                  {presetPrompt || <span className="text-admin-text-ghost">No preset selected</span>}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Additional Style Notes */}
              <div>
                <label className="admin-label">Additional Style Notes</label>
                <textarea
                  value={localPrompt}
                  onChange={(e) => updatePrompt(e.target.value)}
                  placeholder="Extra style instructions appended after preset. Describe lighting, color palette, mood, camera angles, textures, art direction references..."
                  rows={6}
                  className="admin-input w-full resize-none"
                />
              </div>

              {/* Reference Images */}
              <div>
                <label className="admin-label">Reference Images</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`mt-1 border-2 border-dashed rounded-lg p-4 transition-colors ${
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
                      <span className="text-admin-sm">Drop images or click to upload</span>
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
              <div>
                <label className="admin-label">Aspect Ratio</label>
                <div className="flex items-center gap-1 mt-1">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => updateAspectRatio(ratio)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        localAspectRatio === ratio
                          ? 'bg-admin-bg-active text-admin-text-primary'
                          : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <PanelFooter onSave={() => flush()} />
      </div>
    </PanelDrawer>
  );
}
