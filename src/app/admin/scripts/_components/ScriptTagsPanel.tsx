'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Loader2, X as XIcon, Check, Save } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { createScriptTag, updateScriptTag, deleteScriptTag } from '@/app/admin/actions';
import { ColorPicker, PRESET_COLORS } from './ColorPicker';
import type { ScriptTagRow } from '@/types/scripts';
import { DEFAULT_SCRIPT_TAGS } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  tags: ScriptTagRow[];
  onTagsChange: (tags: ScriptTagRow[]) => void;
}

const DEFAULT_SLUGS = new Set(DEFAULT_SCRIPT_TAGS.map(t => t.slug));

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function ScriptTagsPanel({ open, onClose, scriptId, tags, onTagsChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  // Local edits for dirty state tracking
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<ScriptTagRow>>>({});
  const localEditsRef = useRef(localEdits);
  useEffect(() => { localEditsRef.current = localEdits; });

  // Auto-select first tag, or clear if deleted
  useEffect(() => {
    if (selectedId && !tags.find(t => t.id === selectedId)) {
      setSelectedId(tags[0]?.id ?? null);
    }
    if (!selectedId && tags.length > 0) {
      setSelectedId(tags[0].id);
    }
  }, [tags, selectedId]);

  // Clear local edits when panel closes
  useEffect(() => {
    if (!open) setLocalEdits({});
  }, [open]);

  const selected = tags.find(t => t.id === selectedId) ?? null;
  const selectedWithEdits = selected
    ? { ...selected, ...localEdits[selected.id] }
    : null;

  // ── Auto-save ───────────────────────────────────────────────────
  const autoSave = useAutoSave(async () => {
    const entries = Object.entries(localEditsRef.current);
    if (entries.length === 0) return;
    for (const [tagId, edits] of entries) {
      await updateScriptTag(tagId, edits);
    }
    const updated = tags.map(t => localEditsRef.current[t.id] ? { ...t, ...localEditsRef.current[t.id] } : t);
    onTagsChange(updated);
    setLocalEdits({});
  });

  const handleClose = useCallback(() => {
    autoSave.flush();
    onClose();
  }, [autoSave, onClose]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const slug = slugify(newName);
      const color = newColor;
      const id = await createScriptTag(scriptId, {
        name: newName.trim(),
        slug,
        category: 'general',
        color,
      });
      const newTag: ScriptTagRow = {
        id,
        script_id: scriptId,
        name: newName.trim(),
        slug,
        category: 'general',
        color,
        created_at: new Date().toISOString(),
      };
      onTagsChange([...tags, newTag]);
      setSelectedId(id);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setShowNew(false);
    } finally {
      setAdding(false);
    }
  };

  // Local-only update — marks dirty, no server call
  const handleLocalUpdate = (tagId: string, field: string, value: string) => {
    const existing = tags.find(t => t.id === tagId);
    if (field === 'name') value = value.toLowerCase();
    const updates: Partial<ScriptTagRow> = { [field]: value };
    // Auto-update slug when name changes (unless it's a default tag)
    if (field === 'name' && existing && !DEFAULT_SLUGS.has(existing.slug)) {
      updates.slug = slugify(value);
    }
    setLocalEdits(prev => ({
      ...prev,
      [tagId]: { ...prev[tagId], ...updates },
    }));
    autoSave.trigger();
  };

  const handleDelete = async (tagId: string) => {
    await deleteScriptTag(tagId);
    onTagsChange(tags.filter(t => t.id !== tagId));
    setConfirmDeleteId(null);
    setLocalEdits(prev => {
      const next = { ...prev };
      delete next[tagId];
      return next;
    });
  };

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[750px]">
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-[4rem] border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-semibold text-admin-text-primary inline-flex items-center gap-1">Tags <SaveDot status={autoSave.status} /></h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <XIcon size={16} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Tag list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            {/* Add button at top */}
            <div className="flex-shrink-0 border-b border-admin-border px-3 py-3 flex items-center">
              <button
                onClick={() => { setShowNew(true); setSelectedId(null); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors"
              >
                <Plus size={12} />
                New Tag
              </button>
            </div>
            <div className="flex-1 overflow-y-auto admin-scrollbar-auto py-2">
              {tags.length === 0 && (
                <p className="text-xs text-admin-text-faint text-center py-6 px-3">
                  No tags yet.
                </p>
              )}
              {tags.map(tag => {
                const isSelected = selectedId === tag.id;
                const edits = localEdits[tag.id];
                const displayName = edits?.name ?? tag.name;
                const displayColor = edits?.color ?? tag.color;
                return (
                  <div
                    key={tag.id}
                    className={`group/row w-full flex items-center px-4 py-2.5 gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedId(tag.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    >
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-sm font-bold font-mono flex-shrink-0"
                        style={{ color: displayColor, backgroundColor: `${displayColor}20` }}
                      >
                        #
                      </span>
                      <span className="text-sm font-medium truncate">{displayName}</span>
                    </button>
                    {/* Two-step delete */}
                    {confirmDeleteId === tag.id ? (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(tag.id)}
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
                          <XIcon size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(tag.id)}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-admin-text-ghost hover:text-admin-danger transition-all flex-shrink-0"
                        title="Delete tag"
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
            {showNew ? (
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Tag Name</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold text-admin-text-faint">#</span>
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value.toLowerCase())}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowNew(false); }}
                      placeholder="tag-name"
                      className="admin-input flex-1 text-base font-mono py-2 px-3"
                    />
                  </div>
                </div>
                <ColorPicker value={newColor} onChange={setNewColor} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={adding || !newName.trim()}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {adding && <Loader2 size={12} className="animate-spin" />}
                    Create Tag
                  </button>
                  <button onClick={() => setShowNew(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                </div>
              </div>
            ) : selectedWithEdits ? (
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <input
                    value={selectedWithEdits.name}
                    onChange={e => handleLocalUpdate(selectedWithEdits.id, 'name', e.target.value)}
                    className="admin-input w-full text-base font-semibold py-2 px-3"
                    placeholder="Tag name"
                  />
                </div>

                {/* Color */}
                <ColorPicker value={selectedWithEdits.color} onChange={c => handleLocalUpdate(selectedWithEdits.id, 'color', c)} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-admin-text-faint">
                {tags.length === 0
                  ? 'Create a tag to get started.'
                  : 'Select a tag to edit.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer action bar */}
        <div className="flex items-center px-6 py-4 border-t border-admin-border bg-admin-bg-wash">
          <button onClick={handleClose} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
    </PanelDrawer>
  );
}
