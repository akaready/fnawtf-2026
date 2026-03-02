'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, ImagePlus, RefreshCw, Upload, Trash2, Loader2, X } from 'lucide-react';
import { deleteStoryboardFrame, uploadStoryboardFrame } from '@/app/admin/actions';
import { buildRichPrompt } from './storyboardUtils';
import type { ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, ComputedScene, ScriptCharacterRow, ScriptLocationRow, CharacterCastWithContact } from '@/types/scripts';

interface Props {
  frame: ScriptStoryboardFrameRow | null;
  beatId: string;
  sceneId: string;
  scriptId: string;
  /** Beat content for generation prompt */
  audioContent: string;
  visualContent: string;
  notesContent: string;
  beatReferenceUrls: string[];
  style: ScriptStyleRow | null;
  styleReferences: ScriptStyleReferenceRow[];
  onFrameChange: (frame: ScriptStoryboardFrameRow | null) => void;
  batchGenerating?: boolean;
  onCancelGeneration?: () => void;
  scene: ComputedScene;
  beatIndex: number;
  characters: ScriptCharacterRow[];
  locations: ScriptLocationRow[];
  castMap?: Record<string, CharacterCastWithContact[]>;
}

export function ScriptStoryboardCell({
  frame,
  beatId,
  sceneId: _sceneId,
  scriptId,
  audioContent,
  visualContent,
  notesContent: _notesContent,
  beatReferenceUrls,
  style,
  styleReferences,
  onFrameChange,
  batchGenerating,
  onCancelGeneration,
  scene,
  beatIndex,
  characters,
  locations,
  castMap,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = useCallback(async () => {
    if (generating || !style) return;
    setGenerating(true);
    try {
      const beat = scene.beats[beatIndex];
      const contentPrompt = beat
        ? buildRichPrompt(beat, beatIndex, scene, characters, locations, castMap)
        : [audioContent && `Audio: ${audioContent}`, visualContent && `Visual: ${visualContent}`].filter(Boolean).join('\n') || 'Empty beat — generate a neutral establishing shot';

      // Extract character mentions from beat content and collect featured cast headshots
      const castReferenceUrls: string[] = [];
      if (beat && castMap) {
        const mentionPattern = /\]\(([0-9a-f-]{36})\)/g;
        const beatText = `${beat.audio_content} ${beat.visual_content} ${beat.notes_content}`;
        const mentionedCharIds = new Set<string>();
        let m;
        while ((m = mentionPattern.exec(beatText)) !== null) {
          mentionedCharIds.add(m[1]);
        }
        for (const charId of mentionedCharIds) {
          const featured = castMap[charId]?.find(c => c.is_featured);
          if (featured?.contact.headshot_url) {
            castReferenceUrls.push(featured.contact.headshot_url);
          }
        }
      }

      const res = await fetch('/api/admin/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          beatId,
          contentPrompt,
          stylePrompt: style.prompt,
          stylePreset: style.style_preset,
          aspectRatio: style.aspect_ratio,
          referenceImageUrls: styleReferences.map((r) => r.image_url),
          beatReferenceUrls,
          castReferenceUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.frame) onFrameChange(data.frame);
      }
    } finally {
      setGenerating(false);
    }
  }, [generating, style, scene, beatIndex, characters, locations, castMap, audioContent, visualContent, beatReferenceUrls, scriptId, beatId, styleReferences, onFrameChange]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', files[0]);
        const result = await uploadStoryboardFrame(scriptId, { beatId }, fd);
        const newFrame: ScriptStoryboardFrameRow = {
          id: result.id,
          script_id: scriptId,
          beat_id: beatId,
          scene_id: null,
          image_url: result.image_url,
          storage_path: result.storage_path,
          source: 'uploaded',
          prompt_used: null,
          created_at: new Date().toISOString(),
        };
        onFrameChange(newFrame);
      } finally {
        setUploading(false);
      }
    },
    [scriptId, beatId, onFrameChange],
  );

  const handleDelete = useCallback(async () => {
    if (!frame) return;
    await deleteStoryboardFrame(frame.id);
    onFrameChange(null);
  }, [frame, onFrameChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // Loading state — spinner fills entire cell, becomes red X on hover to cancel
  if (generating || uploading || batchGenerating) {
    const canCancel = (generating || batchGenerating) && onCancelGeneration;
    return (
      <div
        className={`group/loading min-w-0 overflow-hidden border-b border-b-[#0e0e0e] flex items-center justify-center ${canCancel ? 'cursor-pointer hover:bg-admin-bg-hover' : ''}`}
        onClick={canCancel ? onCancelGeneration : undefined}
        title={canCancel ? 'Cancel generation' : undefined}
      >
        <Loader2 size={16} className={`animate-spin text-admin-text-ghost ${canCancel ? 'group-hover/loading:hidden' : ''}`} />
        {canCancel && (
          <X size={16} className="hidden group-hover/loading:block text-admin-danger" />
        )}
      </div>
    );
  }

  // With image
  if (frame) {
    return (
      <div className="group/sb min-w-0 overflow-hidden border-b border-b-[#0e0e0e] relative">
        <div className="mx-2 my-2">
          <img
            src={frame.image_url}
            alt=""
            className="w-full aspect-video object-cover rounded"
          />
        </div>
        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/sb:opacity-100 transition-opacity bg-black/30 rounded">
          <button
            onClick={generate}
            className="w-7 h-7 flex items-center justify-center rounded bg-black/60 text-white hover:bg-admin-info transition-colors"
            title="Regenerate"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-7 h-7 flex items-center justify-center rounded bg-black/60 text-white hover:bg-admin-info transition-colors"
            title="Upload photo"
          >
            <Upload size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center rounded bg-black/60 text-white hover:bg-admin-danger transition-colors"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>
    );
  }

  // Empty state — split cell: upload left, generate right
  return (
    <div
      className={`group/sb relative min-w-0 overflow-hidden border-b border-b-[#0e0e0e] transition-colors ${
        dragOver ? 'bg-admin-info-bg/20' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Split buttons fill cell */}
      <div className="absolute inset-0 flex opacity-0 group-hover/sb:opacity-100 transition-opacity">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center text-admin-text-ghost hover:text-admin-text-primary bg-admin-bg-hover/50 hover:bg-admin-bg-active transition-colors border-r border-admin-border-subtle"
          title="Upload image"
        >
          <ImagePlus size={14} />
        </button>
        {style ? (
          <button
            onClick={generate}
            className="flex-1 flex items-center justify-center text-admin-text-ghost hover:text-admin-text-primary bg-admin-bg-hover/50 hover:bg-admin-bg-active transition-colors"
            title="Generate"
          >
            <Sparkles size={14} />
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center text-admin-text-ghost/30 bg-admin-bg-hover/30 cursor-default" title="Set style first">
            <Sparkles size={14} />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
    </div>
  );
}
