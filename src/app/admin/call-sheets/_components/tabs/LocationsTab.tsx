'use client';

import { useState, useEffect, useId } from 'react';
import { Check, Eye, EyeOff, GripVertical, ChevronDown, ChevronRight, Plus } from 'lucide-react';
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
import type { CallSheetLocationJoined, CallSheetLocationImageJoined } from '@/types/callsheet-admin';
import { addCallSheetLocation, updateCallSheetLocation, removeCallSheetLocation, setCallSheetLocationImages } from '../../../actions';
import { createClient } from '@/lib/supabase/client';

interface Props {
  csLocations: CallSheetLocationJoined[];
  hospitalName: string;
  setHospitalName: (v: string) => void;
  hospitalAddress: string;
  setHospitalAddress: (v: string) => void;
  hospitalPhone: string;
  setHospitalPhone: (v: string) => void;
  locationImages: CallSheetLocationImageJoined[];
  callSheetId: string | null;
  onChanged: () => void;
  onImagesChanged: () => void;
}

interface LocationImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  location_id: string;
}

function SortableLocationCard({
  loc,
  confirmDeleteId,
  setConfirmDeleteId,
  onUpdate,
  onRemove,
  availableImages,
  selectedImageIds,
  onToggleImage,
}: {
  loc: CallSheetLocationJoined;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onRemove: (id: string) => void;
  availableImages: LocationImage[];
  selectedImageIds: Set<string>;
  onToggleImage: (imageId: string) => void;
}) {
  const [photosOpen, setPhotosOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: loc.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  const locImages = availableImages.filter((img) => img.location_id === loc.location_id);
  const selectedCount = locImages.filter((img) => selectedImageIds.has(img.id)).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`rounded-admin-md border border-admin-border bg-admin-bg-overlay p-4 space-y-3 transition-opacity ${
        loc.visible ? '' : 'opacity-40'
      }`}
    >
      {/* Header: location name + controls */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
            <p className="text-admin-lg font-medium text-admin-text-primary truncate">{loc.location_name}</p>
            {loc.location_address && (
              <p className="text-admin-base text-admin-text-muted truncate">{loc.location_address}</p>
            )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            {...listeners}
            className="w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-admin-text-muted hover:text-admin-text-primary transition-colors touch-none"
          >
            <GripVertical size={13} />
          </span>
          <button
            onClick={() => onUpdate(loc.id, 'visible', !loc.visible)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              loc.visible
                ? 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
                : 'text-admin-text-ghost hover:text-admin-text-muted hover:bg-admin-bg-hover'
            }`}
            title={loc.visible ? 'Hide on call sheet' : 'Show on call sheet'}
          >
            {loc.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <TwoStateDeleteButton
            itemId={loc.id}
            confirmId={confirmDeleteId}
            onRequestConfirm={setConfirmDeleteId}
            onConfirmDelete={async (id) => { await onRemove(id); setConfirmDeleteId(null); }}
            onCancel={() => setConfirmDeleteId(null)}
            size={13}
          />
        </div>
      </div>

      {/* Parking */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="admin-label">Parking Address</label>
          <input
            type="text"
            defaultValue={loc.parking_address ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (loc.parking_address ?? '')) onUpdate(loc.id, 'parking_address', e.target.value || null);
            }}
            placeholder="Parking address..."
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Parking Notes</label>
          <input
            type="text"
            defaultValue={loc.parking_note ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (loc.parking_note ?? '')) onUpdate(loc.id, 'parking_note', e.target.value || null);
            }}
            placeholder="Lot #, validation..."
            className="admin-input w-full"
          />
        </div>
      </div>

      {/* Collapsible photos for this location */}
      {locImages.length > 0 && (
        <div>
          <button
            onClick={() => setPhotosOpen(!photosOpen)}
            className="flex items-center gap-1.5 text-admin-text-muted hover:text-admin-text-primary transition-colors"
          >
            {photosOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span className="text-admin-sm font-medium">
              Photos{selectedCount > 0 ? ` (${selectedCount} selected)` : ` (${locImages.length})`}
            </span>
          </button>
          {photosOpen && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {locImages.map((img) => {
                const selected = selectedImageIds.has(img.id);
                return (
                  <button
                    key={img.id}
                    onClick={() => onToggleImage(img.id)}
                    className={`relative aspect-[4/3] rounded-admin-md overflow-hidden border-2 transition-all ${
                      selected
                        ? 'border-admin-accent ring-1 ring-admin-accent'
                        : 'border-transparent hover:border-admin-border'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text ?? ''}
                      className="w-full h-full object-cover"
                    />
                    {selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-admin-accent flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LocationsTab({
  csLocations,
  hospitalName, setHospitalName,
  hospitalAddress, setHospitalAddress,
  hospitalPhone, setHospitalPhone,
  locationImages,
  callSheetId,
  onChanged,
  onImagesChanged,
}: Props) {
  const [allLocations, setAllLocations] = useState<{ id: string; label: string }[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [orderedLocations, setOrderedLocations] = useState(csLocations);
  const [availableImages, setAvailableImages] = useState<LocationImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set(locationImages.map((li) => li.location_image_id))
  );
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setOrderedLocations(csLocations); }, [csLocations]);

  // Load all locations for combobox
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('locations')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        setAllLocations((data ?? []).map((l: Record<string, unknown>) => ({ id: l.id as string, label: l.name as string })));
      });
  }, []);

  // Load available images from all linked locations
  useEffect(() => {
    if (orderedLocations.length === 0) {
      setAvailableImages([]);
      return;
    }
    const supabase = createClient();
    const locationIds = orderedLocations.map((l) => l.location_id);
    supabase
      .from('location_images')
      .select('id, image_url, alt_text, location_id')
      .in('location_id', locationIds)
      .order('sort_order')
      .then(({ data }) => {
        setAvailableImages((data ?? []) as LocationImage[]);
      });
  }, [orderedLocations]);

  // Sync selected image IDs when locationImages prop changes
  useEffect(() => {
    setSelectedImageIds(new Set(locationImages.map((li) => li.location_image_id)));
  }, [locationImages]);

  async function handleAdd(locationId: string | null) {
    if (!callSheetId || !locationId) return;
    if (csLocations.some((l) => l.location_id === locationId)) return;
    await addCallSheetLocation(callSheetId, locationId, { sort_order: csLocations.length });
    onChanged();
  }

  async function handleUpdate(id: string, field: string, value: unknown) {
    await updateCallSheetLocation(id, { [field]: value });
    onChanged();
  }

  async function handleRemove(id: string) {
    await removeCallSheetLocation(id);
    onChanged();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedLocations.findIndex((l) => l.id === active.id);
    const newIndex = orderedLocations.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(orderedLocations, oldIndex, newIndex);
    setOrderedLocations(reordered);
    await Promise.all(
      reordered.map((l, i) => updateCallSheetLocation(l.id, { sort_order: i }))
    );
    onChanged();
  }

  async function toggleImage(imageId: string) {
    if (!callSheetId) return;
    const next = new Set(selectedImageIds);
    if (next.has(imageId)) {
      next.delete(imageId);
    } else {
      next.add(imageId);
    }
    setSelectedImageIds(next);

    const images = Array.from(next).map((id, i) => ({
      location_image_id: id,
      source: 'location',
      sort_order: i,
    }));
    await setCallSheetLocationImages(callSheetId, images);
    onImagesChanged();
  }

  const availableToAdd = allLocations.filter(
    (l) => !csLocations.some((existing) => existing.location_id === l.id)
  );

  return (
    <>
      {/* Nearest Hospital — 3 columns */}
      <div>
        <label className="admin-label">Nearest Hospital</label>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="Hospital name..."
            className="admin-input w-full"
          />
          <input
            type="text"
            value={hospitalAddress}
            onChange={(e) => setHospitalAddress(e.target.value)}
            placeholder="Address..."
            className="admin-input w-full"
          />
          <input
            type="text"
            value={hospitalPhone}
            onChange={(e) => setHospitalPhone(e.target.value)}
            placeholder="Phone..."
            className="admin-input w-full"
          />
        </div>
      </div>

      <hr className="border-admin-border" />

      {/* Location list */}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedLocations.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedLocations.map((loc) => (
              <SortableLocationCard
                key={loc.id}
                loc={loc}
                confirmDeleteId={confirmDeleteId}
                setConfirmDeleteId={setConfirmDeleteId}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                availableImages={availableImages}
                selectedImageIds={selectedImageIds}
                onToggleImage={toggleImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add location */}
      {showAddLocation ? (
        <AdminCombobox
          value={null}
          options={availableToAdd}
          onChange={(id) => { handleAdd(id); setShowAddLocation(false); }}
          placeholder="Search locations..."
          autoFocus
        />
      ) : (
        <button onClick={() => setShowAddLocation(true)} className="btn-secondary w-full h-[2.375rem] inline-flex items-center justify-center gap-1.5 text-xs">
          <Plus size={13} />
          Add Location
        </button>
      )}
    </>
  );
}
