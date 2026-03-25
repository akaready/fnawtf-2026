'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Pencil, ImageIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScriptBeatCell } from './ScriptBeatCell';
import { ScriptReferenceCell } from './ScriptReferenceCell';
import { ScriptCommentsCell } from './ScriptCommentsCell';
import { ScriptPresentationTimeline } from './ScriptPresentationTimeline';
import { StoryboardLayoutRenderer } from './StoryboardLayoutRenderer';
import { StoryboardGenerateModal } from './StoryboardGenerateModal';
import { buildPresentationSlides } from './presentationUtils';
import type {
  ComputedScene, ScriptColumnConfig, ScriptCharacterRow, ScriptTagRow,
  ScriptLocationRow, ScriptProductRow, ScriptBeatReferenceRow,
  ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow,
  CharacterCastWithContact, CharacterReferenceRow, LocationReferenceRow,
  ImageDragData, ImageDropData, ScriptShareCommentRow, ScriptShareRow,
} from '@/types/scripts';
import type { LightboxSlide } from './StoryboardLightbox';

interface Props {
  scenes: ComputedScene[];
  columnConfig: ScriptColumnConfig;
  columnOrder: string[];
  onColumnConfigChange: (config: ScriptColumnConfig) => void;
  onColumnOrderChange: (order: string[]) => void;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
  products: ScriptProductRow[];
  references: Record<string, ScriptBeatReferenceRow[]>;
  storyboardFrames: ScriptStoryboardFrameRow[];
  scriptStyle: ScriptStyleRow | null;
  styleReferences: ScriptStyleReferenceRow[];
  scriptId: string;
  scriptGroupId: string;
  onFrameGenerated: (frame: ScriptStoryboardFrameRow | null, beatId?: string) => void;
  onFramesBatchChange?: (frames: ScriptStoryboardFrameRow[], beatId: string) => void;
  activeSceneId: string | null;
  activeBeatId: string | null;
  onUpdateBeat: (beatId: string, field: string, value: string) => void;
  onSelectScene: (sceneId: string) => void;
  onUploadReference: (beatId: string, files: FileList) => void;
  onDeleteReference: (refId: string) => void;
  castMap?: Record<string, CharacterCastWithContact[]>;
  referenceMap?: Record<string, CharacterReferenceRow[]>;
  locationReferenceMap?: Record<string, LocationReferenceRow[]>;
  scriptTitle: string;
  scriptVersion: number;
  onImageMove?: (dragData: ImageDragData, dropData: ImageDropData) => void;
  groupShares: ScriptShareRow[];
  selectedShareId: string | null;
  onSelectShare: (shareId: string) => void;
  commentsMap: Map<string, ScriptShareCommentRow[]>;
  commentsLoading?: boolean;
  onRefreshComments?: () => void;
}

export function ScriptStoryEditor({
  scenes,
  columnConfig,
  columnOrder: _columnOrder,
  onColumnConfigChange: _onColumnConfigChange,
  onColumnOrderChange: _onColumnOrderChange,
  characters,
  tags,
  locations,
  products,
  references,
  storyboardFrames,
  scriptStyle,
  styleReferences,
  scriptId,
  scriptGroupId: _scriptGroupId,
  onFrameGenerated: _onFrameGenerated,
  onFramesBatchChange,
  activeSceneId,
  activeBeatId,
  onUpdateBeat,
  onSelectScene,
  onUploadReference,
  onDeleteReference,
  castMap,
  referenceMap,
  locationReferenceMap,
  scriptTitle: _scriptTitle,
  scriptVersion: _scriptVersion,
  onImageMove,
  groupShares: _groupShares,
  selectedShareId,
  onSelectShare: _onSelectShare,
  commentsMap,
  commentsLoading: _commentsLoading,
  onRefreshComments,
}: Props) {
  /* ── Build slides ── */
  const slides = useMemo(
    () => buildPresentationSlides(scenes, storyboardFrames, references),
    [scenes, storyboardFrames, references],
  );

  const [idx, setIdx] = useState(0);

  /* ── Sync idx when parent changes activeSceneId/activeBeatId ── */
  useEffect(() => {
    if (activeBeatId) {
      const i = slides.findIndex(s => s.beatId === activeBeatId);
      if (i >= 0 && i !== idx) setIdx(i);
    } else if (activeSceneId) {
      const i = slides.findIndex(s => s.sceneId === activeSceneId);
      if (i >= 0 && i !== idx) setIdx(i);
    }
  }, [activeBeatId, activeSceneId, slides]);

  /* ── Current slide + beat ── */
  const current = slides[idx];
  const currentScene = scenes.find(s => s.id === current?.sceneId);
  const currentBeat = currentScene?.beats.find(b => b.id === current?.beatId);
  const beatIndex = currentScene?.beats.findIndex(b => b.id === current?.beatId) ?? 0;
  const beatRefs = current ? (references[current.beatId] ?? []) : [];
  const beatFrames = storyboardFrames.filter(f => f.beat_id === current?.beatId);

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    setIdx(i => {
      const next = Math.min(i + 1, slides.length - 1);
      const s = slides[next];
      if (s) onSelectScene(s.sceneId);
      return next;
    });
  }, [slides, onSelectScene]);

  const goPrev = useCallback(() => {
    setIdx(i => {
      const next = Math.max(i - 1, 0);
      const s = slides[next];
      if (s) onSelectScene(s.sceneId);
      return next;
    });
  }, [slides, onSelectScene]);

  const handleSeek = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    setIdx(clamped);
    const s = slides[clamped];
    if (s) onSelectScene(s.sceneId);
  }, [slides, onSelectScene]);

  /* ── Keyboard nav ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't navigate when typing in an editable field
      const tag = (e.target as HTMLElement)?.tagName;
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  /* ── Scene heading ── */
  const sceneHeading = currentScene
    ? `${currentScene.int_ext}. ${currentScene.location_name || 'UNTITLED LOCATION'}${currentScene.time_of_day ? ` \u2014 ${currentScene.time_of_day}` : ''}`
    : '';

  /* ── Build lightbox slides for storyboard cell ── */
  const allScriptSlides: LightboxSlide[] = useMemo(() => {
    return slides
      .filter(s => s.storyboardImageUrl)
      .map(s => ({
        label: `${s.sceneNumber}${s.beatLetter}`,
        filename: `${s.sceneNumber}${s.beatLetter}.png`,
        layout: s.storyboard_layout ?? null,
        frames: (s.storyboardFrames ?? []).map(f => ({ id: f.id, image_url: f.image_url, slot: f.slot, crop_config: f.crop_config })) as import('@/types/scripts').StoryboardSlotFrame[],
        beatId: s.beatId,
      }));
  }, [slides]);

  /* ── Scene frames for storyboard cell ── */
  const sceneFrames = useMemo(() => {
    if (!currentScene) return [];
    return slides
      .filter(s => s.sceneId === currentScene.id && s.storyboardImageUrl)
      .map(s => ({
        imageUrl: s.storyboardImageUrl!,
        label: `${s.sceneNumber}${s.beatLetter}`,
        filename: `${s.sceneNumber}${s.beatLetter}.png`,
      }));
  }, [slides, currentScene]);

  /* ── Storyboard frame change handlers ── */
  const handleFramesChange = useCallback((frames: ScriptStoryboardFrameRow[]) => {
    if (current) onFramesBatchChange?.(frames, current.beatId);
  }, [current, onFramesBatchChange]);

  const handleLayoutChange = useCallback((layout: string) => {
    if (current) onUpdateBeat(current.beatId, 'storyboard_layout', layout);
  }, [current, onUpdateBeat]);

  /* ── Comments for current beat ── */
  const beatComments = current ? (commentsMap.get(current.beatId) ?? []) : [];

  /* ── Storyboard generate modal ── */
  const [modalOpen, setModalOpen] = useState(false);

  if (!current || !currentScene || !currentBeat) {
    return (
      <div className="flex-1 flex items-center justify-center text-admin-text-muted">
        No beats to display
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto admin-scrollbar px-6 pt-4 pb-8">

      {/* ═══ Storyboard hero — 16:9 with prev / edit / next overlay ═══ */}
      <div className="group/hero relative w-full max-w-5xl flex-shrink-0 rounded-lg overflow-hidden bg-admin-bg-base" style={{ aspectRatio: '16/9' }}>
        {/* Image */}
        {beatFrames.length > 1 && currentBeat.storyboard_layout && currentBeat.storyboard_layout !== 'single' ? (
          <StoryboardLayoutRenderer
            layout={currentBeat.storyboard_layout}
            frames={beatFrames.filter(f => f.slot !== null).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)) as import('@/types/scripts').StoryboardSlotFrame[]}
            size="full"
            gap={3}
          />
        ) : beatFrames[0]?.image_url ? (
          <img
            src={beatFrames[0].image_url}
            alt={`Scene ${current.sceneNumber} — Beat ${current.beatLetter}`}
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <ImageIcon size={32} className="text-admin-text-ghost" />
            <span className="text-admin-text-ghost text-admin-sm font-mono">
              {current.sceneNumber}{current.beatLetter}
            </span>
          </div>
        )}

        {/* Overlay: ← Edit → */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={idx === 0}
            className="p-3 rounded-full bg-black/50 text-white/60 hover:bg-black/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            className="p-3 rounded-full bg-black/50 text-white/60 hover:bg-black/70 hover:text-white transition-colors"
            title="Edit storyboard"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={idx >= slides.length - 1}
            className="p-3 rounded-full bg-black/50 text-white/60 hover:bg-black/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Storyboard generate/edit modal */}
      {modalOpen && (
        <StoryboardGenerateModal
          onClose={() => setModalOpen(false)}
          beatId={current.beatId}
          sceneId={current.sceneId}
          scriptId={scriptId}
          activeFrame={beatFrames.filter(f => f.slot !== null).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))[0] ?? null}
          frames={beatFrames}
          layout={currentBeat.storyboard_layout}
          audioContent={currentBeat.audio_content}
          visualContent={currentBeat.visual_content}
          notesContent={currentBeat.notes_content}
          beatReferenceUrls={beatRefs.map(r => r.image_url)}
          style={scriptStyle}
          styleReferences={styleReferences}
          scene={currentScene}
          beatIndex={beatIndex}
          characters={characters}
          locations={locations}
          products={products}
          castMap={castMap}
          referenceMap={referenceMap}
          locationReferenceMap={locationReferenceMap}
          sceneFrames={sceneFrames}
          allScriptSlides={allScriptSlides}
          tags={tags}
          scenes={scenes}
          onFrameChange={(newFrame) => {
            if (newFrame) {
              const exists = beatFrames.some(f => f.id === newFrame.id);
              if (exists) {
                handleFramesChange(beatFrames.map(f => f.id === newFrame.id ? newFrame : f));
              } else {
                handleFramesChange([...beatFrames, newFrame]);
              }
            }
          }}
          onFramesChange={handleFramesChange}
          onLayoutChange={handleLayoutChange}
        />
      )}

      {/* ═══ Timeline ═══ */}
      <div className="w-full max-w-5xl flex-shrink-0 mt-4 mb-4">
        <ScriptPresentationTimeline
          slides={slides}
          currentIndex={idx}
          onSeek={handleSeek}
        />
      </div>

      {/* ═══ Bordered content block — EDITABLE ═══ */}
      {/* Strip inner border-b from cell components (designed for table rows) */}
      <div className="w-full max-w-5xl flex-shrink-0 border border-admin-border rounded-lg overflow-hidden mb-6 [&_.border-admin-border-subtle]:border-transparent">

        {/* Scene heading */}
        <div className="flex items-center gap-0 bg-admin-bg-sidebar min-h-[44px]">
          <span className="text-admin-border font-bebas text-[44px] leading-none flex-shrink-0 translate-y-[2px] pl-1 pr-3">
            {current.sceneNumber}{currentScene.beats.length > 1 ? current.beatLetter : ''}
          </span>
          <div className="flex items-center flex-1 min-w-0">
            <span className="text-admin-sm font-medium text-admin-text-faint uppercase tracking-wider">
              {sceneHeading}
              {(currentScene as unknown as { scene_description?: string | null }).scene_description && (
                <><span className="text-admin-text-ghost mx-1.5">&bull;</span><span className="text-admin-text-muted font-normal uppercase">{(currentScene as unknown as { scene_description?: string | null }).scene_description}</span></>
              )}
            </span>
          </div>
        </div>

        {/* Audio (2/3) + Visual (1/3) */}
        {columnConfig.audio && (
          <div className={`grid transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] grid-cols-1 ${columnConfig.visual ? 'xl:grid-cols-3' : ''}`}>
            <div className={`border-l-2 border-l-[var(--admin-accent)] border-t border-admin-border bg-admin-bg-base px-5 py-4 ${columnConfig.visual ? 'xl:col-span-2' : ''}`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-ghost mb-2">Audio</p>
              <div className="[&_[contenteditable]]:!text-base [&_[contenteditable]]:md:!text-lg [&_[contenteditable]]:!leading-relaxed">
              <ScriptBeatCell
                value={currentBeat.audio_content}
                field="audio_content"
                onChange={(val) => onUpdateBeat(current.beatId, 'audio_content', val)}
                characters={characters}
                tags={tags}
                locations={locations}
                products={products}
                beatId={current.beatId}
              />
              </div>
            </div>
            <AnimatePresence>
              {columnConfig.visual && (
                <motion.div
                  key="visual"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-l-2 border-l-[var(--admin-info)] border-t border-admin-border bg-admin-bg-base px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-ghost mb-1.5">Visual</p>
                  <ScriptBeatCell
                    value={currentBeat.visual_content}
                    field="visual_content"
                    onChange={(val) => onUpdateBeat(current.beatId, 'visual_content', val)}
                    characters={characters}
                    tags={tags}
                    locations={locations}
                    products={products}
                    beatId={current.beatId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Notes (2/3) + Reference (1/3) */}
        {(columnConfig.notes || columnConfig.reference) && (
          <div className={`grid transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] grid-cols-1 ${columnConfig.notes && columnConfig.reference ? 'xl:grid-cols-3' : ''}`}>
            <AnimatePresence>
              {columnConfig.notes && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`border-l-2 border-l-[var(--admin-warning)] border-t border-admin-border bg-admin-bg-base px-4 py-3 ${columnConfig.reference ? 'xl:col-span-2' : ''}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-ghost mb-1.5">Notes</p>
                  <ScriptBeatCell
                    value={currentBeat.notes_content}
                    field="notes_content"
                    onChange={(val) => onUpdateBeat(current.beatId, 'notes_content', val)}
                    characters={characters}
                    tags={tags}
                    locations={locations}
                    products={products}
                    beatId={current.beatId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {columnConfig.reference && (
                <motion.div
                  key="reference"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`border-l-2 border-l-[var(--admin-danger)] border-t border-admin-border bg-admin-bg-base px-4 py-3 ${columnConfig.notes ? '' : 'xl:col-span-3'}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-ghost mb-1.5">Reference</p>
                  <ScriptReferenceCell
                    beatId={current.beatId}
                    references={beatRefs}
                    onUpload={(files) => onUploadReference(current.beatId, files)}
                    onDelete={onDeleteReference}
                    onImageMove={onImageMove}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Comments — full width */}
        <AnimatePresence>
          {columnConfig.comments && (
            <motion.div
              key="comments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-l-2 border-l-[var(--admin-cream)] border-t border-admin-border bg-admin-bg-base px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-ghost mb-1.5">Comments</p>
              <ScriptCommentsCell
                comments={beatComments}
                shareId={selectedShareId ?? undefined}
                beatId={current.beatId}
                onRefresh={onRefreshComments}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
