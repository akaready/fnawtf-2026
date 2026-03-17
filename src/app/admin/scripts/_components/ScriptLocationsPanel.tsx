'use client';

import { useState, useEffect, useCallback, useRef, useMemo, useId } from 'react';
import { Plus, Trash2, Check, X, Loader2, MapPin } from 'lucide-react';
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
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { ColorPicker } from './ColorPicker';
import {
  createLocation, updateLocation, deleteLocation,
  assignLocationOption, removeLocationOption, reorderLocationOptions,
} from '@/app/admin/actions';
import type { ScriptLocationRow, ScriptSceneRow, LocationOptionWithLocation } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  locations: ScriptLocationRow[];
  scenes: ScriptSceneRow[];
  onLocationsChange: (locs: ScriptLocationRow[]) => void;
  globalLocations?: { id: string; name: string; featured_image: string | null }[];
  locationOptionsMap: Record<string, LocationOptionWithLocation[]>;
  onLocationOptionsMapChange: (map: Record<string, LocationOptionWithLocation[]>) => void;
}

// ── Sortable Location Option Row ──────────────────────────────────────────

function SortableLocationRow({
  option,
  isFeatured,
  onRemove,
}: {
  option: LocationOptionWithLocation;
  isFeatured: boolean;
  onRemove: (optionId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: option.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: isFeatured ? 'var(--admin-warning)' : 'var(--admin-border-subtle)' }}
      {...attributes}
      {...listeners}
      className="group/loc rounded-admin-md transition-colors cursor-grab active:cursor-grabbing border bg-admin-bg-overlay hover:bg-admin-bg-hover"
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          {option.location.featured_image ? (
            <img
              src={option.location.featured_image}
              alt=""
              className="w-10 h-10 rounded-admin-sm object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-admin-sm bg-admin-bg-inset flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-admin-text-ghost" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-admin-text-primary truncate">
              {option.location.name}
            </div>
            {(option.location.city || option.location.state) && (
              <div className="text-xs text-admin-text-muted truncate">
                {[option.location.city, option.location.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover/loc:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onRemove(option.id)}
              className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Location Picker Popover ───────────────────────────────────────────────

function LocationPickerPopover({
  globalLocations,
  assignedLocationIds,
  onSelect,
  onClose,
}: {
  globalLocations: { id: string; name: string; featured_image: string | null }[];
  assignedLocationIds: Set<string>;
  onSelect: (loc: { id: string; name: string; featured_image: string | null }) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const filtered = search
    ? globalLocations.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : globalLocations;

  return (
    <div
      ref={popoverRef}
      className="w-full bg-admin-bg-overlay border border-admin-border rounded-admin-lg shadow-xl overflow-hidden"
    >
      <div className="p-2 border-b border-admin-border-subtle">
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search locations…"
          className="admin-input w-full text-xs py-1.5 px-2.5"
        />
      </div>
      <div className="max-h-[200px] overflow-y-auto admin-scrollbar">
        {filtered.length === 0 ? (
          <p className="text-xs text-admin-text-faint text-center py-4">No locations found.</p>
        ) : (
          filtered.map(g => {
            const assigned = assignedLocationIds.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() => !assigned && onSelect(g)}
                disabled={assigned}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
                  assigned
                    ? 'opacity-40 cursor-default'
                    : 'hover:bg-admin-bg-hover'
                }`}
              >
                {g.featured_image ? (
                  <img
                    src={g.featured_image}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-admin-bg-inset flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-admin-text-ghost" />
                  </div>
                )}
                <span className="text-sm text-admin-text-primary">{g.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────

export function ScriptLocationsPanel({
  open, onClose, scriptId, locations, scenes, onLocationsChange,
  globalLocations = [], locationOptionsMap, onLocationOptionsMapChange,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  // Local edits for dirty state tracking
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<ScriptLocationRow>>>({});
  const localEditsRef = useRef(localEdits);
  useEffect(() => { localEditsRef.current = localEdits; });

  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Auto-select first location, or clear if deleted
  useEffect(() => {
    if (selectedId && !locations.find(l => l.id === selectedId)) {
      setSelectedId(locations[0]?.id ?? null);
    }
    if (!selectedId && locations.length > 0) {
      setSelectedId(locations[0].id);
    }
  }, [locations, selectedId]);

  // Clear local edits + picker when panel closes
  useEffect(() => {
    if (!open) {
      setLocalEdits({});
      setShowPicker(false);
    }
  }, [open]);

  // Reset picker when switching locations
  useEffect(() => {
    setShowPicker(false);
  }, [selectedId]);

  // Chat panel context
  const { setPanelContext } = useChatContext();

  useEffect(() => {
    if (!scriptId) return;
    const lines: string[] = [];
    lines.push(`Total Locations: ${locations.length}`);
    locations.forEach(loc => {
      const locEdits = localEdits[loc.id];
      const name = locEdits?.name ?? loc.name;
      const description = locEdits?.description ?? loc.description;
      const options = locationOptionsMap[loc.id] ?? [];
      const sceneCount = scenes.filter(s => s.location_id === loc.id).length;
      lines.push(`\n[${name}]`);
      if (description) lines.push(`  Description: ${description}`);
      if (loc.color) lines.push(`  Color: ${loc.color}`);
      if (sceneCount > 0) lines.push(`  Scenes: ${sceneCount}`);
      if (options.length > 0) {
        lines.push(`  Linked Locations (${options.length}):`);
        options.forEach(opt => {
          const parts = [opt.location.name];
          const geo = [opt.location.city, opt.location.state].filter(Boolean).join(', ');
          if (geo) parts.push(geo);
          if (opt.location.address) parts.push(opt.location.address);
          if (opt.is_featured) parts.push('(featured)');
          lines.push(`    - ${parts.join(' — ')}`);
        });
      }
    });
    setPanelContext({
      recordType: 'script-locations',
      recordId: scriptId,
      recordLabel: `Locations (${locations.length})`,
      summary: lines.join('\n'),
    });
    return () => setPanelContext(null);
  }, [scriptId, locations, localEdits, scenes, locationOptionsMap, setPanelContext]);

  const sceneCountByLocation = (locationId: string) =>
    scenes.filter(s => s.location_id === locationId).length;

  const selected = locations.find(l => l.id === selectedId) ?? null;
  const selectedWithEdits = selected
    ? { ...selected, ...localEdits[selected.id] }
    : null;
  const selectedOptions = selected ? (locationOptionsMap[selected.id] ?? []) : [];

  const assignedLocationIds = useMemo(
    () => new Set(selectedOptions.map(o => o.location_id)),
    [selectedOptions],
  );

  // ── Auto-save ───────────────────────────────────────────────────
  const autoSave = useAutoSave(async () => {
    const entries = Object.entries(localEditsRef.current);
    if (entries.length === 0) return;
    for (const [locId, edits] of entries) {
      await updateLocation(locId, edits);
    }
    const updated = locations.map(l => localEditsRef.current[l.id] ? { ...l, ...localEditsRef.current[l.id] } : l);
    onLocationsChange(updated);
    setLocalEdits({});
  });

  const handleClose = useCallback(() => {
    autoSave.flush();
    onClose();
  }, [autoSave, onClose]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const id = await createLocation(scriptId, {
        name: 'New Location',
        description: '',
        sort_order: locations.length,
      });
      const newLoc: ScriptLocationRow = {
        id,
        script_id: scriptId,
        name: 'New Location',
        description: null,
        color: '#38bdf8',
        sort_order: locations.length,
        global_location_id: null,
        created_at: new Date().toISOString(),
      };
      onLocationsChange([...locations, newLoc]);
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  const handleLocalUpdate = (locId: string, field: string, value: string | null) => {
    setLocalEdits(prev => ({
      ...prev,
      [locId]: { ...prev[locId], [field]: value },
    }));
    autoSave.trigger();
  };

  const handleDelete = async (locId: string) => {
    await deleteLocation(locId);
    onLocationsChange(locations.filter(l => l.id !== locId));
    setConfirmDeleteId(null);
    setLocalEdits(prev => {
      const next = { ...prev };
      delete next[locId];
      return next;
    });
  };

  // ── Location option handlers ──────────────────────────────────────

  const handleAssignLocation = useCallback(async (globalLoc: { id: string; name: string; featured_image: string | null }) => {
    if (!selected) return;
    setShowPicker(false);

    const optionId = await assignLocationOption(selected.id, globalLoc.id);
    const isFirst = selectedOptions.length === 0;

    const newEntry: LocationOptionWithLocation = {
      id: optionId,
      script_location_id: selected.id,
      location_id: globalLoc.id,
      slot_order: selectedOptions.length,
      is_featured: isFirst,
      appearance_prompt: null,
      created_at: new Date().toISOString(),
      location: {
        id: globalLoc.id,
        name: globalLoc.name,
        featured_image: globalLoc.featured_image,
        address: null,
        city: null,
        state: null,
        appearance_prompt: null,
        top_images: [],
      },
    };

    const updated = [...selectedOptions, newEntry];
    onLocationOptionsMapChange({ ...locationOptionsMap, [selected.id]: updated });
  }, [selected, selectedOptions, locationOptionsMap, onLocationOptionsMapChange]);

  const handleRemoveLocation = useCallback(async (optionId: string) => {
    if (!selected) return;
    await removeLocationOption(optionId);
    const updated = selectedOptions.filter(o => o.id !== optionId);
    // Re-feature first if needed
    if (updated.length > 0 && !updated.some(o => o.is_featured)) {
      updated[0] = { ...updated[0], is_featured: true };
    }
    onLocationOptionsMapChange({ ...locationOptionsMap, [selected.id]: updated });
  }, [selected, selectedOptions, locationOptionsMap, onLocationOptionsMapChange]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!selected) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedOptions.findIndex(o => o.id === active.id);
    const newIndex = selectedOptions.findIndex(o => o.id === over.id);
    const reordered = arrayMove(selectedOptions, oldIndex, newIndex).map((o, i) => ({
      ...o,
      slot_order: i,
      is_featured: i === 0,
    }));

    onLocationOptionsMapChange({ ...locationOptionsMap, [selected.id]: reordered });
    await reorderLocationOptions(selected.id, reordered.map(o => o.id));
  }, [selected, selectedOptions, locationOptionsMap, onLocationOptionsMapChange]);

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[580px]">
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-[4rem] border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-semibold text-admin-text-primary">Locations</h2>
          <div className="flex items-center">
            <SaveDot status={autoSave.status} />
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Location list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            {/* Add button at top */}
            <div className="flex-shrink-0 border-b border-admin-border px-3 py-3 flex items-center">
              <button
                onClick={handleAdd}
                disabled={adding}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={12} />}
                Add Location
              </button>
            </div>
            <div className="flex-1 overflow-y-auto admin-scrollbar-auto py-2">
              {locations.length === 0 && (
                <p className="text-xs text-admin-text-faint text-center py-6 px-3">
                  No locations yet.
                </p>
              )}
              {locations.map(loc => {
                const count = sceneCountByLocation(loc.id);
                const isSelected = selectedId === loc.id;
                const locOptions = locationOptionsMap[loc.id] ?? [];
                const featured = locOptions.find(o => o.is_featured);
                return (
                  <div
                    key={loc.id}
                    className={`group/row w-full flex items-center px-4 py-2.5 gap-2 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedId(loc.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    >
                      {featured?.location.featured_image ? (
                        <img
                          src={featured.location.featured_image}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          style={{ boxShadow: `0 0 0 2px ${loc.color}` }}
                        />
                      ) : (
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: loc.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate uppercase">{loc.name}</div>
                        {count > 0 && (
                          <div className="text-[10px] text-admin-text-faint">{count} scene{count !== 1 ? 's' : ''}</div>
                        )}
                      </div>
                    </button>
                    {/* Two-step delete */}
                    {confirmDeleteId === loc.id ? (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(loc.id)}
                          className="p-1 text-admin-danger hover:text-red-300 transition-colors"
                          title="Confirm delete"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 text-admin-text-faint hover:text-admin-text-primary transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(loc.id)}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-admin-text-ghost hover:text-admin-danger transition-all flex-shrink-0"
                        title="Delete location"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detail pane */}
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar-auto">
            {selectedWithEdits ? (
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={selectedWithEdits.name}
                      onChange={e => handleLocalUpdate(selectedWithEdits.id, 'name', e.target.value)}
                      className="admin-input flex-1 min-w-0 text-base font-semibold py-2 px-3 uppercase"
                      placeholder="Location name"
                    />
                    <ColorPicker value={selectedWithEdits.color} onChange={c => handleLocalUpdate(selectedWithEdits.id, 'color', c)} />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                  <textarea
                    value={selectedWithEdits.description ?? ''}
                    onChange={e => handleLocalUpdate(selectedWithEdits.id, 'description', e.target.value)}
                    placeholder="Description, notes, address…"
                    rows={4}
                    className="admin-input w-full text-sm resize-none py-2.5 px-3 leading-relaxed"
                  />
                </div>

                {/* ── Location Options — Row List ────────────────────── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
                    Location Options
                  </label>

                  {selectedOptions.length > 0 && (
                    <DndContext
                      id={dndId}
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedOptions.map(o => o.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1">
                          {selectedOptions.map((opt, i) => (
                            <SortableLocationRow
                              key={opt.id}
                              option={opt}
                              isFeatured={i === 0}
                              onRemove={handleRemoveLocation}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Add location option */}
                  {showPicker ? (
                    <LocationPickerPopover
                      globalLocations={globalLocations}
                      assignedLocationIds={assignedLocationIds}
                      onSelect={handleAssignLocation}
                      onClose={() => setShowPicker(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setShowPicker(true)}
                      className="w-full py-2 rounded-admin-md border-2 border-dashed border-admin-border text-xs text-admin-text-faint hover:border-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MapPin size={14} />
                      Add Location Option
                    </button>
                  )}
                </div>

                {/* Scene usage */}
                {sceneCountByLocation(selectedWithEdits.id) > 0 && (
                  <div className="text-xs text-admin-text-faint">
                    Used in {sceneCountByLocation(selectedWithEdits.id)} scene{sceneCountByLocation(selectedWithEdits.id) !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-admin-text-faint">
                {locations.length === 0
                  ? 'Add a location to get started.'
                  : 'Select a location to edit.'}
              </div>
            )}
          </div>
        </div>

        <PanelFooter onSave={handleClose} />
      </div>
    </PanelDrawer>
  );
}
