'use client';

import { useState } from 'react';
import { Trash2, Check, X, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScriptBeatCell } from './ScriptBeatCell';
import type { ScriptBeatRow as BeatRow, ScriptCharacterRow, ScriptTagRow, ScriptColumnConfig, ScriptBeatReferenceRow } from '@/types/scripts';
import { ScriptReferenceCell } from './ScriptReferenceCell';

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
  gridTemplate: string;
  isOnly: boolean;
  beatNumber: number;
  isSelected?: boolean;
  onSelect?: (beatId: string, shiftKey: boolean, metaKey: boolean) => void;
  onDragSelectStart?: (beatId: string) => void;
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
  onDelete,
  onAddBeat,
  onAddScene,
  onUploadReference,
  onDeleteReference,
  references,
  gridTemplate,
  isOnly,
  beatNumber,
  isSelected,
  onSelect,
  onDragSelectStart,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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
  const lastTextCol = columnConfig.notes ? 'notes_content' : columnConfig.visual ? 'visual_content' : 'audio_content';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/beat relative hover:bg-admin-bg-wash transition-colors ${
        isSelected ? 'bg-admin-bg-selected' : ''
      }`}
    >
      {/* Beat letter gutter — selection via click + drag-select */}
      <div
        className="absolute left-0 top-0 w-10 h-full flex items-center justify-center border-b border-b-[#0e0e0e] select-none"
        data-beat-gutter={beat.id}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if ((e.target as HTMLElement).closest('[data-grip]')) return;
          onDragSelectStart?.(beat.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if ((e.target as HTMLElement).closest('[data-grip]')) return;
          onSelect?.(beat.id, e.shiftKey, e.metaKey || e.ctrlKey);
        }}
      >
        {/* Beat letter — hidden on hover, replaced by grip */}
        <span className="text-[10px] text-admin-text-ghost font-mono group-hover/beat:hidden">
          {beatLetter(beatNumber)}
        </span>
        {/* Reorder grip — replaces letter on hover */}
        <div
          data-grip
          {...attributes}
          {...listeners}
          className="hidden group-hover/beat:flex items-center cursor-grab"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} className="text-admin-text-ghost" />
        </div>
      </div>

      {/* Content grid */}
      <div className="relative ml-10 min-w-0 border-r border-admin-border">
        {/* Vertical column accent lines — overlay, above horizontal borders */}
        <div
          className="absolute inset-0 z-10 pointer-events-none grid"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columnConfig.audio && <div className="border-l border-l-[var(--admin-accent)]" />}
          {columnConfig.visual && <div className="border-l border-l-[var(--admin-info)]" />}
          {columnConfig.notes && <div className="border-l border-l-[var(--admin-warning)]" />}
          {columnConfig.reference && <div className="border-l border-l-[var(--admin-success)]" />}
        </div>

        <div className="grid items-stretch" style={{ gridTemplateColumns: gridTemplate }}>
          {columnConfig.audio && (
            <ScriptBeatCell
              value={beat.audio_content}
              field="audio_content"
              onChange={(v) => onUpdate(beat.id, 'audio_content', v)}
              onAddBeat={onAddBeat}
              onAddScene={onAddScene}
              isLastColumn={lastTextCol === 'audio_content' && !columnConfig.reference}
              characters={characters}
              tags={tags}
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
              isLastColumn={lastTextCol === 'visual_content' && !columnConfig.reference}
              characters={characters}
              tags={tags}
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
              isLastColumn={lastTextCol === 'notes_content' && !columnConfig.reference}
              characters={characters}
              tags={tags}
              beatId={beat.id}
            />
          )}
          {columnConfig.reference && (
            <ScriptReferenceCell
              beatId={beat.id}
              references={references}
              onUpload={(files) => onUploadReference(beat.id, files)}
              onDelete={onDeleteReference}
            />
          )}
        </div>
      </div>

      {/* Delete with confirm */}
      {!isOnly && (
        <div className="absolute right-2 top-2 opacity-0 group-hover/beat:opacity-100 transition-all flex items-center gap-0.5">
          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(beat.id)}
                className="text-admin-danger hover:text-red-300 p-1 transition-colors"
                title="Confirm delete"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-admin-text-faint hover:text-admin-text-primary p-1 transition-colors"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-admin-text-ghost hover:text-admin-danger p-1 transition-colors"
              title="Delete beat"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
