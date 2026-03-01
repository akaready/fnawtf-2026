'use client';

import React, { useState, useMemo, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Trash2, Plus, GitMerge, ArrowUpRight, ChevronRight, LayoutGrid, Table2, Snowflake, Eye, ListFilter, Layers, ArrowUpAZ, Palette, Rows } from 'lucide-react';
import { AdminPageHeader } from '../../_components/AdminPageHeader';
import { ViewSwitcher, type ViewDef } from '../../_components/ViewSwitcher';
import { useViewMode } from '../../_hooks/useViewMode';
import { AdminDataTable, type ColDef } from '../../_components/table';
import { ToolbarButton } from '../../_components/table/TableToolbar';
import { createTag, renameTag, deleteTag, mergeTags, getProjectsForTag, batchDeleteTags } from '../../actions';
import type { TagWithCount } from '../../actions';

type TagCategory = 'style' | 'technique' | 'addon' | 'deliverable' | 'project_type';
type ProjectRef = { id: string; title: string; published: boolean; client_name: string };

const CATEGORY_CONFIG: Record<TagCategory, { label: string; description: string }> = {
  style: { label: 'Style Tags', description: 'Visual and aesthetic classifications' },
  technique: { label: 'Camera Techniques', description: 'Camera and filming methods used' },
  addon: { label: 'Premium Add-ons', description: 'Premium services included' },
  deliverable: { label: 'Assets Delivered', description: 'File formats and deliverables' },
  project_type: { label: 'Project Types', description: 'Type or format of the project' },
};

const CATEGORIES: TagCategory[] = ['project_type', 'deliverable', 'style', 'addon', 'technique'];

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
      <div className="relative z-10 bg-[#0f0f0f] border border-admin-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border-subtle">
          <div>
            <h2 className="text-lg font-semibold text-admin-text-primary">Merge {CATEGORY_CONFIG[category].label}</h2>
          </div>
          <button onClick={onClose} className="text-admin-text-muted hover:text-admin-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Merging</p>
            <div className="flex flex-wrap gap-1.5">
              {sourceTags.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-admin-bg-hover border border-admin-border text-sm text-admin-text-primary">
                  {t.name}
                  <span className="text-xs text-admin-text-muted">{t.projectCount}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Keep as</p>
            <div className="space-y-1.5">
              {sourceTags.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-admin-bg-selected transition-colors">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${targetId === t.id ? 'border-admin-text-primary bg-admin-text-primary' : 'border-admin-border'}`}>
                    {targetId === t.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <input type="radio" className="sr-only" value={t.id} checked={targetId === t.id} onChange={() => setTargetId(t.id)} />
                  <span className="text-sm text-admin-text-primary flex-1">{t.name}</span>
                  <span className="text-xs text-admin-text-muted">{t.projectCount} projects</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-admin-text-muted px-3 py-2 rounded-lg bg-admin-bg-subtle border border-admin-border">
            Up to <strong className="text-admin-text-primary">{totalProjects} projects</strong> will be updated. All uses of the removed tags will be replaced with the kept tag.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-admin-border-subtle">
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
        className="flex-1 min-w-0 bg-admin-bg-hover border border-admin-border-emphasis rounded px-2 py-0.5 text-sm text-admin-text-primary outline-none focus:border-admin-border-emphasis"
      />
      <button onClick={() => onSave(draft)} className="text-admin-success hover:text-admin-success transition-colors flex-shrink-0">
        <Check size={13} />
      </button>
      <button onClick={onCancel} className="text-admin-text-muted hover:text-admin-text-primary transition-colors flex-shrink-0">
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
      <span className="text-xs text-admin-text-muted flex-1">
        Remove from {tag.projectCount > 0 ? <strong className="text-admin-text-primary">{tag.projectCount} project{tag.projectCount !== 1 ? 's' : ''}</strong> : 'all projects'}?
      </span>
      <button onClick={onConfirm} disabled={isPending} className="px-2.5 py-1 text-xs rounded bg-admin-danger-bg-strong text-admin-danger border border-admin-danger-border hover:bg-red-500/30 transition-colors disabled:opacity-50">
        {isPending ? '…' : 'Delete'}
      </button>
      <button onClick={onCancel} disabled={isPending} className="px-2.5 py-1 text-xs rounded bg-admin-bg-hover text-admin-text-muted hover:text-admin-text-primary transition-colors">
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
    <div className="bg-admin-bg-sidebar border border-admin-border-subtle rounded-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border bg-admin-bg-subtle rounded-t-xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-admin-text-primary tracking-tight">{config.label}</h3>
            <span className="text-xs text-admin-text-faint bg-admin-bg-selected px-1.5 py-0.5 rounded">{tags.length}</span>
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
            className="btn-ghost-add px-2.5 py-1.5 text-xs"
          >
            <Plus size={11} />
            Add
          </button>
        </div>
      </div>

      {/* Tag list */}
      <div className="flex-1 divide-y divide-admin-border">
        {tags.length === 0 && !addingNew && (
          <div className="px-5 py-8 text-center text-xs text-admin-text-ghost">No tags yet</div>
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
                className={`flex items-center gap-3 px-5 py-2.5 group transition-colors ${tag.projectCount > 0 && !isEditing && !isDeleting ? 'cursor-pointer' : ''} ${isSelected ? 'bg-admin-bg-subtle' : isExpanded ? 'bg-admin-bg-subtle' : 'hover:bg-admin-bg-subtle'}`}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSelect(tag.id); }}
                  disabled={isPending}
                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-white' : 'border-admin-border-subtle group-hover:border-admin-border-emphasis'}`}
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
                    <span className="flex-1 min-w-0 text-sm text-admin-text-primary truncate">{tag.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(tag.id); setPendingDeleteId(null); }}
                        disabled={isPending}
                        className="p-1 rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                        title="Rename"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(tag.id); setEditingId(null); }}
                        disabled={isPending}
                        className="p-1 rounded text-admin-text-faint hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    {/* Project count — clickable if > 0 */}
                    {tag.projectCount > 0 ? (
                      <span className="flex items-center gap-1 text-xs tabular-nums flex-shrink-0 text-admin-text-faint">
                        {tag.projectCount}
                        <ChevronRight size={10} className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                      </span>
                    ) : (
                      <span className="text-xs tabular-nums flex-shrink-0 text-[#202022]">0</span>
                    )}
                  </>
                )}
              </div>

              {/* Expanded project list */}
              {isExpanded && (
                <div className="py-2">
                  {isLoadingProjects ? (
                    <div className="px-5 py-3 text-xs text-admin-text-ghost">Loading…</div>
                  ) : cachedProjects && cachedProjects.length > 0 ? (
                    <div>
                      {cachedProjects.map((project) => (
                        <Link
                          key={project.id}
                          href={`/admin/projects/${project.id}`}
                          className="flex items-center gap-3 px-5 py-1.5 hover:bg-admin-bg-subtle transition-colors group/proj"
                        >
                          <span className={`w-4 flex items-center justify-center flex-shrink-0`}><span className={`w-1.5 h-1.5 rounded-full ${project.published ? 'bg-green-500' : 'bg-white/20'}`} /></span>
                          <span className="text-xs text-admin-text-primary/80 flex-shrink-0 truncate max-w-[200px]">{project.title}</span>
                          <span className="text-xs text-admin-text-faint flex-1 min-w-0 truncate">{project.client_name}</span>
                          <span className="flex-shrink-0 w-8 flex justify-center"><ArrowUpRight size={11} className="text-admin-text-placeholder group-hover/proj:text-admin-text-muted transition-colors" /></span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-xs text-admin-text-ghost">No projects found</div>
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
                className="flex-1 min-w-0 bg-admin-bg-hover border border-admin-border-emphasis rounded px-2 py-0.5 text-sm text-admin-text-primary outline-none focus:border-admin-border-emphasis placeholder:text-admin-text-ghost"
              />
              <button onClick={handleAdd} className="text-admin-success hover:text-admin-success transition-colors flex-shrink-0">
                <Check size={13} />
              </button>
              <button onClick={() => { setAddingNew(false); setNewValue(''); }} className="text-admin-text-muted hover:text-admin-text-primary transition-colors flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type TagsView = 'table' | 'masonry';

const TAGS_VIEWS: ViewDef<TagsView>[] = [
  { key: 'table', icon: Table2, label: 'Table view' },
  { key: 'masonry', icon: LayoutGrid, label: 'Category view' },
];

const TAG_COLUMNS: ColDef<TagWithCount>[] = [
  {
    key: 'name', label: 'Tag', sortable: true, searchable: true,
    render: (row) => <span className="font-medium text-admin-text-primary">{row.name}</span>,
  },
  {
    key: 'category', label: 'Category', sortable: true, groupable: true,
    type: 'select',
    options: CATEGORIES.map((c) => ({ value: c, label: CATEGORY_CONFIG[c].label })),
    render: (row) => <span className="text-sm text-admin-text-faint">{CATEGORY_CONFIG[row.category]?.label ?? row.category}</span>,
  },
  {
    key: 'projectCount', label: 'Projects', type: 'number', sortable: true, align: 'right',
    render: (row) => row.projectCount > 0
      ? <span className="text-xs text-admin-text-faint tabular-nums">{row.projectCount}</span>
      : <span className="text-xs text-[#202022]">0</span>,
  },
];

export function TagsPageClient({ initialTags }: { initialTags: TagWithCount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<TagWithCount[]>(initialTags);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeState, setMergeState] = useState<{ sourceIds: string[]; category: TagCategory } | null>(null);
  const [viewMode, setViewMode] = useViewMode<TagsView>('fna-tags-viewMode', 'table');

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

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Tags"
        subtitle={`${totalTags} total across ${CATEGORIES.length} categories`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tags…"
      />

      {viewMode === 'table' ? (
        <AdminDataTable
          columns={TAG_COLUMNS}
          data={filteredTags}
          storageKey="fna-table-tags"
          toolbar
          toolbarSlot={<ViewSwitcher views={TAGS_VIEWS} activeView={viewMode} onChange={setViewMode} />}
          sortable
          filterable
          groupable
          columnVisibility
          columnReorder
          columnResize
          selectable
          freezePanes
          exportCsv
          onBatchDelete={async (ids) => {
            await batchDeleteTags(ids);
            setTags((prev) => prev.filter((t) => !ids.includes(t.id)));
          }}
          emptyMessage={search ? 'No matching tags.' : 'No tags yet.'}
          rowActions={[
            {
              label: 'Rename',
              icon: <Pencil size={13} />,
              onClick: (row) => {
                setViewMode('masonry');
                setTimeout(() => setSelectedIds(new Set([row.id])), 100);
              },
            },
            {
              label: 'Delete',
              icon: <Trash2 size={13} />,
              variant: 'danger' as const,
              onClick: (row) => handleDelete(row.id),
            },
          ]}
        />
      ) : (
        <>
        {/* Disabled toolbar — matches table toolbar height */}
        <div className="@container relative z-20 flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-admin-border flex-shrink-0 bg-admin-bg-inset">
          <ViewSwitcher views={TAGS_VIEWS} activeView={viewMode} onChange={setViewMode} />
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            <ToolbarButton icon={Snowflake} label="" color="purple" disabled onClick={() => {}} />
            <ToolbarButton icon={Eye} label="" color="blue" disabled onClick={() => {}} />
            <ToolbarButton icon={ListFilter} label="" color="green" disabled onClick={() => {}} />
            <ToolbarButton icon={Layers} label="" color="red" disabled onClick={() => {}} />
            <ToolbarButton icon={ArrowUpAZ} label="" color="orange" disabled onClick={() => {}} />
            <ToolbarButton icon={Palette} label="" color="yellow" disabled onClick={() => {}} />
            <ToolbarButton icon={Rows} label="" color="neutral" disabled onClick={() => {}} />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 py-6">
          <div className="flex flex-col gap-4">
            {/* Top row — Project Types + Deliverables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {CATEGORIES.slice(0, 2).map((category) => {
                const categoryTags = filteredTags.filter((t) => t.category === category);
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
            {/* Bottom row — Style, Technique, Add-ons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {CATEGORIES.slice(2).map((category) => {
                const categoryTags = filteredTags.filter((t) => t.category === category);
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
        </div>
        </>
      )}

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
