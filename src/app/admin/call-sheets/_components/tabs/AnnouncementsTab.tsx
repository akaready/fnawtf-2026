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
import type { CallSheetBulletinRow } from '@/types/callsheet-admin';
import { upsertCallSheetBulletin, deleteCallSheetBulletin } from '../../../actions';

interface Props {
  bulletins: CallSheetBulletinRow[];
  callSheetId: string | null;
  onChanged: () => void;
}

function SortableBulletinCard({
  b,
  confirmDeleteId,
  setConfirmDeleteId,
  onUpdate,
  onUpdateField,
  onDelete,
  textareaRef,
}: {
  b: CallSheetBulletinRow;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onUpdate: (id: string, text: string) => void;
  onUpdateField: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id });
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
      className={`flex items-start gap-2 transition-opacity ${b.visible ? '' : 'opacity-40'}`}
    >
      <textarea
        ref={textareaRef}
        defaultValue={b.text}
        onBlur={(e) => {
          if (e.target.value !== b.text) onUpdate(b.id, e.target.value);
        }}
        rows={2}
        className="admin-input w-full resize-none"
        placeholder="Announcement text..."
      />
      <div className="flex items-center gap-0.5 pt-1.5 flex-shrink-0">
        <span
          {...listeners}
          className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-admin-text-muted hover:text-admin-text-primary transition-colors touch-none"
        >
          <GripVertical size={13} />
        </span>
        <button
          onClick={() => onUpdateField(b.id, 'visible', !b.visible)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            b.visible
              ? 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
              : 'text-admin-text-ghost hover:text-admin-text-muted hover:bg-admin-bg-hover'
          }`}
          title={b.visible ? 'Hide on call sheet' : 'Show on call sheet'}
        >
          {b.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <TwoStateDeleteButton
          itemId={b.id}
          confirmId={confirmDeleteId}
          onRequestConfirm={setConfirmDeleteId}
          onConfirmDelete={async (id) => { await onDelete(id); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
          size={13}
        />
      </div>
    </div>
  );
}

export function AnnouncementsTab({ bulletins, callSheetId, onChanged }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [orderedBulletins, setOrderedBulletins] = useState(bulletins);
  const [prevCount, setPrevCount] = useState(bulletins.length);
  const lastTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setOrderedBulletins(bulletins); }, [bulletins]);

  // Auto-focus newly added textarea
  useEffect(() => {
    if (bulletins.length > prevCount && lastTextareaRef.current) {
      lastTextareaRef.current.focus();
    }
    setPrevCount(bulletins.length);
  }, [bulletins.length, prevCount]);

  async function handleAdd() {
    if (!callSheetId) return;
    await upsertCallSheetBulletin(callSheetId, { text: '', sort_order: bulletins.length });
    onChanged();
  }

  async function handleUpdate(id: string, text: string) {
    await upsertCallSheetBulletin(callSheetId!, { id, text });
    onChanged();
  }

  async function handleUpdateField(id: string, field: string, value: unknown) {
    const b = orderedBulletins.find((n) => n.id === id);
    if (!b || !callSheetId) return;
    await upsertCallSheetBulletin(callSheetId, {
      id,
      text: b.text,
      pinned: field === 'pinned' ? (value as boolean) : b.pinned,
      visible: field === 'visible' ? (value as boolean) : b.visible,
      sort_order: b.sort_order,
    });
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteCallSheetBulletin(id);
    onChanged();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedBulletins.findIndex((b) => b.id === active.id);
    const newIndex = orderedBulletins.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(orderedBulletins, oldIndex, newIndex);
    setOrderedBulletins(reordered);
    await Promise.all(
      reordered.map((b, i) =>
        upsertCallSheetBulletin(callSheetId!, {
          id: b.id,
          text: b.text,
          pinned: b.pinned,
          visible: b.visible,
          sort_order: i,
        })
      )
    );
    onChanged();
  }

  return (
    <>
      <div>
        <label className="admin-label">Announcements</label>
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedBulletins.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {orderedBulletins.map((b, i) => (
                <SortableBulletinCard
                  key={b.id}
                  b={b}
                  confirmDeleteId={confirmDeleteId}
                  setConfirmDeleteId={setConfirmDeleteId}
                  onUpdate={handleUpdate}
                  onUpdateField={handleUpdateField}
                  onDelete={handleDelete}
                  textareaRef={i === orderedBulletins.length - 1 ? lastTextareaRef : undefined}
                />
              ))}
              <button onClick={handleAdd} className="btn-secondary w-full h-[2.375rem] inline-flex items-center justify-center gap-1.5 text-xs">
                <Plus size={13} />
                Add Announcement
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}
