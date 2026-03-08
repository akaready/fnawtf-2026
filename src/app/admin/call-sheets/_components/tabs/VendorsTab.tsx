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
import type { CallSheetVendorJoined } from '@/types/callsheet-admin';
import { addCallSheetVendor, updateCallSheetVendor, removeCallSheetVendor } from '../../../actions';
import { createClient } from '@/lib/supabase/client';

interface Props {
  vendors: CallSheetVendorJoined[];
  callSheetId: string | null;
  onChanged: () => void;
  onOpenCompany?: (companyId: string) => void;
}

function SortableVendorCard({
  v,
  confirmDeleteId,
  setConfirmDeleteId,
  onUpdate,
  onRemove,
  onOpenCompany,
}: {
  v: CallSheetVendorJoined;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onRemove: (id: string) => void;
  onOpenCompany?: (companyId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: v.id });
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
      <div className="flex items-center justify-between">
        <p className="font-medium text-admin-text-primary">{v.company_name}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            {...listeners}
            className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-admin-text-muted hover:text-admin-text-primary transition-colors touch-none"
          >
            <GripVertical size={13} />
          </span>
          {onOpenCompany && (
            <button
              type="button"
              onClick={() => onOpenCompany(v.company_id)}
              className="btn-ghost w-8 h-8"
              title="View company"
            >
              <PanelRightOpen size={13} />
            </button>
          )}
          <TwoStateDeleteButton
            itemId={v.id}
            confirmId={confirmDeleteId}
            onRequestConfirm={setConfirmDeleteId}
            onConfirmDelete={async (id) => { await onRemove(id); setConfirmDeleteId(null); }}
            onCancel={() => setConfirmDeleteId(null)}
            size={13}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="admin-label">Role</label>
          <input
            type="text"
            defaultValue={v.role_label ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (v.role_label ?? '')) onUpdate(v.id, 'role_label', e.target.value || null);
            }}
            placeholder="Catering, Grip..."
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Contact</label>
          <input
            type="text"
            defaultValue={v.contact_person ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (v.contact_person ?? '')) onUpdate(v.id, 'contact_person', e.target.value || null);
            }}
            placeholder="Contact name..."
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Phone</label>
          <input
            type="text"
            defaultValue={v.phone_override ?? v.company_phone ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (v.phone_override ?? v.company_phone ?? '')) {
                onUpdate(v.id, 'phone_override', e.target.value || null);
              }
            }}
            placeholder="Phone..."
            className="admin-input w-full"
          />
        </div>
      </div>
    </div>
  );
}

export function VendorsTab({ vendors, callSheetId, onChanged, onOpenCompany }: Props) {
  const [vendorCompanies, setVendorCompanies] = useState<{ id: string; label: string }[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [orderedVendors, setOrderedVendors] = useState(vendors);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setOrderedVendors(vendors); }, [vendors]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('clients')
      .select('id, name, company_types')
      .contains('company_types', ['vendor'])
      .order('name')
      .then(({ data }) => {
        setVendorCompanies(
          (data ?? []).map((c: Record<string, unknown>) => ({ id: c.id as string, label: c.name as string }))
        );
      });
  }, []);

  async function handleAdd(companyId: string | null) {
    if (!callSheetId || !companyId) return;
    if (vendors.some((v) => v.company_id === companyId)) return;
    await addCallSheetVendor(callSheetId, companyId, { sort_order: vendors.length });
    onChanged();
  }

  async function handleUpdate(id: string, field: string, value: unknown) {
    await updateCallSheetVendor(id, { [field]: value });
    onChanged();
  }

  async function handleRemove(id: string) {
    await removeCallSheetVendor(id);
    onChanged();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedVendors.findIndex((v) => v.id === active.id);
    const newIndex = orderedVendors.findIndex((v) => v.id === over.id);
    const reordered = arrayMove(orderedVendors, oldIndex, newIndex);
    setOrderedVendors(reordered);
    await Promise.all(
      reordered.map((v, i) => updateCallSheetVendor(v.id, { sort_order: i }))
    );
    onChanged();
  }

  const availableVendors = vendorCompanies.filter(
    (v) => !vendors.some((existing) => existing.company_id === v.id)
  );

  return (
    <>
      {/* Vendor list */}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedVendors.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedVendors.map((v) => (
              <SortableVendorCard
                key={v.id}
                v={v}
                confirmDeleteId={confirmDeleteId}
                setConfirmDeleteId={setConfirmDeleteId}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                onOpenCompany={onOpenCompany}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add vendor */}
      {showAddVendor ? (
        <AdminCombobox
          value={null}
          options={availableVendors}
          onChange={(id) => { handleAdd(id); setShowAddVendor(false); }}
          placeholder="Search vendors..."
          autoFocus
        />
      ) : (
        <button onClick={() => setShowAddVendor(true)} className="btn-secondary w-full h-[2.375rem] inline-flex items-center justify-center gap-1.5 text-xs">
          <Plus size={13} />
          Add Vendor
        </button>
      )}
    </>
  );
}
