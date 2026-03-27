'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Sparkles, ImagePlus, Loader2, X, Expand, GripVertical, Pencil } from 'lucide-react';
import { uploadStoryboardFrame } from '@/app/admin/actions';
import { ImageActionButton } from '@/app/admin/_components/ImageActionButton';
import { buildRichPrompt } from './storyboardUtils';
import { StoryboardLightbox } from './StoryboardLightbox';
import { StoryboardGenerateModal } from './StoryboardGenerateModal';
import { StoryboardLayoutRenderer } from './StoryboardLayoutRenderer';
import { buildStoryboardFilename } from '@/lib/scripts/downloadStoryboards';
import type { ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, ComputedScene, ScriptCharacterRow, ScriptLocationRow, ScriptProductRow, CharacterCastWithContact, CharacterReferenceRow, LocationReferenceRow, ImageDragData, ImageDropData, StoryboardSlotFrame } from '@/types/scripts';

interface Props {
  frames: ScriptStoryboardFrameRow[];
  layout: string | null;
  beatId: string;
  sceneId: string;
  scriptId: string;
  audioContent: string;
  visualContent: string;
  notesContent: string;
  beatReferenceUrls: string[];
  style: ScriptStyleRow | null;
  styleReferences: ScriptStyleReferenceRow[];
  onFramesChange?: (frames: ScriptStoryboardFrameRow[]) => void;
  onLayoutChange?: (layout: string) => void;
  batchGenerating?: boolean;
  onCancelGeneration?: () => void;
  scene: ComputedScene;
  beatIndex: number;
  characters: ScriptCharacterRow[];
  locations: ScriptLocationRow[];
  products?: ScriptProductRow[];
  castMap?: Record<string, CharacterCastWithContact[]>;
  referenceMap?: Record<string, CharacterReferenceRow[]>;
  locationReferenceMap?: Record<string, LocationReferenceRow[]>;
  scriptTitle: string;
  scriptVersion: number;
  beatLabel: string;
  sceneFrames?: { imageUrl: string; label: string; filename: string }[];
  allScriptSlides?: import('./StoryboardLightbox').LightboxSlide[];
  consistencyFrameUrls?: string[];
  tags?: import('@/types/scripts').ScriptTagRow[];
  onImageMove?: (dragData: ImageDragData, dropData: ImageDropData) => void;
  scenes?: import('@/types/scripts').ComputedScene[];
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
  onLayoutChange,
  batchGenerating,
  onCancelGeneration,
  scene,
  beatIndex,
  characters,
  locations,
  products,
  castMap,
  referenceMap,
  locationReferenceMap,
  scriptTitle,
  scriptVersion,
  beatLabel,
  sceneFrames,
  allScriptSlides,
  consistencyFrameUrls,
  tags,
  onImageMove,
  scenes,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageMoveOver, setImageMoveOver] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Derive active slot frames
  const activeFrames = frames
    .filter((f): f is StoryboardSlotFrame => f.slot !== null)
    .sort((a, b) => a.slot - b.slot);
  const hasImage = activeFrames.length > 0;
  const cropOverridesMap = useMemo(
    () => new Map(activeFrames.map(f => [f.id, f.crop_config ?? { x: 0.5, y: 0.5, scale: 1.0 }])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFrames.map(f => `${f.id}:${JSON.stringify(f.crop_config)}`).join(',')]
  );
  // The "primary" frame for backward-compat (modal still uses single-frame API)
  const primaryFrame = activeFrames[0] ?? null;

  const generate = useCallback(async () => {
    if (generating || !style) return;
    setGenerating(true);
    try {
      const beat = scene.beats[beatIndex];
      const contentPrompt = beat
        ? buildRichPrompt(beat, beatIndex, scene, characters, locations, castMap, referenceMap, tags)
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
      const castReferenceLabels: string[] = [];
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
            for (const url of refs) {
              castReferenceUrls.push(url);
              castReferenceLabels.push(char.name);
            }
          } else {
            const featured = castMap?.[charId]?.find(c => c.is_featured);
            if (featured?.contact.headshot_url) {
              castReferenceUrls.push(featured.contact.headshot_url);
              castReferenceLabels.push(char?.name ?? 'Unknown');
            }
          }
        }
      }

      // Compute consistency URLs: up to 2 before + up to 2 after current beat in scene order
      const allFrames = sceneFrames ?? [];
      const currentPos = primaryFrame?.image_url
        ? allFrames.findIndex(f => f.imageUrl === primaryFrame.image_url)
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
          castReferenceLabels,
          locationReferenceUrls,
          consistencyFrameUrls: computedConsistencyUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.frame) {
          const newFrame = data.frame as ScriptStoryboardFrameRow;
          // Assign slot 1 if no active slotted frames exist for this beat
          const nextSlot = activeFrames.length === 0 ? 1 : (([1, 2, 3, 4] as const).find(s => !activeFrames.some(f => f.slot === s)) ?? null);
          if (nextSlot) {
            const { setFrameSlot } = await import('@/app/admin/actions');
            await setFrameSlot(newFrame.id, nextSlot);
            onFramesChange?.([...frames, { ...newFrame, slot: nextSlot }]);
          } else {
            onFramesChange?.([...frames, newFrame]);
          }
        }
      }
    } finally {
      setGenerating(false);
    }
  }, [generating, style, scene, beatIndex, characters, locations, castMap, referenceMap, locationReferenceMap, audioContent, visualContent, beatReferenceUrls, sceneFrames, primaryFrame, scriptId, beatId, styleReferences, onFramesChange, frames, activeFrames]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', files[0]);
        const newFrame = await uploadStoryboardFrame(scriptId, beatId, fd);
        const nextSlot = activeFrames.length === 0 ? 1 : (([1, 2, 3, 4] as const).find(s => !activeFrames.some(f => f.slot === s)) ?? null);
        if (nextSlot) {
          const { setFrameSlot } = await import('@/app/admin/actions');
          await setFrameSlot(newFrame.id, nextSlot);
          onFramesChange?.([...frames, { ...newFrame, slot: nextSlot }]);
        } else {
          onFramesChange?.([...frames, newFrame]);
        }
      } finally {
        setUploading(false);
      }
    },
    [scriptId, beatId, onFramesChange, frames, activeFrames],
  );

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
        className={`group/loading min-w-0 overflow-hidden border-b border-admin-border-subtle flex items-center justify-center ${canCancel ? 'cursor-pointer hover:bg-admin-bg-hover' : ''}`}
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

  // With image — use StoryboardLayoutRenderer for multi-frame layout
  if (hasImage) {
    return (
      <>
      <div
        className="group/sb min-w-0 overflow-hidden border-b border-admin-border-subtle relative select-none flex items-center"
        onMouseDown={e => e.preventDefault()}
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
          className="relative p-1 w-full group/img cursor-pointer select-none"
          onClick={() => setModalOpen(true)}
        >
          <StoryboardLayoutRenderer
            layout={layout}
            frames={activeFrames}
            size="cell"
            gap={4}
            cropOverrides={cropOverridesMap}
          />
          {/* Hover overlay: centered icons matching reference cell */}
          <div className="absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none bg-black/30 rounded flex items-center justify-center gap-1 select-none">
            <span
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('application/x-storyboard-layout', JSON.stringify({
                  dragType: 'storyboard-layout',
                  sourceBeatId: beatId,
                  activeFrameIds: activeFrames.map(f => f.id),
                  layout: layout ?? 'single',
                }));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto w-7 h-7 flex items-center justify-center rounded bg-black/50 text-white/80 hover:bg-zinc-500 hover:text-white transition-all cursor-grab active:cursor-grabbing"
              title="Drag to move layout"
            >
              <GripVertical size={12} />
            </span>
            <div className="pointer-events-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <ImageActionButton icon={Pencil} color="info" title="Edit in modal" onClick={() => setModalOpen(true)} />
              <ImageActionButton icon={Expand} color="info" title="View fullscreen" onClick={() => setLightboxOpen(true)} />
            </div>
          </div>
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
        // Use all-script slides if available, otherwise build a single slide for this beat
        const slides = allScriptSlides ?? [{
          label: `Scene ${scene.sceneNumber} \u2014 Beat ${beatLabel}`,
          filename: buildStoryboardFilename(scriptTitle, scriptVersion, scene.sceneNumber, beatLabel),
          layout,
          frames: activeFrames,
          beatId,
        }];
        const initialSlideIdx = allScriptSlides
          ? allScriptSlides.findIndex(s => s.beatId === beatId)
          : 0;
        return (
          <StoryboardLightbox
            slides={slides}
            initialIndex={Math.max(0, initialSlideIdx)}
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
          activeFrame={primaryFrame}
          frames={frames}
          layout={layout}
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
          products={products}
          castMap={castMap}
          referenceMap={referenceMap}
          locationReferenceMap={locationReferenceMap}
          sceneFrames={sceneFrames}
          allScriptSlides={allScriptSlides}
          consistencyFrameUrls={consistencyFrameUrls}
          tags={tags}
          scenes={scenes}
          onFrameChange={(newFrame) => {
            if (newFrame) {
              const exists = frames.some(f => f.id === newFrame.id);
              if (exists) {
                onFramesChange?.(frames.map(f => f.id === newFrame.id ? newFrame : f));
              } else {
                onFramesChange?.([...frames, newFrame]);
              }
            }
          }}
          onFramesChange={onFramesChange}
          onLayoutChange={onLayoutChange}
        />
      )}
      </>
    );
  }

  // Empty state — split cell: upload left, generate-with-editor middle, quick-generate right
  return (
    <div
      className={`group/sb relative min-w-0 min-h-[2.5rem] overflow-hidden border-b border-admin-border-subtle transition-colors ${
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
          activeFrame={null}
          frames={frames}
          layout={layout}
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
          products={products}
          castMap={castMap}
          referenceMap={referenceMap}
          locationReferenceMap={locationReferenceMap}
          sceneFrames={sceneFrames}
          allScriptSlides={allScriptSlides}
          consistencyFrameUrls={consistencyFrameUrls}
          tags={tags}
          scenes={scenes}
          onFrameChange={(newFrame) => {
            if (newFrame) {
              onFramesChange?.([...frames, newFrame]);
            }
          }}
          onFramesChange={onFramesChange}
        />
      )}
    </div>
  );
}
