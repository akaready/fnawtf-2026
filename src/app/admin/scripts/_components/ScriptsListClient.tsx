'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { createScript, deleteScript, batchDeleteScripts } from '@/app/admin/actions';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import {
  AdminDeleteModal,
  relativeTime,
} from '@/app/admin/_components/AdminTable';
import { StatusBadge } from '../../_components/StatusBadge';
import { SCRIPT_STATUSES } from '../../_components/statusConfigs';
import { AdminDataTable, type ColDef, type RowAction } from '@/app/admin/_components/table';
import type { ScriptWithProject, ScriptStatus } from '@/types/scripts';

interface Props {
  scripts: ScriptWithProject[];
}

const STATUS_TABS: { value: ScriptStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'locked', label: 'Locked' },
];

export function ScriptsListClient({ scripts: initialScripts }: Props) {
  const router = useRouter();
  const [scripts, setScripts] = useState(initialScripts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScriptStatus | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<ScriptWithProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, startCreate] = useTransition();

  // Collapse versions: show only the latest version per script_group_id
  const { latestScripts, versionCounts } = useMemo(() => {
    const groups = new Map<string, ScriptWithProject[]>();
    const standalone: ScriptWithProject[] = [];

    for (const s of scripts) {
      if (s.script_group_id) {
        const group = groups.get(s.script_group_id) ?? [];
        group.push(s);
        groups.set(s.script_group_id, group);
      } else {
        standalone.push(s);
      }
    }

    const latest: ScriptWithProject[] = [...standalone];
    const counts: Record<string, number> = {};

    for (const [, group] of groups) {
      group.sort((a, b) => b.version - a.version);
      latest.push(group[0]);
      counts[group[0].id] = group.length;
    }

    // Sort by updated_at descending
    latest.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return { latestScripts: latest, versionCounts: counts };
  }, [scripts]);

  const filtered = latestScripts.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    if (!matchesStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.project?.title ?? '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteScript(deleteTarget.id);
      // Remove this version from state — the useMemo will re-collapse and surface
      // the next latest version (if any) for this group
      setScripts((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns: ColDef<ScriptWithProject>[] = [
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-admin-text-primary">{row.title}</span>
      ),
    },
    {
      key: 'project',
      label: 'Project',
      type: 'text',
      sortable: true,
      render: (row) => (
        <span className="text-admin-text-secondary">
          {row.project?.title ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      sortable: true,
      options: STATUS_TABS.filter((t) => t.value !== 'all').map((t) => ({ value: t.value, label: t.label })),
      render: (row) => <StatusBadge status={row.status} config={SCRIPT_STATUSES} />,
    },
    {
      key: 'version',
      label: 'Version',
      type: 'number',
      sortable: true,
      defaultWidth: 100,
      render: (row) => {
        const count = versionCounts[row.id] ?? 1;
        return (
          <span className="text-admin-text-dim font-mono text-xs">
            v{row.version}
            {count > 1 && (
              <span className="text-admin-text-faint ml-1">({count})</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'updated_at',
      label: 'Updated',
      type: 'date',
      sortable: true,
      render: (row) => (
        <span className="text-admin-text-dim text-xs">{relativeTime(row.updated_at)}</span>
      ),
    },
  ];

  const rowActions: RowAction<ScriptWithProject>[] = [
    {
      icon: <Trash2 size={13} />,
      label: 'Delete script',
      variant: 'danger',
      onClick: (row) => setDeleteTarget(row),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Scripts"
        subtitle={`${latestScripts.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search scripts…"
        actions={
          <button
            onClick={() =>
              startCreate(async () => {
                const id = await createScript({ title: 'Untitled Script' });
                router.push(`/admin/scripts/${id}`);
              })
            }
            disabled={isCreating}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {isCreating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            New Script
          </button>
        }
        mobileActions={
          <button
            onClick={() =>
              startCreate(async () => {
                const id = await createScript({ title: 'Untitled Script' });
                router.push(`/admin/scripts/${id}`);
              })
            }
            disabled={isCreating}
            className="btn-primary p-2.5 text-sm"
            title="New Script"
          >
            {isCreating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
          </button>
        }
      />

      <AdminDataTable
        data={filtered}
        columns={columns}
        storageKey="fna-table-scripts"
        toolbar
        sortable
        filterable
        columnVisibility
        columnReorder
        columnResize
        selectable
        rowActions={rowActions}
        onRowClick={(row) => router.push(`/admin/scripts/${row.id}`)}
        toolbarSlot={
          <>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                  statusFilter === tab.value
                    ? 'bg-admin-bg-active text-admin-text-primary border-transparent'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                }`}
              >
                {tab.label}
                {tab.value !== 'all' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                      statusFilter === tab.value
                        ? 'bg-admin-bg-active'
                        : 'bg-admin-bg-hover text-admin-text-faint'
                    }`}
                  >
                    {latestScripts.filter((s) => s.status === tab.value).length}
                  </span>
                )}
              </button>
            ))}
          </>
        }
        onBatchDelete={async (ids) => {
          await batchDeleteScripts(ids);
          setScripts((prev) => prev.filter((s) => !ids.includes(s.id)));
        }}
        emptyMessage={
          search || statusFilter !== 'all'
            ? 'No scripts match your filters.'
            : 'No scripts yet.'
        }
        emptyAction={
          !search && statusFilter === 'all'
            ? {
                label: 'Create your first script',
                onClick: () =>
                  startCreate(async () => {
                    const id = await createScript({ title: 'Untitled Script' });
                    router.push(`/admin/scripts/${id}`);
                  }),
              }
            : undefined
        }
      />

      {deleteTarget && (
        <AdminDeleteModal
          title="Delete script?"
          description={
            <>
              <span className="text-admin-text-secondary">{deleteTarget.title}</span> — this
              action cannot be undone.
            </>
          }
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
