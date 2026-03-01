'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Trash2, Plus, GitMerge, ChevronRight, Users, Clapperboard, List, Table2, Snowflake, Eye, ListFilter, Layers, ArrowUpAZ, Palette, Rows } from 'lucide-react';
import { AdminPageHeader } from '../../_components/AdminPageHeader';
import { ViewSwitcher, type ViewDef } from '../../_components/ViewSwitcher';
import { useViewMode } from '../../_hooks/useViewMode';
import { AdminDataTable, type ColDef } from '../../_components/table';
import { ToolbarButton } from '../../_components/table/TableToolbar';
import { createRole, renameRole, deleteRole, mergeRoles, getPeopleForRole, batchDeleteRoles } from '../../actions';
import type { RoleWithCounts } from '../../actions';

type PersonRef = { id: string; first_name: string; last_name: string; type: string };

/* ── Merge Dialog ───────────────────────────────────────────────────────── */

function MergeDialog({
  roles,
  sourceIds,
  onClose,
  onMerge,
  isPending,
}: {
  roles: RoleWithCounts[];
  sourceIds: string[];
  onClose: () => void;
  onMerge: (sourceIds: string[], targetId: string) => void;
  isPending: boolean;
}) {
  const sourceTags = roles.filter((r) => sourceIds.includes(r.id));
  const [targetId, setTargetId] = useState<string>(sourceIds[0] ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#0f0f0f] border border-admin-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border-subtle">
          <h2 className="text-lg font-semibold text-admin-text-primary">Merge Roles</h2>
          <button onClick={onClose} className="text-admin-text-muted hover:text-admin-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Merging</p>
            <div className="flex flex-wrap gap-1.5">
              {sourceTags.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-admin-bg-hover border border-admin-border text-sm text-admin-text-primary">
                  {r.name}
                  <span className="text-xs text-admin-text-muted">{r.projectCount}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Keep as</p>
            <div className="space-y-1.5">
              {sourceTags.map((r) => (
                <label key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-admin-bg-hover transition-colors">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${targetId === r.id ? 'border-admin-text-primary bg-admin-text-primary' : 'border-admin-border'}`}>
                    {targetId === r.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <input type="radio" className="sr-only" value={r.id} checked={targetId === r.id} onChange={() => setTargetId(r.id)} />
                  <span className="text-sm text-admin-text-primary flex-1">{r.name}</span>
                  <span className="text-xs text-admin-text-muted">{r.projectCount} projects</span>
                </label>
              ))}
            </div>
          </div>
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
            {isPending ? 'Merging...' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Inline Edit ────────────────────────────────────────────────────────── */

function InlineEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
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

/* ── View Types & Table Columns ─────────────────────────────────────────── */

type RolesView = 'table' | 'list';

const ROLES_VIEWS: ViewDef<RolesView>[] = [
  { key: 'table', icon: Table2, label: 'Table view' },
  { key: 'list', icon: List, label: 'List view' },
];

const ROLE_COLUMNS: ColDef<RoleWithCounts>[] = [
  {
    key: 'name', label: 'Role', sortable: true, searchable: true,
    render: (row) => <span className="font-medium text-admin-text-primary">{row.name}</span>,
  },
  {
    key: 'peopleCount', label: 'People', type: 'number', sortable: true, align: 'right',
    render: (row) => row.peopleCount > 0
      ? <span className="flex items-center gap-1 text-xs text-admin-text-faint tabular-nums"><Users size={10} />{row.peopleCount}</span>
      : <span className="text-xs text-[#202022]">0</span>,
  },
  {
    key: 'projectCount', label: 'Projects', type: 'number', sortable: true, align: 'right',
    render: (row) => row.projectCount > 0
      ? <span className="flex items-center gap-1 text-xs text-admin-text-faint tabular-nums"><Clapperboard size={10} />{row.projectCount}</span>
      : <span className="text-xs text-[#202022]">0</span>,
  },
];

/* ── Main Component ─────────────────────────────────────────────────────── */

export function RolesPageClient({ initialRoles }: { initialRoles: RoleWithCounts[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roles, setRoles] = useState<RoleWithCounts[]>(initialRoles);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeState, setMergeState] = useState<{ sourceIds: string[] } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useViewMode<RolesView>('fna-roles-viewMode', 'table');

  // Expand state for people list
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [peopleCache, setPeopleCache] = useState<Map<string, PersonRef[]>>(new Map());

  useEffect(() => { setRoles(initialRoles); }, [initialRoles]);
  useEffect(() => { if (addingNew) addInputRef.current?.focus(); }, [addingNew]);

  const refresh = () => router.refresh();

  const filtered = search.trim()
    ? roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : roles;

  const canMerge = selectedIds.size >= 2;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRename = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, name: newName.trim() } : r)));
    startTransition(async () => {
      try { await renameRole(id, newName); refresh(); } catch (e) { console.error(e); setRoles(initialRoles); }
    });
  };

  const handleDelete = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    startTransition(async () => {
      try { await deleteRole(id); refresh(); } catch (e) { console.error(e); setRoles(initialRoles); }
    });
  };

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (!trimmed) { setAddingNew(false); return; }
    setNewValue('');
    setAddingNew(false);
    startTransition(async () => {
      try { await createRole(trimmed); refresh(); } catch (e) { console.error(e); }
    });
  };

  const handleMerge = (sourceIds: string[], targetId: string) => {
    setRoles((prev) => {
      const target = prev.find((r) => r.id === targetId);
      const sources = prev.filter((r) => sourceIds.includes(r.id));
      const totalProjectCount = sources.reduce((s, r) => s + r.projectCount, 0) + (target?.projectCount ?? 0);
      const totalPeopleCount = sources.reduce((s, r) => s + r.peopleCount, 0) + (target?.peopleCount ?? 0);
      return prev
        .filter((r) => !sourceIds.includes(r.id))
        .map((r) => (r.id === targetId ? { ...r, projectCount: totalProjectCount, peopleCount: totalPeopleCount } : r));
    });
    setSelectedIds(new Set());
    setMergeState(null);
    startTransition(async () => {
      try { await mergeRoles(sourceIds, targetId); refresh(); } catch (e) { console.error(e); setRoles(initialRoles); }
    });
  };

  const handleToggleExpand = async (role: RoleWithCounts) => {
    if (role.peopleCount === 0) return;
    if (expandedId === role.id) { setExpandedId(null); return; }
    setExpandedId(role.id);
    if (!peopleCache.has(role.id)) {
      setLoadingId(role.id);
      try {
        const people = await getPeopleForRole(role.id);
        setPeopleCache((prev) => new Map(prev).set(role.id, people));
      } catch (e) { console.error(e); }
      finally { setLoadingId(null); }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Roles"
        subtitle={`${roles.length} production roles`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search roles..."
        actions={
          <>
            {canMerge && (
              <button
                onClick={() => setMergeState({ sourceIds: [...selectedIds] })}
                disabled={isPending}
                className="btn-secondary px-4 py-2.5 text-sm"
              >
                <GitMerge size={13} />
                Merge {selectedIds.size}
              </button>
            )}
            <button
              onClick={() => { if (viewMode === 'table') setViewMode('list'); setAddingNew(true); }}
              disabled={isPending}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              <Plus size={16} />
              Add Role
            </button>
          </>
        }
      />

      {viewMode === 'table' ? (
        <AdminDataTable
          columns={ROLE_COLUMNS}
          data={filtered}
          storageKey="fna-table-roles"
          toolbar
          toolbarSlot={<ViewSwitcher views={ROLES_VIEWS} activeView={viewMode} onChange={setViewMode} />}
          sortable
          filterable
          columnVisibility
          columnReorder
          columnResize
          selectable
          freezePanes
          exportCsv
          onBatchDelete={async (ids) => {
            await batchDeleteRoles(ids);
            setRoles((prev) => prev.filter((r) => !ids.includes(r.id)));
          }}
          emptyMessage={search ? 'No matching roles.' : 'No roles yet.'}
          rowActions={[
            {
              label: 'Rename',
              icon: <Pencil size={13} />,
              onClick: (row) => {
                setViewMode('list');
                setTimeout(() => setEditingId(row.id), 100);
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
        <ViewSwitcher views={ROLES_VIEWS} activeView={viewMode} onChange={setViewMode} />
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
        <div>
          <div className="bg-admin-bg-sidebar border border-admin-border-subtle rounded-xl">
            <div className="divide-y divide-admin-border">
              {filtered.length === 0 && !addingNew && (
                <div className="px-5 py-8 text-center text-xs text-admin-text-ghost">
                  {search ? 'No matching roles' : 'No roles yet'}
                </div>
              )}
              {filtered.map((role) => {
                const isEditing = editingId === role.id;
                const isDeleting = pendingDeleteId === role.id;
                const isSelected = selectedIds.has(role.id);
                const isExpanded = expandedId === role.id;
                const isLoadingPeople = loadingId === role.id;
                const cachedPeople = peopleCache.get(role.id);

                return (
                  <React.Fragment key={role.id}>
                    <div
                      onClick={() => role.peopleCount > 0 && !isEditing && !isDeleting && handleToggleExpand(role)}
                      className={`flex items-center gap-3 px-5 py-2.5 group transition-colors ${role.peopleCount > 0 && !isEditing && !isDeleting ? 'cursor-pointer' : ''} ${isSelected ? 'bg-admin-bg-subtle' : isExpanded ? 'bg-admin-bg-subtle' : 'hover:bg-admin-bg-subtle'}`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleSelect(role.id); }}
                        disabled={isPending}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-white' : 'border-admin-border-subtle group-hover:border-admin-border-emphasis'}`}
                      >
                        {isSelected && <Check size={10} className="text-black" strokeWidth={2.5} />}
                      </button>

                      {isEditing ? (
                        <InlineEdit
                          value={role.name}
                          onSave={(v) => { handleRename(role.id, v); setEditingId(null); }}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : isDeleting ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-admin-text-muted flex-1">
                            Remove? Used by <strong className="text-admin-text-primary">{role.peopleCount}</strong> people, <strong className="text-admin-text-primary">{role.projectCount}</strong> projects
                          </span>
                          <button onClick={() => { handleDelete(role.id); setPendingDeleteId(null); }} disabled={isPending} className="px-2.5 py-1 text-xs rounded bg-admin-danger-bg-strong text-admin-danger border border-admin-danger-border hover:bg-red-500/30 transition-colors disabled:opacity-50">
                            {isPending ? '...' : 'Delete'}
                          </button>
                          <button onClick={() => setPendingDeleteId(null)} disabled={isPending} className="px-2.5 py-1 text-xs rounded bg-admin-bg-hover text-admin-text-muted hover:text-admin-text-primary transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0 text-sm text-admin-text-primary truncate">{role.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(role.id); setPendingDeleteId(null); }}
                              disabled={isPending}
                              className="p-1 rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                              title="Rename"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPendingDeleteId(role.id); setEditingId(null); }}
                              disabled={isPending}
                              className="p-1 rounded text-admin-text-faint hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          {/* Counts */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="flex items-center gap-1 text-xs tabular-nums text-admin-text-faint" title="People">
                              <Users size={10} />
                              {role.peopleCount}
                            </span>
                            <span className="flex items-center gap-1 text-xs tabular-nums text-admin-text-faint" title="Projects">
                              <Clapperboard size={10} />
                              {role.projectCount}
                            </span>
                            {role.peopleCount > 0 && (
                              <ChevronRight size={10} className={`text-admin-text-faint transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Expanded people list */}
                    {isExpanded && (
                      <div className="py-2 bg-admin-bg-subtle">
                        {isLoadingPeople ? (
                          <div className="px-5 py-3 text-xs text-admin-text-ghost">Loading...</div>
                        ) : cachedPeople && cachedPeople.length > 0 ? (
                          <div>
                            {cachedPeople.map((person) => (
                              <div key={person.id} className="flex items-center gap-3 px-5 py-1.5">
                                <span className="w-4 flex items-center justify-center flex-shrink-0">
                                  <span className={`w-1.5 h-1.5 rounded-full ${person.type === 'cast' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                                </span>
                                <span className="text-xs text-admin-text-primary/80 flex-1 min-w-0 truncate">{person.first_name} {person.last_name}</span>
                                <span className="text-xs text-admin-text-ghost capitalize">{person.type}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-3 text-xs text-admin-text-ghost">No people found</div>
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
                      placeholder="New role name..."
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
        </div>
      </div>
      </>
      )}

      {mergeState && (
        <MergeDialog
          roles={roles}
          sourceIds={mergeState.sourceIds}
          onClose={() => setMergeState(null)}
          onMerge={handleMerge}
          isPending={isPending}
        />
      )}
    </div>
  );
}
