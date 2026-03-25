'use client';

import { Fragment } from 'react';
import { Check, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptBeatCell } from './ScriptBeatCell';
import { DEFAULT_COLUMN_ORDER, getOrderedVisibleColumns } from './gridUtils';
import type { ScriptBeatRow as BeatRow, ScriptCharacterRow, ScriptTagRow, ScriptColumnConfig, ScriptBeatReferenceRow, ScriptStoryboardFrameRow, ScriptStyleRow, ScriptStyleReferenceRow, CharacterCastWithContact, CharacterReferenceRow, LocationReferenceRow, ScriptProductRow, ImageDragData, ImageDropData } from '@/types/scripts';
import { ScriptReferenceCell } from './ScriptReferenceCell';
import { ScriptStoryboardCell } from './ScriptStoryboardCell';
import { ScriptCommentsCell } from './ScriptCommentsCell';
import type { ScriptShareCommentRow } from '@/types/scripts';

interface Props {
  beat: BeatRow;
  columnConfig: ScriptColumnConfig;
  columnOrder?: string[];
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
  commentsLoading?: boolean;
  commentShareId?: string;
  onRefreshComments?: () => void;
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
  columnOrder,
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
  commentsLoading,
  commentShareId,
  onRefreshComments,
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

  const order = columnOrder ?? DEFAULT_COLUMN_ORDER;
  const orderedVisibleCols = getOrderedVisibleColumns(columnConfig, order);

  // Determine last text column for Tab→new beat
  const textKeys = order.filter(k => ['audio', 'visual', 'notes'].includes(k) && columnConfig[k as keyof ScriptColumnConfig]);
  const nonTextKeys = order.filter(k => ['reference', 'storyboard'].includes(k) && columnConfig[k as keyof ScriptColumnConfig]);
  const hasNonTextAfter = nonTextKeys.length > 0;
  const lastTextKey = textKeys[textKeys.length - 1];
  const lastTextCol = lastTextKey ? `${lastTextKey}_content` : 'audio_content';

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
        className={`group/gutter absolute left-0 top-0 w-10 h-full flex items-center justify-center border-b border-admin-border-subtle select-none ${selectionActive ? '' : 'cursor-grab'}`}
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
          {orderedVisibleCols.map(col => (
            <div key={col.key} className={`border-l ${col.borderColor}`} />
          ))}
        </div>

        <div className="grid items-stretch" style={{ gridTemplateColumns: gridTemplate }}>
          {(() => {
            const cellRenderers: Record<string, React.ReactNode> = {
              audio: (
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
              ),
              visual: (
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
              ),
              notes: (
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
              ),
              reference: (
                <ScriptReferenceCell
                  beatId={beat.id}
                  references={references}
                  onUpload={(files) => onUploadReference(beat.id, files)}
                  onDelete={onDeleteReference}
                  onImageMove={onImageMove}
                />
              ),
              storyboard: (
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
                  tags={tags}
                />
              ),
              comments: (
                <div className="border-b border-admin-border-subtle flex flex-col relative">
                  {commentsLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-admin-bg-base/60 backdrop-blur-[2px]">
                      <div className="w-4 h-4 border-2 border-admin-text-faint border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <ScriptCommentsCell comments={beatComments ?? []} shareId={commentShareId} beatId={beat.id} onRefresh={onRefreshComments} />
                </div>
              ),
            };
            return orderedVisibleCols.map(col => (
              <Fragment key={col.key}>{cellRenderers[col.key]}</Fragment>
            ));
          })()}
        </div>
      </div>

    </div>
  );
}
