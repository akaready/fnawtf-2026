'use client';

import { useState, useEffect, useId, useRef } from 'react';
import { Plus, Eye, EyeOff, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { TwoStateDeleteButton } from '@/app/admin/_components/TwoStateDeleteButton';
import type { CallSheetDeptNoteRow } from '@/types/callsheet-admin';
import { upsertCallSheetDeptNote, deleteCallSheetDeptNote } from '../../../actions';

/** Default departments pre-created on new call sheets (matching Demo4 sections) */
const DEFAULT_DEPARTMENTS = ['PRODUCTION', 'CAMERA', 'LIGHTING', 'GRIP', 'PRODUCTION DESIGN', 'SOUND'];

interface Props {
  deptNotes: CallSheetDeptNoteRow[];
  callSheetId: string | null;
  onChanged: () => void;
}

function SortableDeptNoteCard({
  note,
  confirmDeleteId,
  setConfirmDeleteId,
  onUpdate,
  onDelete,
}: {
  note: CallSheetDeptNoteRow;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`rounded-admin-md border border-admin-border bg-admin-bg-overlay p-4 space-y-3 transition-opacity ${
        note.visible ? '' : 'opacity-40'
      }`}
    >
      {/* Header: name + drag + visibility eye + delete */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          defaultValue={note.department}
          onBlur={(e) => {
            if (e.target.value !== note.department) onUpdate(note.id, 'department', e.target.value);
          }}
          className="admin-input flex-1 font-medium uppercase"
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            {...listeners}
            className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-admin-text-muted hover:text-admin-text-primary transition-colors touch-none"
          >
            <GripVertical size={13} />
          </span>
          <button
            onClick={() => onUpdate(note.id, 'visible', !note.visible)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              note.visible
                ? 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
                : 'text-admin-text-ghost hover:text-admin-text-muted hover:bg-admin-bg-hover'
            }`}
            title={note.visible ? 'Hide on call sheet' : 'Show on call sheet'}
          >
            {note.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <TwoStateDeleteButton
            itemId={note.id}
            confirmId={confirmDeleteId}
            onRequestConfirm={setConfirmDeleteId}
            onConfirmDelete={async (id) => { await onDelete(id); setConfirmDeleteId(null); }}
            onCancel={() => setConfirmDeleteId(null)}
            size={13}
          />
        </div>
      </div>

      {/* Notes textarea */}
      <textarea
        defaultValue={note.notes}
        onBlur={(e) => {
          if (e.target.value !== note.notes) onUpdate(note.id, 'notes', e.target.value);
        }}
        rows={3}
        placeholder="Department notes..."
        className="admin-input w-full resize-none"
      />
    </div>
  );
}

export function DeptNotesTab({ deptNotes, callSheetId, onChanged }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [orderedNotes, setOrderedNotes] = useState(deptNotes);
  const [prevCount, setPrevCount] = useState(deptNotes.length);
  const listRef = useRef<HTMLDivElement>(null);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setOrderedNotes(deptNotes); }, [deptNotes]);

  // Auto-focus newly added department name input
  useEffect(() => {
    if (deptNotes.length > prevCount && listRef.current) {
      const inputs = listRef.current.querySelectorAll<HTMLInputElement>('input[type="text"]');
      const last = inputs[inputs.length - 1];
      if (last) { last.focus(); last.select(); }
    }
    setPrevCount(deptNotes.length);
  }, [deptNotes.length, prevCount]);

  // Auto-prefill default departments if none exist
  async function handlePrefill() {
    if (!callSheetId || deptNotes.length > 0 || initializing) return;
    setInitializing(true);
    try {
      for (let i = 0; i < DEFAULT_DEPARTMENTS.length; i++) {
        await upsertCallSheetDeptNote(callSheetId, {
          department: DEFAULT_DEPARTMENTS[i],
          notes: '',
          visible: true,
          sort_order: i,
        });
      }
      onChanged();
    } finally {
      setInitializing(false);
    }
  }

  async function handleAdd() {
    if (!callSheetId) return;
    await upsertCallSheetDeptNote(callSheetId, {
      department: 'NEW DEPARTMENT',
      notes: '',
      sort_order: deptNotes.length,
    });
    onChanged();
  }

  async function handleUpdate(id: string, field: string, value: unknown) {
    const note = orderedNotes.find((n) => n.id === id);
    if (!note || !callSheetId) return;
    await upsertCallSheetDeptNote(callSheetId, {
      id,
      department: field === 'department' ? (value as string) : note.department,
      notes: field === 'notes' ? (value as string) : note.notes,
      visible: field === 'visible' ? (value as boolean) : note.visible,
      sort_order: note.sort_order,
    });
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteCallSheetDeptNote(id);
    onChanged();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedNotes.findIndex((n) => n.id === active.id);
    const newIndex = orderedNotes.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(orderedNotes, oldIndex, newIndex);
    setOrderedNotes(reordered);
    await Promise.all(
      reordered.map((n, i) =>
        upsertCallSheetDeptNote(callSheetId!, {
          id: n.id,
          department: n.department,
          notes: n.notes,
          visible: n.visible,
          sort_order: i,
        })
      )
    );
    onChanged();
  }

  return (
    <>
      <label className="admin-label">Department Notes</label>

      {/* Department notes list */}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedNotes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          <div ref={listRef} className="space-y-3">
            {orderedNotes.map((note) => (
              <SortableDeptNoteCard
                key={note.id}
                note={note}
                confirmDeleteId={confirmDeleteId}
                setConfirmDeleteId={setConfirmDeleteId}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
            <div className="flex gap-2">
              <button onClick={handleAdd} className="btn-secondary flex-1 h-[2.375rem] inline-flex items-center justify-center gap-1.5 text-xs">
                <Plus size={13} />
                Add Department
              </button>
              {deptNotes.length === 0 && (
                <button
                  onClick={handlePrefill}
                  disabled={initializing}
                  className="btn-secondary flex-1 h-[2.375rem] inline-flex items-center justify-center gap-1.5 text-xs"
                >
                  <Plus size={13} /><Plus size={13} className="-ml-2" />
                  {initializing ? 'Adding...' : 'Add Defaults'}
                </button>
              )}
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
