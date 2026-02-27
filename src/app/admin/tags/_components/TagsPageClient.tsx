'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Trash2, Plus, GitMerge, ArrowUpRight, ChevronRight } from 'lucide-react';
import { AdminPageHeader } from '../../_components/AdminPageHeader';
import { createTag, renameTag, deleteTag, mergeTags, getProjectsForTag } from '../../actions';
import type { TagWithCount } from '../../actions';

type TagCategory = 'style' | 'technique' | 'addon' | 'deliverable';
type ProjectRef = { id: string; title: string; published: boolean; client_name: string };

const CATEGORY_CONFIG: Record<TagCategory, { label: string; description: string }> = {
  style: { label: 'Style Tags', description: 'Visual and aesthetic classifications' },
  technique: { label: 'Camera Techniques', description: 'Camera and filming methods used' },
  addon: { label: 'Premium Add-ons', description: 'Premium services included' },
  deliverable: { label: 'Assets Delivered', description: 'File formats and deliverables' },
};

const CATEGORIES: TagCategory[] = ['style', 'technique', 'addon', 'deliverable'];

interface MergeDialogProps {
  tags: TagWithCount[];
  sourceIds: string[];
  category: TagCategory;
  onClose: () => void;
  onMerge: (sourceIds: string[], targetId: string) => void;
  isPending: boolean;
}

function MergeDialog({ tags, sourceIds, category, onClose, onMerge, isPending }: MergeDialogProps) {
  const categoryTags = tags.filter((t) => t.category === category);
  const sourceTags = categoryTags.filter((t) => sourceIds.includes(t.id));
  const [targetId, setTargetId] = useState<string>(sourceIds[0] ?? '');

  const totalProjects = sourceTags.reduce((sum, t) => sum + t.projectCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#0f0f0f] border border-white/[0.12] rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Merge {CATEGORY_CONFIG[category].label}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">Merging</p>
            <div className="flex flex-wrap gap-1.5">
              {sourceTags.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.1] text-sm text-foreground">
                  {t.name}
                  <span className="text-xs text-muted-foreground">{t.projectCount}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">Keep as</p>
            <div className="space-y-1.5">
              {sourceTags.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/[0.04] transition-colors">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${targetId === t.id ? 'border-white bg-white' : 'border-white/30'}`}>
                    {targetId === t.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <input type="radio" className="sr-only" value={t.id} checked={targetId === t.id} onChange={() => setTargetId(t.id)} />
                  <span className="text-sm text-foreground flex-1">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.projectCount} projects</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            Up to <strong className="text-foreground">{totalProjects} projects</strong> will be updated. All uses of the removed tags will be replaced with the kept tag.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#1f1f1f]">
          <button onClick={onClose} disabled={isPending} className="btn-secondary px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button
            disabled={isPending || !targetId}
            onClick={() => onMerge(sourceIds.filter((id) => id !== targetId), targetId)}
            className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed"
          >
            <GitMerge size={13} />
            {isPending ? 'Merging…' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface InlineEditProps {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}

function InlineEdit({ value, onSave, onCancel }: InlineEditProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(draft);
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 min-w-0 bg-white/[0.06] border border-white/20 rounded px-2 py-0.5 text-sm text-foreground outline-none focus:border-white/40"
      />
      <button onClick={() => onSave(draft)} className="text-green-400 hover:text-green-300 transition-colors flex-shrink-0">
        <Check size={13} />
      </button>
      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}

interface DeleteConfirmProps {
  tag: TagWithCount;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ tag, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="text-xs text-muted-foreground flex-1">
        Remove from {tag.projectCount > 0 ? <strong className="text-foreground">{tag.projectCount} project{tag.projectCount !== 1 ? 's' : ''}</strong> : 'all projects'}?
      </span>
      <button onClick={onConfirm} disabled={isPending} className="px-2.5 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50">
        {isPending ? '…' : 'Delete'}
      </button>
      <button onClick={onCancel} disabled={isPending} className="px-2.5 py-1 text-xs rounded bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
        Cancel
      </button>
    </div>
  );
}

interface CategorySectionProps {
  category: TagCategory;
  tags: TagWithCount[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAdd: (name: string) => void;
  onMergeSelected: () => void;
  isPending: boolean;
}

function CategorySection({ category, tags, selectedIds, onToggleSelect, onRename, onDelete, onAdd, onMergeSelected, isPending }: CategorySectionProps) {
  const config = CATEGORY_CONFIG[category];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // Project expand state
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null);
  const [loadingTagId, setLoadingTagId] = useState<string | null>(null);
  const [projectCache, setProjectCache] = useState<Map<string, ProjectRef[]>>(new Map());

  const selectedInCategory = tags.filter((t) => selectedIds.has(t.id));
  const canMerge = selectedInCategory.length >= 2;

  useEffect(() => {
    if (addingNew) addInputRef.current?.focus();
  }, [addingNew]);

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (!trimmed) { setAddingNew(false); return; }
    onAdd(trimmed);
    setNewValue('');
    setAddingNew(false);
  };

  const handleToggleExpand = async (tag: TagWithCount) => {
    if (tag.projectCount === 0) return;
    if (expandedTagId === tag.id) {
      setExpandedTagId(null);
      return;
    }
    setExpandedTagId(tag.id);
    if (!projectCache.has(tag.id)) {
      setLoadingTagId(tag.id);
      try {
        const projects = await getProjectsForTag(tag.name, tag.category);
        setProjectCache((prev) => new Map(prev).set(tag.id, projects));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTagId(null);
      }
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.03] rounded-t-xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground tracking-tight">{config.label}</h3>
            <span className="text-xs text-muted-foreground/50 bg-white/[0.04] px-1.5 py-0.5 rounded">{tags.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {canMerge && (
            <button
              onClick={onMergeSelected}
              disabled={isPending}
              className="btn-secondary px-2.5 py-1.5 text-xs font-medium"
            >
              <GitMerge size={11} />
              Merge {selectedInCategory.length}
            </button>
          )}
          <button
            onClick={() => setAddingNew(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-white text-black font-medium hover:bg-black hover:text-white border border-white transition-colors disabled:opacity-40"
          >
            <Plus size={11} />
            Add
          </button>
        </div>
      </div>

      {/* Tag list */}
      <div className="flex-1 divide-y divide-white/[0.04]">
        {tags.length === 0 && !addingNew && (
          <div className="px-5 py-8 text-center text-xs text-muted-foreground/40">No tags yet</div>
        )}
        {tags.map((tag) => {
          const isEditing = editingId === tag.id;
          const isDeleting = pendingDeleteId === tag.id;
          const isSelected = selectedIds.has(tag.id);
          const isExpanded = expandedTagId === tag.id;
          const isLoadingProjects = loadingTagId === tag.id;
          const cachedProjects = projectCache.get(tag.id);

          return (
            <React.Fragment key={tag.id}>
              <div
                onClick={() => tag.projectCount > 0 && !isEditing && !isDeleting && handleToggleExpand(tag)}
                className={`flex items-center gap-3 px-5 py-2.5 group transition-colors ${tag.projectCount > 0 && !isEditing && !isDeleting ? 'cursor-pointer' : ''} ${isSelected ? 'bg-white/[0.03]' : isExpanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'}`}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSelect(tag.id); }}
                  disabled={isPending}
                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'}`}
                >
                  {isSelected && <Check size={10} className="text-black" strokeWidth={2.5} />}
                </button>

                {/* Name or edit state */}
                {isEditing ? (
                  <InlineEdit
                    value={tag.name}
                    onSave={(v) => { onRename(tag.id, v); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : isDeleting ? (
                  <DeleteConfirm
                    tag={tag}
                    onConfirm={() => { onDelete(tag.id); setPendingDeleteId(null); }}
                    onCancel={() => setPendingDeleteId(null)}
                    isPending={isPending}
                  />
                ) : (
                  <>
                    <span className="flex-1 min-w-0 text-sm text-foreground truncate">{tag.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(tag.id); setPendingDeleteId(null); }}
                        disabled={isPending}
                        className="p-1 rounded text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] transition-colors"
                        title="Rename"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(tag.id); setEditingId(null); }}
                        disabled={isPending}
                        className="p-1 rounded text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    {/* Project count — clickable if > 0 */}
                    {tag.projectCount > 0 ? (
                      <span className="flex items-center gap-1 text-xs tabular-nums flex-shrink-0 text-muted-foreground/50">
                        {tag.projectCount}
                        <ChevronRight size={10} className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                      </span>
                    ) : (
                      <span className="text-xs tabular-nums flex-shrink-0 text-muted-foreground/20">0</span>
                    )}
                  </>
                )}
              </div>

              {/* Expanded project list */}
              {isExpanded && (
                <div className="py-2">
                  {isLoadingProjects ? (
                    <div className="px-5 py-3 text-xs text-muted-foreground/40">Loading…</div>
                  ) : cachedProjects && cachedProjects.length > 0 ? (
                    <div>
                      {cachedProjects.map((project) => (
                        <Link
                          key={project.id}
                          href={`/admin/projects/${project.id}`}
                          className="flex items-center gap-3 px-5 py-1.5 hover:bg-white/[0.03] transition-colors group/proj"
                        >
                          <span className={`w-4 flex items-center justify-center flex-shrink-0`}><span className={`w-1.5 h-1.5 rounded-full ${project.published ? 'bg-green-500' : 'bg-white/20'}`} /></span>
                          <span className="text-xs text-foreground/80 flex-shrink-0 truncate max-w-[200px]">{project.title}</span>
                          <span className="text-xs text-muted-foreground/60 flex-1 min-w-0 truncate">{project.client_name}</span>
                          <span className="flex-shrink-0 w-8 flex justify-center"><ArrowUpRight size={11} className="text-muted-foreground/30 group-hover/proj:text-muted-foreground transition-colors" /></span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-xs text-muted-foreground/40">No projects found</div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Add new row */}
        {addingNew && (
          <div className="flex items-center gap-3 px-5 py-2.5">
            <div className="w-4 flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                ref={addInputRef}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setAddingNew(false); setNewValue(''); }
                }}
                placeholder="New tag name…"
                className="flex-1 min-w-0 bg-white/[0.06] border border-white/20 rounded px-2 py-0.5 text-sm text-foreground outline-none focus:border-white/40 placeholder:text-muted-foreground/40"
              />
              <button onClick={handleAdd} className="text-green-400 hover:text-green-300 transition-colors flex-shrink-0">
                <Check size={13} />
              </button>
              <button onClick={() => { setAddingNew(false); setNewValue(''); }} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TagsPageClient({ initialTags }: { initialTags: TagWithCount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<TagWithCount[]>(initialTags);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeState, setMergeState] = useState<{ sourceIds: string[]; category: TagCategory } | null>(null);

  // Sync state when server delivers fresh data after router.refresh()
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const refresh = () => router.refresh();

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRename = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name: newName.trim() } : t)));
    startTransition(async () => {
      try {
        await renameTag(id, newName);
        refresh();
      } catch (e) {
        console.error(e);
        setTags(initialTags);
      }
    });
  };

  const handleDelete = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    startTransition(async () => {
      try {
        await deleteTag(id);
        refresh();
      } catch (e) {
        console.error(e);
        setTags(initialTags);
      }
    });
  };

  const handleAdd = (category: TagCategory, name: string) => {
    startTransition(async () => {
      try {
        await createTag(name, category);
        refresh();
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleMerge = (sourceIds: string[], targetId: string) => {
    setTags((prev) => {
      const target = prev.find((t) => t.id === targetId);
      const sources = prev.filter((t) => sourceIds.includes(t.id));
      const totalProjectCount = sources.reduce((s, t) => s + t.projectCount, 0) + (target?.projectCount ?? 0);
      return prev
        .filter((t) => !sourceIds.includes(t.id))
        .map((t) => (t.id === targetId ? { ...t, projectCount: totalProjectCount } : t));
    });
    setSelectedIds(new Set());
    setMergeState(null);
    startTransition(async () => {
      try {
        await mergeTags(sourceIds, targetId);
        refresh();
      } catch (e) {
        console.error(e);
        setTags(initialTags);
      }
    });
  };

  const totalTags = tags.length;

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Tags"
        subtitle={`${totalTags} total across 4 categories`}
      />

      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
          {CATEGORIES.map((category) => {
            const categoryTags = tags.filter((t) => t.category === category);
            return (
              <CategorySection
                key={category}
                category={category}
                tags={categoryTags}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onRename={handleRename}
                onDelete={handleDelete}
                onAdd={(name) => handleAdd(category, name)}
                onMergeSelected={() => {
                  const sourceIds = categoryTags.filter((t) => selectedIds.has(t.id)).map((t) => t.id);
                  setMergeState({ sourceIds, category });
                }}
                isPending={isPending}
              />
            );
          })}
        </div>
      </div>

      {mergeState && (
        <MergeDialog
          tags={tags}
          sourceIds={mergeState.sourceIds}
          category={mergeState.category}
          onClose={() => setMergeState(null)}
          onMerge={handleMerge}
          isPending={isPending}
        />
      )}
    </div>
  );
}
