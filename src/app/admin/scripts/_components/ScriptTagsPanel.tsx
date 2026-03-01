'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, X as XIcon, Check } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { createScriptTag, updateScriptTag, deleteScriptTag } from '@/app/admin/actions';
import type { ScriptTagRow } from '@/types/scripts';
import { DEFAULT_SCRIPT_TAGS } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  tags: ScriptTagRow[];
  onTagsChange: (tags: ScriptTagRow[]) => void;
}

// Rainbow order — smooth hue rotation
const PRESET_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // yellow
  '#4ade80', // green
  '#34d399', // teal
  '#38bdf8', // sky
  '#818cf8', // indigo
  '#a78bfa', // violet
  '#c084fc', // purple
  '#e879f9', // fuchsia
];

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

  // Auto-select first tag, or clear if deleted
  useEffect(() => {
    if (selectedId && !tags.find(t => t.id === selectedId)) {
      setSelectedId(tags[0]?.id ?? null);
    }
    if (!selectedId && tags.length > 0) {
      setSelectedId(tags[0].id);
    }
  }, [tags, selectedId]);

  const selected = tags.find(t => t.id === selectedId) ?? null;

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

  const handleUpdate = async (tagId: string, field: string, value: string) => {
    const existing = tags.find(t => t.id === tagId);
    // Auto-update slug when name changes (unless it's a default tag)
    const updates: Record<string, string> = { [field]: value };
    if (field === 'name' && existing && !DEFAULT_SLUGS.has(existing.slug)) {
      updates.slug = slugify(value);
    }
    onTagsChange(tags.map(t => t.id === tagId ? { ...t, ...updates } : t));
    await updateScriptTag(tagId, updates);
  };

  const handleDelete = async (tagId: string) => {
    await deleteScriptTag(tagId);
    onTagsChange(tags.filter(t => t.id !== tagId));
    setConfirmDeleteId(null);
  };

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[580px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight">Tags</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <XIcon size={16} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Tag list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            <div className="flex-1 overflow-y-auto admin-scrollbar-auto py-2">
              {tags.length === 0 && (
                <p className="text-xs text-admin-text-faint text-center py-6 px-3">
                  No tags yet.
                </p>
              )}
              {tags.map(tag => {
                const isSelected = selectedId === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedId(tag.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm font-mono font-medium truncate">#{tag.slug}</span>
                  </button>
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
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowNew(false); }}
                      placeholder="tag-name"
                      className="admin-input flex-1 text-base font-mono py-2 px-3"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Color</label>
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          newColor === color ? 'border-admin-text-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
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
            ) : selected ? (
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <input
                    value={selected.name}
                    onChange={e => handleUpdate(selected.id, 'name', e.target.value)}
                    className="admin-input w-full text-base font-semibold py-2 px-3"
                    placeholder="Tag name"
                  />
                </div>

                {/* Slug (read-only) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Slug</label>
                  <div className="text-sm font-mono text-admin-text-muted px-3 py-2">#{selected.slug}</div>
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Color</label>
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => handleUpdate(selected.id, 'color', color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          selected.color === color ? 'border-admin-text-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
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

        {/* Footer action bar — full width */}
        <div className="px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex items-center gap-2">
          <button
            onClick={() => { setShowNew(true); setSelectedId(null); }}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <Plus size={14} />
            New Tag
          </button>
          <div className="flex-1" />
          {selected && !showNew && (
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
                  <XIcon size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(selected.id)}
                className="btn-ghost-danger w-10 h-10"
                title="Delete tag"
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
