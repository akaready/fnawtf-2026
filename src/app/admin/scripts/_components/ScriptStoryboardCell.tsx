'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, ImagePlus, RefreshCw, Upload, Trash2, Loader2, X, Expand, Download, Check } from 'lucide-react';
import { deleteStoryboardFrame, uploadStoryboardFrame } from '@/app/admin/actions';
import { ImageActionButton } from '@/app/admin/_components/ImageActionButton';
import { buildRichPrompt } from './storyboardUtils';
import { StoryboardLightbox } from './StoryboardLightbox';
import { buildStoryboardFilename, downloadSingleImage } from '@/lib/scripts/downloadStoryboards';
import type { ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, ComputedScene, ScriptCharacterRow, ScriptLocationRow, CharacterCastWithContact, CharacterReferenceRow, LocationReferenceRow } from '@/types/scripts';

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
  referenceMap?: Record<string, CharacterReferenceRow[]>;
  locationReferenceMap?: Record<string, LocationReferenceRow[]>;
  scriptTitle: string;
  scriptVersion: number;
  beatLabel: string;
  sceneFrames?: { imageUrl: string; label: string; filename: string }[];
  consistencyFrameUrls?: string[];
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
  referenceMap,
  locationReferenceMap,
  scriptTitle,
  scriptVersion,
  beatLabel,
  sceneFrames,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = useCallback(async () => {
    if (generating || !style) return;
    setGenerating(true);
    try {
      const beat = scene.beats[beatIndex];
      const contentPrompt = beat
        ? buildRichPrompt(beat, beatIndex, scene, characters, locations, castMap, referenceMap)
        : [audioContent && `Audio: ${audioContent}`, visualContent && `Visual: ${visualContent}`].filter(Boolean).join('\n') || 'Empty beat — generate a neutral establishing shot';

      // Collect location reference URLs if location is in 'references' mode
      const locationReferenceUrls: string[] = [];
      const loc = locations.find(l => l.id === scene.location_id);
      if (loc?.location_mode === 'references' && scene.location_id) {
        (locationReferenceMap?.[scene.location_id] ?? []).slice(0, 2)
          .forEach((r: LocationReferenceRow) => locationReferenceUrls.push(r.image_url));
      }

      // Extract character mentions and collect visual references per mode
      const castReferenceUrls: string[] = [];
      if (beat && (castMap || referenceMap)) {
        const mentionPattern = /\]\(([0-9a-f-]{36})\)/g;
        const beatText = `${beat.audio_content} ${beat.visual_content} ${beat.notes_content}`;
        const mentionedCharIds = new Set<string>();
        let m;
        while ((m = mentionPattern.exec(beatText)) !== null) {
          mentionedCharIds.add(m[1]);
        }
        for (const charId of mentionedCharIds) {
          const char = characters.find(c => c.id === charId);
          if (char?.cast_mode === 'references') {
            const refs = (referenceMap?.[charId] ?? []).slice(0, 2).map(r => r.image_url);
            castReferenceUrls.push(...refs);
          } else {
            const featured = castMap?.[charId]?.find(c => c.is_featured);
            if (featured?.contact.headshot_url) {
              castReferenceUrls.push(featured.contact.headshot_url);
            }
          }
        }
      }

      // Compute consistency URLs: up to 2 before + up to 2 after current beat in scene order
      const allFrames = sceneFrames ?? [];
      const currentPos = frame?.image_url
        ? allFrames.findIndex(f => f.imageUrl === frame.image_url)
        : -1;
      const computedConsistencyUrls = currentPos >= 0
        ? [
            ...allFrames.slice(Math.max(0, currentPos - 2), currentPos),
            ...allFrames.slice(currentPos + 1, currentPos + 3),
          ].map(f => f.imageUrl)
        : allFrames.slice(-2).map(f => f.imageUrl);

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
          locationReferenceUrls,
          consistencyFrameUrls: computedConsistencyUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.frame) onFrameChange(data.frame);
      }
    } finally {
      setGenerating(false);
    }
  }, [generating, style, scene, beatIndex, characters, locations, castMap, referenceMap, locationReferenceMap, audioContent, visualContent, beatReferenceUrls, sceneFrames, frame, scriptId, beatId, styleReferences, onFrameChange]);

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
      <>
      <div className="group/sb min-w-0 overflow-hidden border-b border-b-[#0e0e0e] relative">
        <div className="mx-2 my-2">
          <img
            src={frame.image_url}
            alt=""
            className="w-full aspect-video object-cover rounded cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          />
        </div>
        {/* Hover actions */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/sb:opacity-100 transition-opacity bg-black/30 rounded"
          onMouseLeave={() => setConfirmDelete(false)}
        >
          <ImageActionButton icon={Expand} color="info" title="View fullscreen" onClick={() => setLightboxOpen(true)} />
          <ImageActionButton icon={Download} color="info" title="Download" onClick={() => {
            const filename = buildStoryboardFilename(scriptTitle, scriptVersion, scene.sceneNumber, beatLabel);
            void downloadSingleImage(frame.image_url, filename);
          }} />
          <ImageActionButton icon={RefreshCw} color="info" title="Regenerate" onClick={generate} />
          <ImageActionButton icon={Upload} color="info" title="Upload photo" onClick={() => fileRef.current?.click()} />
          {confirmDelete ? (
            <>
              <ImageActionButton icon={Check} color="danger" title="Confirm delete" onClick={handleDelete} />
              <ImageActionButton icon={X} color="neutral" title="Cancel" onClick={() => setConfirmDelete(false)} />
            </>
          ) : (
            <ImageActionButton icon={Trash2} color="danger" title="Delete" onClick={() => setConfirmDelete(true)} />
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
      {lightboxOpen && (() => {
        const lightboxFrames = sceneFrames && sceneFrames.length > 0
          ? sceneFrames
          : [{ imageUrl: frame.image_url, label: `Scene ${scene.sceneNumber} — Beat ${beatLabel}`, filename: buildStoryboardFilename(scriptTitle, scriptVersion, scene.sceneNumber, beatLabel), audioContent, visualContent }];
        const lightboxIndex = lightboxFrames.findIndex(f => f.imageUrl === frame.image_url);
        return (
          <StoryboardLightbox
            frames={lightboxFrames}
            initialIndex={Math.max(0, lightboxIndex)}
            onClose={() => setLightboxOpen(false)}
          />
        );
      })()}
      </>
    );
  }

  // Empty state — split cell: upload left, generate right
  return (
    <div
      className={`group/sb relative min-w-0 min-h-[2.5rem] overflow-hidden border-b border-b-[#0e0e0e] transition-colors ${
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
      <div className="absolute inset-0 flex">
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
