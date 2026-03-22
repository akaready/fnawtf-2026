'use client';

import { Check, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptBeatCell } from './ScriptBeatCell';
import type { ScriptBeatRow as BeatRow, ScriptCharacterRow, ScriptTagRow, ScriptColumnConfig, ScriptBeatReferenceRow, ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, CharacterCastWithContact, CharacterReferenceRow, LocationReferenceRow, ScriptProductRow, ImageDragData, ImageDropData } from '@/types/scripts';
import { ScriptReferenceCell } from './ScriptReferenceCell';
import { ScriptStoryboardCell } from './ScriptStoryboardCell';
import { ScriptCommentsCell } from './ScriptCommentsCell';
import type { ScriptShareCommentRow } from '@/types/scripts';

interface Props {
  beat: BeatRow;
  columnConfig: ScriptColumnConfig;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  references: ScriptBeatReferenceRow[];
  onUpdate: (beatId: string, field: string, value: string) => void;
  onDelete: (beatId: string) => void;
  onAddBeat: () => void;
  onAddScene?: () => void;
  onUploadReference: (beatId: string, files: FileList) => void;
  onDeleteReference: (refId: string) => void;
  storyboardFrames: ScriptStoryboardFrameRow[];
  storyboardLayout: string | null;
  scriptStyle: ScriptStyleRow | null;
  styleReferences: ScriptStyleReferenceRow[];
  scriptId: string;
  sceneId: string;
  scene: import('@/types/scripts').ComputedScene;
  locations: import('@/types/scripts').ScriptLocationRow[];
  onFramesChange: (frames: ScriptStoryboardFrameRow[]) => void;
  onLayoutChange?: (layout: string) => void;
  gridTemplate: string;
  isOnly: boolean;
  beatNumber: number;
  isSelected?: boolean;
  onSelect?: (beatId: string, shiftKey: boolean, metaKey: boolean) => void;
  onDragSelectStart?: (beatId: string) => void;
  onActivateSelection?: (beatId: string) => void;
  onExitSelection?: () => void;
  selectionActive?: boolean;
  batchGenerating?: boolean;
  onCancelGeneration?: () => void;
  castMap?: Record<string, CharacterCastWithContact[]>;
  referenceMap?: Record<string, CharacterReferenceRow[]>;
  locationReferenceMap?: Record<string, LocationReferenceRow[]>;
  products?: ScriptProductRow[];
  scriptTitle: string;
  scriptVersion: number;
  sceneFrames?: { imageUrl: string; label: string; filename: string }[];
  allScriptSlides?: import('./StoryboardLightbox').LightboxSlide[];
  onImageMove?: (dragData: ImageDragData, dropData: ImageDropData) => void;
  scenes?: import('@/types/scripts').ComputedScene[];
  beatComments?: ScriptShareCommentRow[];
}

function beatLetter(n: number): string {
  // 1→A, 26→Z, 27→AA, 28→AB, etc.
  let result = '';
  let num = n;
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

export function ScriptBeatRow({
  beat,
  columnConfig,
  characters,
  tags,
  onUpdate,
  onDelete: _onDelete,
  onAddBeat,
  onAddScene,
  onUploadReference,
  onDeleteReference,
  references,
  storyboardFrames,
  storyboardLayout,
  scriptStyle,
  styleReferences,
  scriptId,
  sceneId,
  scene,
  locations,
  onFramesChange,
  onLayoutChange,
  gridTemplate,
  isOnly: _isOnly,
  beatNumber,
  isSelected,
  onSelect,
  onDragSelectStart,
  onActivateSelection,
  onExitSelection,
  selectionActive,
  batchGenerating,
  onCancelGeneration,
  castMap,
  referenceMap,
  locationReferenceMap,
  products = [],
  scriptTitle,
  scriptVersion,
  sceneFrames,
  allScriptSlides,
  onImageMove,
  scenes,
  beatComments,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: beat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine last text column for Tab→new beat
  const hasNonTextAfter = columnConfig.reference || columnConfig.storyboard;
  const lastTextCol = columnConfig.notes ? 'notes_content' : columnConfig.visual ? 'visual_content' : 'audio_content';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/beat relative hover:bg-admin-bg-wash transition-colors ${
        isSelected ? 'bg-admin-bg-selected' : ''
      }`}
    >
      {/* Beat gutter — checkbox + grip */}
      <div
        className={`group/gutter absolute left-0 top-0 w-10 h-full flex items-center justify-center border-b border-b-[#0e0e0e] select-none ${selectionActive ? '' : 'cursor-grab'}`}
        data-beat-gutter={beat.id}
        {...(selectionActive ? {} : { ...attributes, ...listeners })}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (!selectionActive) return;
          onDragSelectStart?.(beat.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!selectionActive) return;
          onSelect?.(beat.id, e.shiftKey, e.metaKey || e.ctrlKey);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!selectionActive) {
            onActivateSelection?.(beat.id);
          }
        }}
      >
        {selectionActive ? (
          /* Selection mode: always show checkbox, no grip */
          <div
            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
              isSelected
                ? 'bg-white border-white'
                : 'border-admin-text-ghost hover:border-admin-text-faint'
            }`}
          >
            {isSelected && <Check size={10} className="text-black" strokeWidth={3} />}
          </div>
        ) : (
          /* Normal mode: beat letter, grip icon on cell hover */
          <>
            <span className="text-admin-border-subtle font-bebas text-2xl leading-[0] group-hover/gutter:hidden">
              {beatLetter(beatNumber)}
            </span>
            <div className="hidden group-hover/gutter:flex items-center pointer-events-none">
              <GripVertical size={12} className="text-admin-text-ghost" />
            </div>
          </>
        )}
      </div>

      {/* Content grid */}
      <div
        className="relative ml-10 min-w-0 border-r border-admin-border"
        onClick={() => { if (selectionActive) onExitSelection?.(); }}
      >
        {/* Vertical column accent lines — overlay, above horizontal borders */}
        <div
          className="absolute inset-0 z-10 pointer-events-none grid"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columnConfig.audio && <div className="border-l border-l-[var(--admin-accent)]" />}
          {columnConfig.visual && <div className="border-l border-l-[var(--admin-info)]" />}
          {columnConfig.notes && <div className="border-l border-l-[var(--admin-warning)]" />}
          {columnConfig.reference && <div className="border-l border-l-[var(--admin-danger)]" />}
          {columnConfig.storyboard && <div className="border-l border-l-[var(--admin-success)]" />}
          {columnConfig.comments && <div className="border-l border-l-[var(--admin-cream)]" />}
        </div>

        <div className="grid items-stretch" style={{ gridTemplateColumns: gridTemplate }}>
          {columnConfig.audio && (
            <ScriptBeatCell
              value={beat.audio_content}
              field="audio_content"
              onChange={(v) => onUpdate(beat.id, 'audio_content', v)}
              onAddBeat={onAddBeat}
              onAddScene={onAddScene}
              isLastColumn={lastTextCol === 'audio_content' && !hasNonTextAfter}
              characters={characters}
              tags={tags}
              locations={locations}
              products={products}
              beatId={beat.id}
            />
          )}
          {columnConfig.visual && (
            <ScriptBeatCell
              value={beat.visual_content}
              field="visual_content"
              onChange={(v) => onUpdate(beat.id, 'visual_content', v)}
              onAddBeat={onAddBeat}
              onAddScene={onAddScene}
              isLastColumn={lastTextCol === 'visual_content' && !hasNonTextAfter}
              characters={characters}
              tags={tags}
              locations={locations}
              products={products}
              beatId={beat.id}
            />
          )}
          {columnConfig.notes && (
            <ScriptBeatCell
              value={beat.notes_content}
              field="notes_content"
              onChange={(v) => onUpdate(beat.id, 'notes_content', v)}
              onAddBeat={onAddBeat}
              onAddScene={onAddScene}
              isLastColumn={lastTextCol === 'notes_content' && !hasNonTextAfter}
              characters={characters}
              tags={tags}
              locations={locations}
              products={products}
              beatId={beat.id}
            />
          )}
          {columnConfig.reference && (
            <ScriptReferenceCell
              beatId={beat.id}
              references={references}
              onUpload={(files) => onUploadReference(beat.id, files)}
              onDelete={onDeleteReference}
              onImageMove={onImageMove}
            />
          )}
          {columnConfig.storyboard && (
            <ScriptStoryboardCell
              frames={storyboardFrames}
              layout={storyboardLayout}
              beatId={beat.id}
              sceneId={sceneId}
              scriptId={scriptId}
              audioContent={beat.audio_content}
              visualContent={beat.visual_content}
              notesContent={beat.notes_content}
              beatReferenceUrls={references.map(r => r.image_url)}
              style={scriptStyle}
              styleReferences={styleReferences}
              onFramesChange={onFramesChange}
              onLayoutChange={onLayoutChange}
              batchGenerating={batchGenerating}
              onCancelGeneration={onCancelGeneration}
              scene={scene}
              beatIndex={beatNumber - 1}
              characters={characters}
              locations={locations}
              products={products}
              castMap={castMap}
              referenceMap={referenceMap}
              locationReferenceMap={locationReferenceMap}
              scriptTitle={scriptTitle}
              scriptVersion={scriptVersion}
              beatLabel={beatLetter(beatNumber)}
              sceneFrames={sceneFrames}
              allScriptSlides={allScriptSlides}
              onImageMove={onImageMove}
              scenes={scenes}
            />
          )}
          {columnConfig.comments && (
            <ScriptCommentsCell comments={beatComments ?? []} />
          )}
        </div>
      </div>

    </div>
  );
}
