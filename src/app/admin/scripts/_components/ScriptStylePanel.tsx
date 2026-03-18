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

// Shared prohibition header prepended to every preset prompt.
const PRESET_PROHIBITIONS = 'NO TEXT anywhere in the image — not on whiteboards (show them blank), not on screens (show abstract glowing shapes), not as captions, overlays, statistics, infographics, frame numbers, or directional arrows. NO BORDERS: no storyboard panel frames, no rectangular outlines, no decorative edges drawn within the image. Art fills every pixel edge-to-edge. ';

export const STYLE_PRESETS: Record<StoryboardStylePreset, { label: string; prompt: string; image: string }> = {
  sketch: {
    label: 'Sketch',
    prompt: PRESET_PROHIBITIONS +
      'Hand-drawn pencil storyboard sketch on white paper. Strict color palette: pure black graphite lines and neutral cool-gray wash fills only — absolutely no warm tones, no sepia, no blue tints, no hue shifts of any kind. Every frame in this storyboard uses identical line weight (medium, confident strokes), identical gray wash shading, and identical white paper ground. Medium-weight pencil with cross-hatching for shadow depth. Loose perspective lines visible. Focus on composition, character blocking, and camera framing (medium shots, close-ups, wide establishing frames) rather than fine rendering detail. Slightly unfinished edges, imperfect but expressive. Evokes a traditional storyboard artist\'s rapid pre-production visualization.',
    image: '/images/storyboard-presets/sketch.png',
  },
  comic: {
    label: 'Comic',
    prompt: PRESET_PROHIBITIONS +
      'Full-color comic book illustration. Bold, confident ink outlines with thick-to-thin line weight variation. Cel-shaded coloring with a rich, saturated palette — strong complementary color choices, deep shadows in darker hues rather than black. Dramatic directional lighting (key light at 45°, strong rim light on opposite side). Dynamic composition: low-angle perspectives, dramatic foreshortening, purposeful negative space. Background elements present but atmospheric — color washes with simplified detail. Art fills every pixel to the frame edge; completely borderless. Feels like a single frame from a high-end graphic novel — Moebius meets modern Marvel concept art. Expressive, stylized but grounded in real human proportions.',
    image: '/images/storyboard-presets/comic.png',
  },
  studio: {
    label: 'Studio',
    prompt: PRESET_PROHIBITIONS +
      'Clean professional studio illustration rendered in a photorealistic style. Controlled three-point lighting setup: warm key light from upper-left, soft fill light from right, subtle rim light separating subject from background. Vibrant but naturalistic color palette with punchy saturation. Composition following rule of thirds with subjects placed at intersection points. Neutral or subtly textured backgrounds — solid gradients or minimal environmental context. Skin tones natural and well-lit with clean shadow falloff. Every element intentional and art-directed. Polished, premium, commercially viable — like a high-end advertising visual. Spatial anchors: subjects positioned clearly in relation to foreground and background elements.',
    image: '/images/storyboard-presets/studio.png',
  },
  cinematic: {
    label: 'Cinematic',
    prompt: PRESET_PROHIBITIONS +
      'Cinematic still rendered in the style of 35mm analog filmmaking. Shallow depth of field with creamy bokeh (f/1.4–f/2.0 fast prime). Rich color grading: warm ambers and honey tones in highlights, deep teals in shadows. Motivated practical light sources visible in frame — window light, lamp glow, street light. Subtle analog film grain throughout. Anamorphic lens characteristics: gentle horizontal lens flares, slightly oval bokeh, mild barrel distortion at frame edges. Atmospheric haze or dust particles catching shafts of light. Purposeful negative space. Feels like a still from a Terrence Malick or Roger Deakins production — contemplative, emotionally resonant. Camera language: wide establishing shots, intimate medium close-ups, low-angle perspectives.',
    image: '/images/storyboard-presets/cinematic.png',
  },
  watercolor: {
    label: 'Watercolor',
    prompt: PRESET_PROHIBITIONS +
      'Soft watercolor painting on textured cold-press paper. Translucent washes of muted, harmonious color bleeding organically at wet edges. Granulation effects where pigment pools in paper texture. Warm and cool tones coexist — blues and greens for backgrounds, warm ochres and rose for subjects. Composition suggested rather than rigidly defined: some areas left as bare white paper for breathing room, edges softly dissolving. Consistent loose expressive brushwork throughout — never tight or digital-feeling. Dreamy and atmospheric. Feels like a fine art storyboard from a Hayao Miyazaki pre-production bible. Every frame uses the same paper texture, same color temperature palette, same loose wet-on-wet technique.',
    image: '/images/storyboard-presets/watercolor.png',
  },
  noir: {
    label: 'Noir',
    prompt: PRESET_PROHIBITIONS +
      'High-contrast black and white film noir. Pure monochrome — no color, no warm or cool tinting, no sepia. Deep inky blacks and blown-out whites with minimal midtone gradation (strong chiaroscuro). Dramatic hard-shadow lighting: venetian blind shadows, single overhead practical bulb, streetlamp shaft of light. Strong Dutch angles and diagonal compositions. Environmental atmosphere: cigarette smoke, rain on glass, fog catching light. Gritty analog film grain. Feels like a still from Double Indemnity or Touch of Evil. Camera language: low-angle shots looking up, tight close-ups on faces, wide shots with dramatic foreground elements. Every frame: same high-contrast monochrome treatment, same grain texture, same hard-shadow technique.',
    image: '/images/storyboard-presets/noir.png',
  },
  documentary: {
    label: 'Documentary',
    prompt: PRESET_PROHIBITIONS +
      'Observational documentary photography illustration. Available natural light only — no studio setups, no artificial fill. Slightly desaturated, true-to-life color palette with honest, unmanipulated tones. Medium depth of field keeping both subject and surrounding environment readable. Candid, unposed compositions that feel captured in the moment rather than staged. Subtle motion blur on peripheral elements suggesting real-time observation. Wide-angle lens with mild barrel distortion. Camera language: handheld-feel framing with slight horizon tilt, subjects caught mid-action, environment providing context. Feels like Werner Herzog or Frederick Wiseman — deeply human, fly-on-the-wall. Every frame: same desaturated palette, same available-light quality, same candid composition approach.',
    image: '/images/storyboard-presets/documentary.png',
  },
  anime: {
    label: 'Anime',
    prompt: PRESET_PROHIBITIONS +
      'High-quality theatrical anime key frame illustration. Clean, precise linework with consistent medium line weight throughout. Vibrant saturated color palette with smooth gradient cel-shading — warm ambient occlusion in shadow areas, bright specular highlights. Detailed backgrounds with atmospheric perspective: foreground elements crisp, distance elements soft and desaturated. Expressive character features. Dynamic lighting: visible soft light rays, gentle bloom on highlights, environmental color cast from light sources. Feels like a key frame from Studio Ghibli, Makoto Shinkai, or Ufotable. Camera language: wide environmental establishing shots, medium character shots, dramatic low-angle hero shots. Every frame: same linework weight, same color saturation level, same cel-shading technique.',
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
