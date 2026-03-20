'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, ImagePlus, Loader2, X, Expand, Pencil, GripVertical } from 'lucide-react';
import { deleteStoryboardFrame, uploadStoryboardFrame } from '@/app/admin/actions';
import { ImageActionButton } from '@/app/admin/_components/ImageActionButton';
import { buildRichPrompt } from './storyboardUtils';
import { StoryboardLightbox } from './StoryboardLightbox';
import { StoryboardGenerateModal } from './StoryboardGenerateModal';
import { buildStoryboardFilename } from '@/lib/scripts/downloadStoryboards';
import { StoryboardLayoutRenderer } from './StoryboardLayoutRenderer';
import type { ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, ComputedScene, ScriptCharacterRow, ScriptLocationRow, CharacterCastWithContact, CharacterReferenceRow, LocationReferenceRow, ImageDragData, ImageDropData, StoryboardSlotFrame } from '@/types/scripts';

interface Props {
  frames: ScriptStoryboardFrameRow[];         // all frames for beat (active + history)
  layout: string | null;                      // beat's storyboard_layout
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
  onFramesChange?: (frames: ScriptStoryboardFrameRow[]) => void;
  defaultTab?: 'generate' | 'modify' | 'frames';
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
  allScriptFrames?: { imageUrl: string; label: string; filename: string; audioContent: string; visualContent: string }[];
  consistencyFrameUrls?: string[];
  onImageMove?: (dragData: ImageDragData, dropData: ImageDropData) => void;
}

export function ScriptStoryboardCell({
  frames,
  layout,
  beatId,
  sceneId,
  scriptId,
  audioContent,
  visualContent,
  notesContent,
  beatReferenceUrls,
  style,
  styleReferences,
  onFramesChange,
  defaultTab,
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
  allScriptFrames,
  consistencyFrameUrls,
  onImageMove,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageMoveOver, setImageMoveOver] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Derive active frames from the frames array
  const activeFrames = frames
    .filter((f): f is StoryboardSlotFrame => f.slot !== null)
    .sort((a, b) => a.slot - b.slot);
  const hasImage = activeFrames.length > 0;

  // Backward-compat: a single "active" frame for APIs that still need one
  const frame = activeFrames[0] ?? null;

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
        if (data.frame) onFramesChange?.([...frames, data.frame]);
      }
    } finally {
      setGenerating(false);
    }
  }, [generating, style, scene, beatIndex, characters, locations, castMap, referenceMap, locationReferenceMap, audioContent, visualContent, beatReferenceUrls, sceneFrames, frame, scriptId, beatId, styleReferences, frames, onFramesChange]);

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
          is_active: true,
          slot: null,
          crop_config: null,
          reference_urls_used: [],
          created_at: new Date().toISOString(),
        };
        onFramesChange?.([...frames, newFrame]);
      } finally {
        setUploading(false);
      }
    },
    [scriptId, beatId, frames, onFramesChange],
  );

  // handleDelete retained for modal use (Task 10 will wire this up)
  const handleDelete = useCallback(async () => {
    if (!frame) return;
    await deleteStoryboardFrame(frame.id);
    onFramesChange?.(frames.filter(f => f.id !== frame.id));
  }, [frame, frames, onFramesChange]);
  void handleDelete; // suppress unused warning until Task 10 wires delete into modal

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setImageMoveOver(false);

    // Check for image-move payload first
    const moveData = e.dataTransfer.getData('application/x-image-move');
    if (moveData) {
      try {
        const parsed = JSON.parse(moveData) as ImageDragData;
        onImageMove?.(parsed, { dropType: 'storyboard-cell', beatId });
      } catch { /* ignore parse errors */ }
      return;
    }

    // Existing file upload logic
    handleUpload(e.dataTransfer.files);
  }, [handleUpload, onImageMove, beatId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/x-image-move')) {
      setImageMoveOver(true);
      setDragOver(false);
    } else {
      setDragOver(true);
      setImageMoveOver(false);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
    setImageMoveOver(false);
  }, []);

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

  // With image — render multi-frame layout grid
  if (hasImage) {
    return (
      <>
      <div
        className="group/sb min-w-0 overflow-hidden border-b border-b-[#0e0e0e] relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Image-move drop indicator */}
        {imageMoveOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-admin-info-bg/20 border-2 border-dashed border-admin-info rounded pointer-events-none z-20">
            <GripVertical size={16} className="text-admin-info" />
          </div>
        )}
        <div
          className="relative mx-2 my-2 group/img cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          <StoryboardLayoutRenderer
            layout={layout}
            frames={activeFrames}
            size="cell"
            gap={2}
          />
          {/* Single hover action: Expand */}
          <div className="absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none flex items-end justify-end p-1">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <ImageActionButton
                icon={Expand}
                color="info"
                title="View fullscreen"
                onClick={() => setLightboxOpen(true)}
              />
            </div>
          </div>
        </div>
        {/* Whole-layout drag handle */}
        <span
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            const dragData = {
              dragType: 'storyboard-layout',
              sourceBeatId: beatId,
              activeFrameIds: activeFrames.map(f => f.id),
              layout: layout ?? 'single',
            };
            e.dataTransfer.setData('application/x-storyboard-layout', JSON.stringify(dragData));
            e.dataTransfer.clearData('application/x-image-move'); // remove old single-frame key if present
            e.dataTransfer.effectAllowed = 'move';
          }}
          className="absolute top-1 left-1 w-7 h-7 flex items-center justify-center rounded bg-admin-bg-overlay text-admin-text-primary hover:bg-admin-bg-active transition-all cursor-grab active:cursor-grabbing opacity-0 group-hover/sb:opacity-100"
          title="Drag to move"
        >
          <GripVertical size={12} />
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>
      {lightboxOpen && (() => {
        const lightboxFrames = allScriptFrames && allScriptFrames.length > 0
          ? allScriptFrames.map(f => ({ imageUrl: f.imageUrl, label: f.label, filename: f.filename }))
          : sceneFrames && sceneFrames.length > 0
            ? sceneFrames
            : activeFrames.map((f, i) => ({
                imageUrl: f.image_url,
                label: `Scene ${scene.sceneNumber} — Beat ${beatLabel}${activeFrames.length > 1 ? ` (${i + 1})` : ''}`,
                filename: buildStoryboardFilename(scriptTitle, scriptVersion, scene.sceneNumber, beatLabel),
              }));
        // TODO Task 11: update to pass frames array directly
        const lightboxIndex = lightboxFrames.findIndex(f => f.imageUrl === (activeFrames[0]?.image_url ?? ''));
        return (
          <StoryboardLightbox
            frames={lightboxFrames}
            initialIndex={Math.max(0, lightboxIndex)}
            onClose={() => setLightboxOpen(false)}
          />
        );
      })()}
      {modalOpen && (
        <StoryboardGenerateModal
          onClose={() => setModalOpen(false)}
          beatId={beatId}
          sceneId={sceneId}
          scriptId={scriptId}
          activeFrame={frame}
          audioContent={audioContent}
          visualContent={visualContent}
          notesContent={notesContent}
          beatReferenceUrls={beatReferenceUrls}
          style={style}
          styleReferences={styleReferences}
          scene={scene}
          beatIndex={beatIndex}
          characters={characters}
          locations={locations}
          castMap={castMap}
          referenceMap={referenceMap}
          locationReferenceMap={locationReferenceMap}
          sceneFrames={sceneFrames}
          consistencyFrameUrls={consistencyFrameUrls}
          onFrameChange={(newFrame) => {
            if (newFrame) {
              onFramesChange?.([...frames.filter(f => f.id !== newFrame.id), newFrame]);
            } else {
              onFramesChange?.(frames.filter(f => f.id !== frame?.id));
            }
          }}
          // @ts-expect-error -- Task 10 will add these props to StoryboardGenerateModal
          defaultTab={defaultTab ?? (activeFrames.length > 0 ? 'frames' : 'generate')}
        />
      )}
      </>
    );
  }

  // Empty state — split cell: upload left, generate right
  return (
    <div
      className={`group/sb relative min-w-0 min-h-[2.5rem] overflow-hidden border-b border-b-[#0e0e0e] transition-colors ${
        imageMoveOver ? 'bg-admin-info-bg/20' : dragOver ? 'bg-admin-info-bg/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
            onClick={() => setModalOpen(true)}
            className="flex-1 flex items-center justify-center text-admin-text-ghost hover:text-admin-text-primary bg-admin-bg-hover/50 hover:bg-admin-bg-active transition-colors border-r border-admin-border-subtle"
            title="Generate with editor"
          >
            <Pencil size={14} />
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center text-admin-text-ghost/30 bg-admin-bg-hover/30 cursor-default border-r border-admin-border-subtle" title="Set style first">
            <Pencil size={14} />
          </div>
        )}
        {style ? (
          <button
            onClick={generate}
            className="flex-1 flex items-center justify-center text-admin-text-ghost hover:text-admin-text-primary bg-admin-bg-hover/50 hover:bg-admin-bg-active transition-colors"
            title="Quick generate"
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
      {modalOpen && (
        <StoryboardGenerateModal
          onClose={() => setModalOpen(false)}
          beatId={beatId}
          sceneId={sceneId}
          scriptId={scriptId}
          activeFrame={frame}
          audioContent={audioContent}
          visualContent={visualContent}
          notesContent={notesContent}
          beatReferenceUrls={beatReferenceUrls}
          style={style}
          styleReferences={styleReferences}
          scene={scene}
          beatIndex={beatIndex}
          characters={characters}
          locations={locations}
          castMap={castMap}
          referenceMap={referenceMap}
          locationReferenceMap={locationReferenceMap}
          sceneFrames={sceneFrames}
          consistencyFrameUrls={consistencyFrameUrls}
          onFrameChange={(newFrame) => {
            if (newFrame) {
              onFramesChange?.([...frames.filter(f => f.id !== newFrame.id), newFrame]);
            } else {
              onFramesChange?.(frames);
            }
          }}
          // @ts-expect-error -- Task 10 will add these props to StoryboardGenerateModal
          defaultTab={defaultTab ?? 'generate'}
        />
      )}
    </div>
  );
}
