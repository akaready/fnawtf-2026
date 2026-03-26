'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Check, X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { getVideoFrames, updateProjectAiDescription, updateProjectAiDescriptionJson, type VideoFrameRow } from '@/app/admin/actions';
import { AdminLightbox } from '@/app/admin/_components/AdminLightbox';

export interface AIVisionJson {
  visual_style: {
    camera_movement: string[];
    framing: string[];
    lighting: string;
    visual_language: string;
  };
  color_and_tone: {
    palette: string[];
    grade_style: string;
    emotional_tone: string[];
  };
  shot_types: string[];
  production_approach: {
    scale: string;
    style: string;
    locations: string;
    talent_usage: string;
  };
  content_type: {
    format: string;
    audience: string[];
  };
  distinctive_elements: string[];
  summary: string;
}

interface Props {
  projectId: string;
  flagshipVideoId: string | null;
  aiDescription: string | null;
  aiDescriptionJson: AIVisionJson | null;
  onDescriptionSaved?: (desc: string) => void;
}

type ViewMode = 'text' | 'json';

export function AIVisionTab({ projectId, flagshipVideoId, aiDescription, aiDescriptionJson, onDescriptionSaved }: Props) {
  const [frames, setFrames] = useState<VideoFrameRow[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(aiDescriptionJson ? 'json' : 'text');

  // Text editing
  const [description, setDescription] = useState(aiDescription ?? '');
  const [editingText, setEditingText] = useState(false);
  const [editTextValue, setEditTextValue] = useState('');
  const [savingText, setSavingText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // JSON editing
  const [jsonData, setJsonData] = useState<AIVisionJson | null>(aiDescriptionJson);
  const [editingJson, setEditingJson] = useState(false);
  const [editJsonValue, setEditJsonValue] = useState('');
  const [savingJson, setSavingJson] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Load frames
  useEffect(() => {
    if (!flagshipVideoId) return;
    let cancelled = false;
    setFramesLoading(true);
    getVideoFrames(flagshipVideoId)
      .then((f) => { if (!cancelled) setFrames(f); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFramesLoading(false); });
    return () => { cancelled = true; };
  }, [flagshipVideoId]);

  const supabaseUrl = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '' : '';
  const frameImages = frames.map((f) => ({
    url: `${supabaseUrl}/storage/v1/object/public/video-frames/${f.storage_path}?v=${f.id.slice(0, 8)}`,
    label: `${Math.floor(f.timestamp_seconds / 60)}:${String(f.timestamp_seconds % 60).padStart(2, '0')}`,
  }));

  // Text edit handlers
  const startEditText = useCallback(() => {
    setEditTextValue(description);
    setEditingText(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [description]);

  const saveText = useCallback(async () => {
    setSavingText(true);
    try {
      await updateProjectAiDescription(projectId, editTextValue);
      setDescription(editTextValue);
      setEditingText(false);
      onDescriptionSaved?.(editTextValue);
    } finally {
      setSavingText(false);
    }
  }, [projectId, editTextValue, onDescriptionSaved]);

  // JSON edit handlers
  const startEditJson = useCallback(() => {
    setEditJsonValue(JSON.stringify(jsonData, null, 2));
    setJsonError(null);
    setEditingJson(true);
    setTimeout(() => jsonTextareaRef.current?.focus(), 0);
  }, [jsonData]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/admin/video-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error ?? 'Generation failed');
        return;
      }
      setDescription(data.description ?? '');
      setJsonData(data.json ?? null);
      if (data.json) setViewMode('json');
      onDescriptionSaved?.(data.description ?? '');
    } catch (err) {
      setGenerateError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [projectId, onDescriptionSaved]);

  const saveJson = useCallback(async () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(editJsonValue) as AIVisionJson;
      setSavingJson(true);
      await updateProjectAiDescriptionJson(projectId, parsed as unknown as Record<string, unknown>);
      setJsonData(parsed);
      setEditingJson(false);
    } catch {
      setJsonError('Invalid JSON');
      return;
    } finally {
      setSavingJson(false);
    }
  }, [projectId, editJsonValue]);

  return (
    <div className="space-y-6">
      {/* Extracted Frames */}
      <section className="space-y-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-admin-text-faint font-medium">Extracted Frames</p>
          <p className="text-xs text-admin-text-dim mt-0.5">Used for Friendly Bot visioning when selecting projects for proposals.</p>
        </div>

        {framesLoading && (
          <p className="text-xs text-admin-text-dim py-2">Loading frames...</p>
        )}

        {frameImages.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto admin-scrollbar pb-2">
            {frameImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="flex-shrink-0 rounded-admin-sm overflow-hidden border border-admin-border-subtle hover:border-admin-border-emphasis transition-colors"
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="h-14 w-auto object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {!framesLoading && frameImages.length === 0 && (
          <p className="text-sm text-admin-text-dim py-4">No frames extracted yet. Run the extraction script to populate.</p>
        )}
      </section>

      {/* AI Description with text/JSON toggle */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-admin-text-faint font-medium">AI Description</p>
            <p className="text-xs text-admin-text-dim mt-0.5">Generated from visual analysis of extracted frames.</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Generate / Regenerate button */}
            {!editingText && !editingJson && frameImages.length > 0 && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className={`${description || jsonData ? 'btn-ghost' : 'btn-primary'} ${description || jsonData ? 'w-8 h-8' : 'px-3 py-2 text-xs'} flex items-center justify-center gap-1.5`}
                title={description || jsonData ? 'Regenerate' : 'Generate'}
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : description || jsonData ? <RefreshCw size={14} /> : <><Sparkles size={14} /> Generate</>}
              </button>
            )}
            {/* Edit button */}
            {!editingText && !editingJson && (description || jsonData) && (
              <button
                onClick={viewMode === 'text' ? startEditText : startEditJson}
                className="btn-ghost w-8 h-8 flex items-center justify-center"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            {/* View mode toggle */}
            <div className="flex rounded-admin-md border border-admin-border overflow-hidden">
              <button
                onClick={() => setViewMode('text')}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'text'
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-dim hover:text-admin-text-secondary'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'json'
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-dim hover:text-admin-text-secondary'
                }`}
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        {generateError && (
          <p className="text-xs text-admin-danger">{generateError}</p>
        )}

        {/* Text view */}
        {viewMode === 'text' && (
          editingText ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={editTextValue}
                onChange={(e) => setEditTextValue(e.target.value)}
                className="w-full min-h-[200px] rounded-admin-md border border-admin-border bg-admin-bg-overlay px-4 py-3 text-admin-sm text-admin-text-primary placeholder:text-admin-text-dim focus:outline-none focus:border-admin-border-emphasis resize-y"
              />
              <div className="flex items-center gap-2">
                <button onClick={saveText} disabled={savingText} className="btn-primary px-3 py-2 text-xs">
                  <Check size={14} />
                  {savingText ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingText(false)} className="btn-ghost w-8 h-8 flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : description ? (
            <div className="text-admin-sm text-admin-text-secondary leading-relaxed whitespace-pre-wrap">
              {description}
            </div>
          ) : (
            <p className="text-sm text-admin-text-dim py-4">No text description yet.</p>
          )
        )}

        {/* JSON view */}
        {viewMode === 'json' && (
          editingJson ? (
            <div className="space-y-2">
              <textarea
                ref={jsonTextareaRef}
                value={editJsonValue}
                onChange={(e) => { setEditJsonValue(e.target.value); setJsonError(null); }}
                className="w-full min-h-[300px] rounded-admin-md border border-admin-border bg-admin-bg-overlay px-4 py-3 text-admin-sm text-admin-text-primary font-admin-mono placeholder:text-admin-text-dim focus:outline-none focus:border-admin-border-emphasis resize-y"
              />
              {jsonError && <p className="text-xs text-admin-danger">{jsonError}</p>}
              <div className="flex items-center gap-2">
                <button onClick={saveJson} disabled={savingJson} className="btn-primary px-3 py-2 text-xs">
                  <Check size={14} />
                  {savingJson ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingJson(false)} className="btn-ghost w-8 h-8 flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : jsonData ? (
            <div className="rounded-admin-md border border-admin-border bg-admin-bg-overlay p-4 space-y-3">
              <JsonField label="Visual Style">
                <JsonChips items={jsonData.visual_style.camera_movement} color="blue" />
                <JsonChips items={jsonData.visual_style.framing} color="indigo" />
                <JsonPair label="Lighting" value={jsonData.visual_style.lighting} />
                <JsonPair label="Visual Language" value={jsonData.visual_style.visual_language} />
              </JsonField>
              <JsonField label="Color & Tone">
                <JsonChips items={jsonData.color_and_tone.palette} color="violet" />
                <JsonPair label="Grade" value={jsonData.color_and_tone.grade_style} />
                <JsonChips items={jsonData.color_and_tone.emotional_tone} color="orange" />
              </JsonField>
              <JsonField label="Shot Types">
                <JsonChips items={jsonData.shot_types} color="green" />
              </JsonField>
              <JsonField label="Production">
                <JsonPair label="Scale" value={jsonData.production_approach.scale} />
                <JsonPair label="Style" value={jsonData.production_approach.style} />
                <JsonPair label="Locations" value={jsonData.production_approach.locations} />
                <JsonPair label="Talent" value={jsonData.production_approach.talent_usage} />
              </JsonField>
              <JsonField label="Content Type">
                <JsonPair label="Format" value={jsonData.content_type.format} />
                <JsonChips items={jsonData.content_type.audience} color="yellow" />
              </JsonField>
              <JsonField label="Distinctive Elements">
                <JsonChips items={jsonData.distinctive_elements} color="red" />
              </JsonField>
              <JsonField label="Summary">
                <p className="text-admin-sm text-admin-text-secondary">{jsonData.summary}</p>
              </JsonField>
            </div>
          ) : (
            <p className="text-sm text-admin-text-dim py-4">No structured JSON yet. Run extraction to generate.</p>
          )
        )}
      </section>

      {lightboxIndex !== null && (
        <AdminLightbox
          images={frameImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

// ── Small display components ──────────────────────────────────────────────

function JsonField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wider">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

const CHIP_COLORS: Record<string, string> = {
  blue: 'bg-admin-info-bg text-admin-info',
  indigo: 'bg-admin-accent-bg text-accent',
  violet: 'bg-admin-accent-bg text-accent',
  green: 'bg-admin-success-bg text-admin-success',
  orange: 'bg-admin-warning-bg text-admin-warning',
  red: 'bg-admin-danger-bg text-admin-danger',
  yellow: 'bg-admin-warning-bg text-admin-warning',
};

function JsonChips({ items, color }: { items: string[]; color: string }) {
  if (!items?.length) return null;
  const cls = CHIP_COLORS[color] ?? 'bg-admin-bg-hover text-admin-text-secondary';
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className={`px-2 py-0.5 rounded-admin-full text-xs ${cls}`}>{item}</span>
      ))}
    </div>
  );
}

function JsonPair({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <p className="text-admin-sm text-admin-text-secondary">
      <span className="text-admin-text-muted">{label}:</span> {value}
    </p>
  );
}
