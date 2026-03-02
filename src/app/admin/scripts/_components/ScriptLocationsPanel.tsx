'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Check, X, Loader2, MapPin, Link2, Unlink, ExternalLink } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { SaveButton } from '@/app/admin/_components/SaveButton';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { createLocation, updateLocation, deleteLocation } from '@/app/admin/actions';
import type { ScriptLocationRow, ScriptSceneRow } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  locations: ScriptLocationRow[];
  scenes: ScriptSceneRow[];
  onLocationsChange: (locs: ScriptLocationRow[]) => void;
  globalLocations?: { id: string; name: string; featured_image: string | null }[];
}

export function ScriptLocationsPanel({ open, onClose, scriptId, locations, scenes, onLocationsChange, globalLocations = [] }: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Local edits for dirty state tracking
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<ScriptLocationRow>>>({});
  const [showDiscard, setShowDiscard] = useState(false);
  const { saving, saved, wrap } = useSaveState();

  // Auto-select first location, or clear if deleted
  useEffect(() => {
    if (selectedId && !locations.find(l => l.id === selectedId)) {
      setSelectedId(locations[0]?.id ?? null);
    }
    if (!selectedId && locations.length > 0) {
      setSelectedId(locations[0].id);
    }
  }, [locations, selectedId]);

  // Clear local edits when panel closes
  useEffect(() => {
    if (!open) setLocalEdits({});
  }, [open]);

  const sceneCountByLocation = (locationId: string) =>
    scenes.filter(s => s.location_id === locationId).length;

  const selected = locations.find(l => l.id === selectedId) ?? null;
  // Merge local edits with actual data for display
  const selectedWithEdits = selected
    ? { ...selected, ...localEdits[selected.id] }
    : null;
  const linkedGlobal = selectedWithEdits?.global_location_id
    ? globalLocations.find(g => g.id === selectedWithEdits.global_location_id)
    : null;

  const dirty = Object.keys(localEdits).length > 0;

  const handleClose = () => {
    if (dirty) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setLocalEdits({});
    setShowDiscard(false);
    onClose();
  };

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
        global_location_id: null,
        created_at: new Date().toISOString(),
      };
      onLocationsChange([...locations, newLoc]);
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  // Local-only update — marks dirty, no server call
  const handleLocalUpdate = (locId: string, field: string, value: string | null) => {
    setLocalEdits(prev => ({
      ...prev,
      [locId]: { ...prev[locId], [field]: value },
    }));
  };

  // Save all dirty edits to server
  const handleSave = useCallback(() => {
    wrap(async () => {
      const entries = Object.entries(localEdits);
      for (const [locId, edits] of entries) {
        await updateLocation(locId, edits);
        onLocationsChange(
          locations.map(l => l.id === locId ? { ...l, ...edits } : l)
        );
      }
      setLocalEdits({});
      onClose();
    });
  }, [localEdits, locations, onLocationsChange, wrap, onClose]);

  const handleDelete = async (locId: string) => {
    await deleteLocation(locId);
    onLocationsChange(locations.filter(l => l.id !== locId));
    setConfirmDeleteId(null);
    // Clear any local edits for this location
    setLocalEdits(prev => {
      const next = { ...prev };
      delete next[locId];
      return next;
    });
  };

  const handleLinkGlobal = async (globalId: string) => {
    if (!selected) return;
    onLocationsChange(locations.map(l => l.id === selected.id ? { ...l, global_location_id: globalId } : l));
    await updateLocation(selected.id, { global_location_id: globalId });
  };

  const handleUnlinkGlobal = async () => {
    if (!selected) return;
    onLocationsChange(locations.map(l => l.id === selected.id ? { ...l, global_location_id: null } : l));
    await updateLocation(selected.id, { global_location_id: null });
  };

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[580px]">
      <div className="flex flex-col h-full relative">
        {/* Discard changes guard */}
        <DiscardChangesDialog
          open={showDiscard}
          onKeepEditing={() => setShowDiscard(false)}
          onDiscard={handleDiscard}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight">Locations</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
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
                const isLinked = !!loc.global_location_id;
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
                    <MapPin size={12} className={`flex-shrink-0 ${isLinked ? 'text-admin-info' : 'text-admin-text-ghost'}`} />
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
            {selectedWithEdits ? (
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <input
                    value={selectedWithEdits.name}
                    onChange={e => handleLocalUpdate(selectedWithEdits.id, 'name', e.target.value)}
                    className="admin-input w-full text-base font-semibold py-2 px-3 uppercase"
                    placeholder="Location name"
                  />
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

                {/* Global location link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Locations Library</label>
                  {linkedGlobal ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-admin-sm bg-admin-bg-hover border border-admin-border">
                      {linkedGlobal.featured_image ? (
                        <img src={linkedGlobal.featured_image} alt="" className="w-8 h-8 rounded-admin-sm object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-admin-sm bg-admin-bg-active flex items-center justify-center flex-shrink-0">
                          <MapPin size={12} className="text-admin-text-faint" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-admin-text-primary truncate">{linkedGlobal.name}</div>
                        <div className="text-[10px] text-admin-info flex items-center gap-1">
                          <Link2 size={8} /> Linked to library
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href="/admin/locations"
                          target="_blank"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-info hover:bg-admin-bg-hover transition-colors"
                          title="View in Locations"
                        >
                          <ExternalLink size={12} />
                        </a>
                        <button
                          onClick={handleUnlinkGlobal}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-danger hover:bg-admin-bg-hover transition-colors"
                          title="Unlink"
                        >
                          <Unlink size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      className="admin-input w-full text-sm py-2 px-3"
                      value=""
                      onChange={e => { if (e.target.value) handleLinkGlobal(e.target.value); }}
                    >
                      <option value="">Link to a location from library…</option>
                      {globalLocations.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
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

        {/* Footer action bar — full width */}
        <div className="px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex items-center gap-2">
          <SaveButton
            saving={saving}
            saved={saved}
            onClick={handleSave}
            className="px-5 py-2.5 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-secondary px-4 py-2.5 text-sm"
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
