'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, Loader2, MapPin } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { createLocation, updateLocation, deleteLocation } from '@/app/admin/actions';
import type { ScriptLocationRow, ScriptSceneRow } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  locations: ScriptLocationRow[];
  scenes: ScriptSceneRow[];
  onLocationsChange: (locs: ScriptLocationRow[]) => void;
}

export function ScriptLocationsPanel({ open, onClose, scriptId, locations, scenes, onLocationsChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Auto-select first location, or clear if deleted
  useEffect(() => {
    if (selectedId && !locations.find(l => l.id === selectedId)) {
      setSelectedId(locations[0]?.id ?? null);
    }
    if (!selectedId && locations.length > 0) {
      setSelectedId(locations[0].id);
    }
  }, [locations, selectedId]);

  const sceneCountByLocation = (locationId: string) =>
    scenes.filter(s => s.location_id === locationId).length;

  const selected = locations.find(l => l.id === selectedId) ?? null;

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
        sort_order: locations.length,
        created_at: new Date().toISOString(),
      };
      onLocationsChange([...locations, newLoc]);
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (locId: string, field: string, value: string) => {
    onLocationsChange(locations.map(l => l.id === locId ? { ...l, [field]: value } : l));
    await updateLocation(locId, { [field]: value });
  };

  const handleDelete = async (locId: string) => {
    await deleteLocation(locId);
    onLocationsChange(locations.filter(l => l.id !== locId));
    setConfirmDeleteId(null);
  };

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[580px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight">Locations</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Location list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            <div className="flex-1 overflow-y-auto admin-scrollbar-auto py-2">
              {locations.length === 0 && (
                <p className="text-xs text-admin-text-faint text-center py-6 px-3">
                  No locations yet.
                </p>
              )}
              {locations.map(loc => {
                const count = sceneCountByLocation(loc.id);
                const isSelected = selectedId === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedId(loc.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    <MapPin size={12} className="flex-shrink-0 text-admin-text-ghost" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate uppercase">{loc.name}</div>
                      {count > 0 && (
                        <div className="text-[10px] text-admin-text-faint">{count} scene{count !== 1 ? 's' : ''}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detail pane */}
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar-auto">
            {selected ? (
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <input
                    value={selected.name}
                    onChange={e => handleUpdate(selected.id, 'name', e.target.value)}
                    className="admin-input w-full text-base font-semibold py-2 px-3 uppercase"
                    placeholder="Location name"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                  <textarea
                    value={selected.description ?? ''}
                    onChange={e => handleUpdate(selected.id, 'description', e.target.value)}
                    placeholder="Description, notes, address…"
                    rows={4}
                    className="admin-input w-full text-sm resize-none py-2.5 px-3 leading-relaxed"
                  />
                </div>

                {/* Scene usage */}
                {sceneCountByLocation(selected.id) > 0 && (
                  <div className="text-xs text-admin-text-faint">
                    Used in {sceneCountByLocation(selected.id)} scene{sceneCountByLocation(selected.id) !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Future: photos, map link, etc. */}
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

        {/* Footer action bar — full width */}
        <div className="px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex items-center gap-2">
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Location
          </button>
          <div className="flex-1" />
          {selected && (
            confirmDeleteId === selected.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-admin-danger hover:bg-admin-danger-bg transition-colors"
                  title="Confirm delete"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(selected.id)}
                className="btn-ghost-danger w-10 h-10"
                title="Delete location"
              >
                <Trash2 size={16} />
              </button>
            )
          )}
        </div>
      </div>
    </PanelDrawer>
  );
}
