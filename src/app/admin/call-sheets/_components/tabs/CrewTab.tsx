'use client';

import { useState, useEffect, useId } from 'react';
import { PanelRightOpen, GripVertical, Plus } from 'lucide-react';
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
import { AdminCombobox } from '@/app/admin/_components/AdminCombobox';
import { TwoStateDeleteButton } from '@/app/admin/_components/TwoStateDeleteButton';
import type { CallSheetCrewJoined } from '@/types/callsheet-admin';
import { addCallSheetCrew, updateCallSheetCrew, removeCallSheetCrew } from '../../../actions';
import { createClient } from '@/lib/supabase/client';

interface Props {
  crew: CallSheetCrewJoined[];
  callSheetId: string | null;
  onChanged: () => void;
  onOpenContact?: (contactId: string) => void;
}

function SortableCrewCard({
  c,
  confirmDeleteId,
  setConfirmDeleteId,
  onUpdate,
  onRemove,
  onOpenContact,
}: {
  c: CallSheetCrewJoined;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onRemove: (id: string) => void;
  onOpenContact?: (contactId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
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
      className="rounded-admin-md border border-admin-border bg-admin-bg-overlay p-4 space-y-3"
    >
      {/* Name + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {c.headshot_url ? (
            <img
              src={c.headshot_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-admin-bg-hover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-admin-text-primary truncate">{c.contact_name}</p>
            {c.phone && (
              <p className="text-admin-xs text-admin-text-muted">{c.phone}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            {...listeners}
            className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-admin-text-muted hover:text-admin-text-primary transition-colors touch-none"
          >
            <GripVertical size={13} />
          </span>
          {onOpenContact && (
            <button
              type="button"
              onClick={() => onOpenContact(c.contact_id)}
              className="btn-ghost w-8 h-8"
              title="View contact"
            >
              <PanelRightOpen size={13} />
            </button>
          )}
          <TwoStateDeleteButton
            itemId={c.id}
            confirmId={confirmDeleteId}
            onRequestConfirm={setConfirmDeleteId}
            onConfirmDelete={async (id) => { await onRemove(id); setConfirmDeleteId(null); }}
            onCancel={() => setConfirmDeleteId(null)}
            size={13}
          />
        </div>
      </div>

      {/* Role + times */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="admin-label">Role</label>
          <input
            type="text"
            defaultValue={c.role_override ?? c.contact_role ?? ''}
            onBlur={(e) => {
              const newVal = e.target.value || null;
              if (newVal !== (c.role_override ?? c.contact_role ?? null)) {
                onUpdate(c.id, 'role_override', newVal);
              }
            }}
            placeholder="Role..."
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Call</label>
          <input
            type="text"
            defaultValue={c.call_time ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (c.call_time ?? '')) onUpdate(c.id, 'call_time', e.target.value || null);
            }}
            placeholder="8:00 AM"
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Wrap</label>
          <input
            type="text"
            defaultValue={c.wrap_time ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (c.wrap_time ?? '')) onUpdate(c.id, 'wrap_time', e.target.value || null);
            }}
            placeholder="6:00 PM"
            className="admin-input w-full"
          />
        </div>
      </div>
    </div>
  );
}

export function CrewTab({ crew, callSheetId, onChanged, onOpenContact }: Props) {
  const [crewContacts, setCrewContacts] = useState<{ id: string; label: string; role: string | null }[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddCrew, setShowAddCrew] = useState(false);
  const [orderedCrew, setOrderedCrew] = useState(crew);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setOrderedCrew(crew); }, [crew]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('contacts')
      .select('id, first_name, last_name, role')
      .in('type', ['crew', 'staff'])
      .order('first_name')
      .then(({ data }) => {
        setCrewContacts(
          (data ?? []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
            role: (c.role as string) ?? null,
          }))
        );
      });
  }, []);

  async function handleAdd(contactId: string | null) {
    if (!callSheetId || !contactId) return;
    if (crew.some((c) => c.contact_id === contactId)) return;
    const contact = crewContacts.find((c) => c.id === contactId);
    await addCallSheetCrew(callSheetId, contactId, {
      role_override: contact?.role ?? null,
      sort_order: crew.length,
    });
    onChanged();
  }

  async function handleUpdate(id: string, field: string, value: unknown) {
    await updateCallSheetCrew(id, { [field]: value });
    onChanged();
  }

  async function handleRemove(id: string) {
    await removeCallSheetCrew(id);
    onChanged();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedCrew.findIndex((c) => c.id === active.id);
    const newIndex = orderedCrew.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(orderedCrew, oldIndex, newIndex);
    setOrderedCrew(reordered);
    await Promise.all(
      reordered.map((c, i) => updateCallSheetCrew(c.id, { sort_order: i }))
    );
    onChanged();
  }

  const availableContacts = crewContacts
    .filter((c) => !crew.some((existing) => existing.contact_id === c.id))
    .map((c) => ({ id: c.id, label: c.label }));

  return (
    <>
      {/* Crew list */}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedCrew.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedCrew.map((c) => (
              <SortableCrewCard
                key={c.id}
                c={c}
                confirmDeleteId={confirmDeleteId}
                setConfirmDeleteId={setConfirmDeleteId}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                onOpenContact={onOpenContact}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add crew member */}
      {showAddCrew ? (
        <AdminCombobox
          value={null}
          options={availableContacts}
          onChange={(id) => { handleAdd(id); setShowAddCrew(false); }}
          placeholder="Search crew..."
          autoFocus
        />
      ) : (
        <button onClick={() => setShowAddCrew(true)} className="btn-secondary w-full h-[2.375rem] inline-flex items-center justify-center gap-1.5 text-xs">
          <Plus size={13} />
          Add Crew Member
        </button>
      )}
    </>
  );
}
